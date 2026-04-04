const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');
const config = require('../../config.js');
const { aliases } = require('./avatar.js');

function buildImageEmbed(title, imageUrl, requester) {
    return new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(title)
        .setDescription(`[Download](${imageUrl})`)
        .setImage(imageUrl)
        .setFooter({ text: `Requested by ${requester.tag}`, iconURL: requester.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();
}

async function sendImageWithDMButton(channel, embed, requester) {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`image_dm_${requester.id}`).setLabel('Send in DM').setStyle(ButtonStyle.Secondary)
    );
    const sentMsg = await channel.send({ embeds: [embed], components: [row] });
    const filter = i => i.customId === `image_dm_${requester.id}` && i.user.id === requester.id;
    const collector = sentMsg.createMessageComponentCollector({ filter, time: 120000 });
    collector.on('collect', async i => {
        try {
            await i.user.send({ embeds: [embed.setFooter(null).setTimestamp()] });
            await i.reply({ content: `${emojis.success} Image sent to your DMs!`, flags: MessageFlags.Ephemeral });
        } catch {
            await i.reply({ content: `${emojis.error} Could not send you a DM. Please make sure your DMs are open.`, flags: MessageFlags.Ephemeral });
        }
    });
    collector.on('end', async () => {
        const disabledRow = ActionRowBuilder.from(row).setComponents(row.components.map(c => ButtonBuilder.from(c).setDisabled(true)));
        await sentMsg.edit({ components: [disabledRow] }).catch(() => {});
    });
}

module.exports = {
    name: 'banner',
    aliases: ['bn'],
    description: "View a user's banner",
    category: 'utility',
    owner: false,
    userPerms: [],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const fullUser = await interaction.client.users.fetch(targetUser.id, { force: true });
        const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        const hasGlobalBanner = !!fullUser.banner;
        const hasServerBanner = !!(member && member.banner);

        const sendBanner = async (type) => {
            let bannerURL, title;
            if (type === 'server' && member && member.banner) {
                bannerURL = member.bannerURL({ dynamic: true, size: 4096 });
                title = `${emojis.blackbutterfly} ${targetUser.username}'s server banner`;
            } else if (type === 'global' && fullUser.banner) {
                bannerURL = fullUser.bannerURL({ dynamic: true, size: 4096 });
                title = `${emojis.blackbutterfly} ${targetUser.username}'s global banner`;
            } else {
                return messages.error(interaction, "No banner found.");
            }
            const embed = buildImageEmbed(title, bannerURL, interaction.user);
            await sendImageWithDMButton(interaction, embed, interaction.user);
        };

        if (hasServerBanner && hasGlobalBanner) {
            const promptEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${emojis.info} Choose Banner`)
                .setDescription(`${targetUser.username} has both a server and global banner. Which one?`)
                .setFooter({ text: 'You have 60 seconds' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`server_banner_${targetUser.id}`).setLabel('Server Banner').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`global_banner_${targetUser.id}`).setLabel('Global Banner').setStyle(ButtonStyle.Success)
            );

            await interaction.editReply({ embeds: [promptEmbed], components: [row] });
            const filter = i => i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000, max: 1 });

            collector.on('collect', async i => {
                if (i.customId.startsWith('server_banner')) {
                    await sendBanner('server');
                } else {
                    await sendBanner('global');
                }
                await i.update({ components: [] });
            });

            collector.on('end', () => {
                interaction.editReply({ components: [] }).catch(() => {});
            });
        } else if (hasServerBanner) {
            await sendBanner('server');
        } else if (hasGlobalBanner) {
            await sendBanner('global');
        } else {
            await messages.error(interaction, `${targetUser.username} does not have any banner.`);
        }
    },
    prefixExecute: async (message, args, client) => {
        let targetUser = message.author;
        let targetGuild = null;
        let member = null;
        let hasServerBanner = false;
        let hasGlobalBanner = false;

        if (args.length) {
            const firstArg = args[0].toLowerCase();
            if (firstArg === 'bot') {
                targetUser = client.user;
                member = await message.guild.members.fetch({ user: targetUser.id, force: true }).catch(() => null);
                if (!member) return messages.error(message.channel, 'Bot is not a member of this server?');
            } else if (firstArg === 'server') {
                targetGuild = message.guild;
                if (!targetGuild.banner) return messages.error(message.channel, 'This server does not have a banner.');
                const bannerURL = targetGuild.bannerURL({ dynamic: true, size: 4096 });
                const embed = buildImageEmbed(`${emojis.blackbutterfly} ${targetGuild.name}'s banner`, bannerURL, message.author);
                return sendImageWithDMButton(message.channel, embed, message.author);
            } else {
                const mention = args[0].match(/^<@!?(\d+)>$/);
                const userId = mention ? mention[1] : args[0];
                try {
                    targetUser = await client.users.fetch(userId, { force: true });
                } catch {
                    return messages.error(message.channel, 'Invalid user!');
                }
                member = await message.guild.members.fetch({ user: targetUser.id, force: true }).catch(() => null);
                if (!member) return messages.error(message.channel, 'That user is not a member of this server!');
            }
        } else {
            targetUser = await client.users.fetch(message.author.id, { force: true });
            member = await message.guild.members.fetch({ user: targetUser.id, force: true }).catch(() => null);
        }

        hasGlobalBanner = !!targetUser.banner;
        hasServerBanner = !!(member && member.banner);

        const sendBanner = async (type) => {
            let bannerURL, title;
            if (type === 'server' && member && member.banner) {
                bannerURL = member.bannerURL({ dynamic: true, size: 4096 });
                title = `${emojis.blackbutterfly} ${targetUser.username}'s server banner`;
            } else if (type === 'global' && targetUser.banner) {
                bannerURL = targetUser.bannerURL({ dynamic: true, size: 4096 });
                title = `${emojis.blackbutterfly} ${targetUser.username}'s global banner`;
            } else {
                return messages.error(message.channel, 'That banner is no longer available.');
            }
            const embed = buildImageEmbed(title, bannerURL, message.author);
            await sendImageWithDMButton(message.channel, embed, message.author);
        };

        if (hasServerBanner && hasGlobalBanner) {
            const promptEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${emojis.info} Choose Banner`)
                .setDescription(`${targetUser.username} has both a server‑specific banner and a global banner. Which one would you like to see?`)
                .setFooter({ text: 'You have 60 seconds to decide' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`server_banner_${targetUser.id}`).setLabel('Server Banner').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`global_banner_${targetUser.id}`).setLabel('Global Banner').setStyle(ButtonStyle.Success)
            );

            const promptMsg = await message.channel.send({ embeds: [promptEmbed], components: [row] });
            const filter = i => i.user.id === message.author.id;
            const collector = promptMsg.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                await i.deferUpdate();
                collector.stop();
                if (i.customId.startsWith('server_banner')) {
                    await sendBanner('server');
                } else {
                    await sendBanner('global');
                }
                await promptMsg.delete();
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    const disabledRow = ActionRowBuilder.from(row).setComponents(row.components.map(c => ButtonBuilder.from(c).setDisabled(true)));
                    await promptMsg.edit({ components: [disabledRow] }).catch(() => {});
                }
            });
        } else if (hasServerBanner && !hasGlobalBanner) {
            await sendBanner('server');
        } else if (!hasServerBanner && hasGlobalBanner) {
            await sendBanner('global');
        } else {
            return messages.error(message.channel, `${targetUser.username} does not have any banner.`);
        }
    }
};