const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');
const config = require('../../config.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, AttachmentBuilder } = require('discord.js');
const { createSongQuoteImage } = require('../../utils/songQuoteGenerator');

async function getAttachmentUrlWithRetry(msg, maxRetries = 10, delayMs = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        if (msg.attachments && msg.attachments.size > 0) {
            return msg.attachments.first().url;
        }
        if (msg.embeds && msg.embeds.length > 0 && msg.embeds[0].image && msg.embeds[0].image.url) {
            return msg.embeds[0].image.url;
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
        try {
            msg = await msg.fetch();
        } catch (fetchError) {
            console.error(`Attachment fetch attempt ${attempt} failed: ${fetchError.message}`);
        }
    }
    throw new Error('Failed to retrieve attachment URL after multiple attempts');
}

module.exports = {
    name: 'song-quote',
    description: 'Create a quote image with current track',
    category: 'music',
        owner: false,
    userPerms: [],
    botPerms: [],
    player: true,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const text = interaction.options.getString('text');
        const player = client.riffy.players.get(interaction.guild.id);
        if (!player || !player.current) {
            return messages.error(interaction, "No track is currently playing!");
        }

        await messages.info(interaction, "Generating your song quote...");

        try {
            const track = player.current;
            const processedText = text.replace(/\\n/g, '\n');
            const imageBuffer = await createSongQuoteImage(track, processedText);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'song-quote.png' });

            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${emojis.blackbutterfly} Song Quote Generated`)
                .setDescription(`**${track.info.title}** - ${track.info.author || 'Unknown Artist'}`)
                .setImage('attachment://song-quote.png')
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            await interaction.editReply({ content: null, embeds: [embed], files: [attachment] });
            const reply = await interaction.fetchReply();

            const attachmentUrl = await getAttachmentUrlWithRetry(reply);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setLabel('Download').setStyle(ButtonStyle.Link).setURL(attachmentUrl),
                    new ButtonBuilder().setCustomId(`song_quote_dm_${interaction.user.id}`).setLabel('Send in DM').setStyle(ButtonStyle.Secondary)
                );

            await interaction.editReply({ components: [row] });

            const filter = i => i.customId === `song_quote_dm_${interaction.user.id}` && i.user.id === interaction.user.id;
            const collector = reply.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor(config.embedColor)
                        .setTitle(`${emojis.blackbutterfly} Song Quote Generated`)
                        .setDescription(`**${track.info.title}** - ${track.info.author || 'Unknown Artist'}`)
                        .setImage(attachmentUrl)
                        .setFooter({ text: `Requested by ${i.user.tag}` })
                        .setTimestamp();
                    await i.user.send({ embeds: [dmEmbed] });
                    await i.reply({ content: `${emojis.success} Image sent to your DMs!`, flags: MessageFlags.Ephemeral });
                } catch (error) {
                    await i.reply({ content: `${emojis.error} Could not send you a DM. Please make sure your DMs are open.`, flags: MessageFlags.Ephemeral });
                }
            });

            collector.on('end', async () => {
                const disabledRow = ActionRowBuilder.from(row).setComponents(row.components.map(c => ButtonBuilder.from(c).setDisabled(true)));
                await interaction.editReply({ components: [disabledRow] }).catch(() => {});
            });
        } catch (error) {
            console.error(`Song quote error: ${error.message}`);
            await messages.error(interaction, `Failed to generate song quote: ${error.message}`);
        }
    },
    prefixExecute: async (message, args, client) => {
        const text = args.join(' ');
        if (!text) return messages.error(message, "Please provide text for the quote!");

        const player = client.riffy.players.get(message.guild.id);
        if (!player || !player.current) {
            return messages.error(message, "No track is currently playing!");
        }

        const loadingMsg = await message.channel.send(`${emojis.loading} | Generating your song quote...`);

        try {
            const track = player.current;
            const processedText = text.replace(/\\n/g, '\n');
            const imageBuffer = await createSongQuoteImage(track, processedText);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'song-quote.png' });

            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${emojis.blackbutterfly} Song Quote Generated`)
                .setDescription(`**${track.info.title}** - ${track.info.author || 'Unknown Artist'}`)
                .setImage('attachment://song-quote.png')
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();

            const sentMsg = await message.channel.send({ embeds: [embed], files: [attachment] });
            setTimeout(() => loadingMsg.delete().catch(() => {}), 2000);

            const attachmentUrl = await getAttachmentUrlWithRetry(sentMsg);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setLabel('Download').setStyle(ButtonStyle.Link).setURL(attachmentUrl),
                    new ButtonBuilder().setCustomId(`song_quote_dm_${message.author.id}`).setLabel('Send in DM').setStyle(ButtonStyle.Secondary)
                );

            await sentMsg.edit({ components: [row] });

            const filter = i => i.customId === `song_quote_dm_${message.author.id}` && i.user.id === message.author.id;
            const collector = sentMsg.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor(config.embedColor)
                        .setTitle(`${emojis.blackbutterfly} Song Quote Generated`)
                        .setDescription(`**${track.info.title}** - ${track.info.author || 'Unknown Artist'}`)
                        .setImage(attachmentUrl)
                        .setFooter({ text: `Requested by ${i.user.tag}` })
                        .setTimestamp();
                    await i.user.send({ embeds: [dmEmbed] });
                    await i.reply({ content: `${emojis.success} Image sent to your DMs!`, flags: MessageFlags.Ephemeral });
                } catch (error) {
                    await i.reply({ content: `${emojis.error} Could not send you a DM. Please make sure your DMs are open.`, flags: MessageFlags.Ephemeral });
                }
            });

            collector.on('end', async () => {
                const disabledRow = ActionRowBuilder.from(row).setComponents(row.components.map(c => ButtonBuilder.from(c).setDisabled(true)));
                await sentMsg.edit({ components: [disabledRow] }).catch(() => {});
            });
        } catch (error) {
            console.error(`Song quote error: ${error.message}`);
            if (loadingMsg) setTimeout(() => loadingMsg.delete().catch(() => {}), 2000);
            await messages.error(message, `Failed to generate song quote: ${error.message}`);
        }
    }
};