const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');
const config = require('../../config.js');

module.exports = {
    name: 'afk',
    description: 'Set your AFK status with a reason (and optional image)',
    category: 'utility',
    owner: false,
    userPerms: [],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const reason = interaction.options.getString('reason');
        const image = interaction.options.getAttachment('image');
        const withNewlines = reason.replace(/\\n/g, '\n');
        const { result: finalReason, invalid } = await client.replaceEmojiPlaceholders(withNewlines, interaction.client, interaction.guild);
        if (invalid.length) {
            return messages.error(interaction, `Invalid emoji identifiers:\n${invalid.map(id => `• ${id}`).join('\n')}`);;
        }

        let imageUrl = image?.url || null;
        const confirmEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('Are you sure you want to set your AFK reason to:')
            .setDescription(finalReason)
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();
        if (imageUrl) confirmEmbed.setImage(imageUrl);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('confirm_afk').setLabel('Confirm').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('cancel_afk').setLabel('Cancel').setStyle(ButtonStyle.Danger)
            );

        await interaction.editReply({ embeds: [confirmEmbed], components: [row] });

        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 45000, max: 1 });

        collector.on('collect', async i => {
            if (i.customId === 'confirm_afk') {
                const success = await client.db.setAFK(interaction.user.id, finalReason, imageUrl);
                if (success) {
                    await i.update({ embeds: [new EmbedBuilder().setColor(config.embedColor).setDescription(`${emojis.success} AFK set in all servers!`)], components: [] });
                } else {
                    await i.update({ embeds: [new EmbedBuilder().setColor(0xff5555).setDescription(`${emojis.error} Failed to set AFK status.`)], components: [] });
                }
            } else {
                await i.update({ embeds: [new EmbedBuilder().setColor(0xff5555).setDescription(`${emojis.error} AFK command cancelled.`)], components: [] });
            }
            collector.stop();
        });

        collector.on('end', async () => {
            const disabledRow = ActionRowBuilder.from(row).setComponents(row.components.map(c => ButtonBuilder.from(c).setDisabled(true)));
            await interaction.editReply({ components: [disabledRow] }).catch(() => {});
        });
    },
    prefixExecute: async (message, args, client) => {
        let reason = 'No reason provided';
        let imageUrl = null;

        const fullMessage = args.join(' ');
        const quoteRegex = /^"([^"]+)"\s*(.*)$/;
        const quoteMatch = fullMessage.match(quoteRegex);

        if (quoteMatch) {
            reason = quoteMatch[1].replace(/\\\\n/g, '\u0000').replace(/\\n/g, '\n').replace(/\u0000/g, '\\n');
            const rest = quoteMatch[2].trim();
            const urlRegex = /(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp)(?:\?[^\s]*)?)/i;
            const urlMatch = rest.match(urlRegex);
            if (urlMatch) imageUrl = urlMatch[0];
        } else {
            reason = fullMessage;
            const urlRegex = /(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp)(?:\?[^\s]*)?)/i;
            const urlMatch = reason.match(urlRegex);
            if (urlMatch) {
                imageUrl = urlMatch[0];
                reason = reason.replace(urlRegex, '').trim();
            }
            reason = reason.replace(/\\\\n/g, '\u0000').replace(/\\n/g, '\n').replace(/\u0000/g, '\\n');
            if (!reason) reason = 'No reason provided';
        }

        if (message.attachments.size) {
            imageUrl = message.attachments.first().url;
        }

        const confirmEmbed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('Are you sure you want to set your AFK reason to:')
            .setDescription(reason)
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();
        if (imageUrl) confirmEmbed.setImage(imageUrl);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('confirm_afk').setLabel('Confirm').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('cancel_afk').setLabel('Cancel').setStyle(ButtonStyle.Danger)
            );

        const confirmMsg = await message.reply({ embeds: [confirmEmbed], components: [row] });
        const filter = i => i.user.id === message.author.id;
        const collector = confirmMsg.createMessageComponentCollector({ filter, time: 45000, max: 1 });

        collector.on('collect', async i => {
            await i.deferUpdate();
            if (i.customId === 'confirm_afk') {
                const success = await client.db.setAFK(message.author.id, reason, imageUrl);
                if (success) {
                    await confirmMsg.delete().catch(() => {});
                    await message.channel.send({ embeds: [new EmbedBuilder().setColor(config.embedColor).setDescription(`${emojis.success} AFK set in all servers!`)] });
                } else {
                    await confirmMsg.delete().catch(() => {});
                    await message.channel.send(`${emojis.error} Failed to set AFK status.`);
                }
            } else {
                await confirmMsg.delete().catch(() => {});
                await message.channel.send({ embeds: [new EmbedBuilder().setColor(0xff5555).setDescription(`${emojis.error} AFK command confirmation cancelled!`)] });
            }
            collector.stop();
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                await confirmMsg.delete().catch(() => {});
                await message.channel.send({ embeds: [new EmbedBuilder().setColor(0xffaa00).setDescription(`${emojis.error} AFK command confirmation timed out!`)] });
            }
        });
    }
};