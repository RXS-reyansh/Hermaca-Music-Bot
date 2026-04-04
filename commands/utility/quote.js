const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags, AttachmentBuilder } = require('discord.js');
const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');
const config = require('../../config.js');
const { createQuoteImage } = require('../../utils/quoteGenerator');

async function regenerateQuote(interaction, sentMsg, quotedMessage, options, oldAttachmentUrl) {
    try {
        const newImageBuffer = await createQuoteImage(quotedMessage, options);
        const newAttachment = new AttachmentBuilder(newImageBuffer, { name: 'quote.png' });
        const newEmbed = EmbedBuilder.from(sentMsg.embeds[0]).setImage('attachment://quote.png');

        await sentMsg.edit({ embeds: [newEmbed], files: [newAttachment] });
        const updatedMsg = await sentMsg.fetch();
        const newAttachmentUrl = updatedMsg.attachments.first()?.url;
        return newAttachmentUrl || oldAttachmentUrl;
    } catch (error) {
        console.error(`Regeneration error: ${error.message}`);
        throw error;
    }
}

function buildQuoteRows(options, attachmentUrl, userId) {
    if (options.cancelled) return [];

    if (!options.confirmed) {
        const rows = [];

        rows.push(new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('quote_theme_light').setLabel('☀️ Light').setStyle(options.theme === 'light' ? ButtonStyle.Primary : ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('quote_theme_dark').setLabel('🌙 Dark').setStyle(options.theme === 'dark' ? ButtonStyle.Primary : ButtonStyle.Secondary)
        ));

        rows.push(new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('quote_layout_layout1').setLabel('📐 Layout 1').setStyle(options.layout === 'layout1' ? ButtonStyle.Primary : ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('quote_layout_layout2').setLabel('📏 Layout 2').setStyle(options.layout === 'layout2' ? ButtonStyle.Primary : ButtonStyle.Secondary)
        ));

        const colorEmoji = emojis.colorToggle || '🎨';
        const boldEmoji = emojis.boldToggle || '✍️';
        const positionEmoji = emojis.positionToggle || '↔️';

        rows.push(new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('quote_toggle_color').setEmoji(colorEmoji).setStyle(options.avatarColor ? ButtonStyle.Primary : ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('quote_toggle_bold').setEmoji(boldEmoji).setStyle(options.boldText ? ButtonStyle.Primary : ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('quote_toggle_position').setEmoji(positionEmoji).setStyle(options.avatarPosition === 'right' ? ButtonStyle.Primary : ButtonStyle.Secondary)
        ));

        const fontSelect = new StringSelectMenuBuilder()
            .setCustomId('quote_font_select')
            .setPlaceholder('Choose a font')
            .addOptions([
                { label: 'Poppins', value: 'Poppins', default: options.fontFamily === 'Poppins' },
                { label: 'Roboto', value: 'Roboto', default: options.fontFamily === 'Roboto' },
                { label: 'Open Sans', value: 'Open Sans', default: options.fontFamily === 'Open Sans' },
                { label: 'Georgia', value: 'Georgia', default: options.fontFamily === 'Georgia' }
            ]);
        rows.push(new ActionRowBuilder().addComponents(fontSelect));

        const confirmEmoji = emojis.success || '✅';
        const cancelEmoji = emojis.error || '❌';
        rows.push(new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('quote_confirm').setEmoji(confirmEmoji).setLabel('Confirm').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('quote_cancel').setEmoji(cancelEmoji).setLabel('Cancel').setStyle(ButtonStyle.Danger)
        ));
        return rows;
    } else {
        const downloadButton = new ButtonBuilder().setLabel('Download').setStyle(ButtonStyle.Link).setURL(attachmentUrl || 'https://discord.com');
        if (!attachmentUrl) downloadButton.setDisabled(true);
        const dmButton = new ButtonBuilder().setCustomId(`quote_dm_${userId}`).setLabel('Send in DM').setStyle(ButtonStyle.Secondary);
        return [new ActionRowBuilder().addComponents(downloadButton, dmButton)];
    }
}

module.exports = {
    name: 'quote',
    description: 'Generate a quote image from a message',
    category: 'utility',
    owner: false,
    userPerms: [],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const messageId = interaction.options.getString('message_id');
        const customText = interaction.options.getString('text') || null;
        const channel = interaction.channel;

        let quotedMessage;
        try {
            quotedMessage = await channel.messages.fetch(messageId);
        } catch {
            return messages.error(interaction, "Could not fetch that message!");
        }

        if (!quotedMessage.content && !quotedMessage.attachments.size) {
            return messages.error(interaction, "That message has no text or attachments to quote!");
        }

        const defaultOptions = {
            theme: 'light',
            avatarColor: true,
            avatarPosition: 'left',
            boldText: false,
            layout: 'layout1',
            fontFamily: 'Poppins',
            customText: customText || '',
            confirmed: false,
            cancelled: false
        };
        let currentOptions = { ...defaultOptions };

        await messages.info(interaction, "Generating quote image...");
        const imageBuffer = await createQuoteImage(quotedMessage, currentOptions);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'quote.png' });
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.blackbutterfly} Quote Generated`)
            .setDescription(`Quoting **${quotedMessage.author.tag}**`)
            .setImage('attachment://quote.png')
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.editReply({ content: null, embeds: [embed], files: [attachment] });
        const sentMsg = await interaction.fetchReply();
        let attachmentUrl = sentMsg.attachments.first()?.url;

        const rows = buildQuoteRows(currentOptions, attachmentUrl, interaction.user.id);
        await interaction.editReply({ components: rows });

        if (!client.quoteOptions) client.quoteOptions = new Map();
        client.quoteOptions.set(sentMsg.id, currentOptions);

        const filter = i => i.customId.startsWith('quote_') && i.user.id === interaction.user.id;
        const collector = sentMsg.createMessageComponentCollector({ filter, time: 24 * 60 * 60 * 1000 });

        collector.on('collect', async i => {
            currentOptions = client.quoteOptions.get(sentMsg.id) || currentOptions;

            if (currentOptions.cancelled) {
                await i.reply({ content: 'This quote has been cancelled.', flags: MessageFlags.Ephemeral });
                return;
            }

            if (i.customId === 'quote_confirm') {
                currentOptions.confirmed = true;
                client.quoteOptions.set(sentMsg.id, currentOptions);
                const newRows = buildQuoteRows(currentOptions, attachmentUrl, interaction.user.id);
                await i.update({ components: newRows });
                return;
            }

            if (i.customId === 'quote_cancel') {
                currentOptions.cancelled = true;
                client.quoteOptions.set(sentMsg.id, currentOptions);
                const cancelEmbed = new EmbedBuilder()
                    .setColor(0xff5555)
                    .setDescription(`${emojis.error} | Cancelled by the user!`)
                    .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();
                await i.update({ embeds: [cancelEmbed], files: [], components: [] });
                collector.stop();
                return;
            }

            if (i.customId === `quote_dm_${interaction.user.id}`) {
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor(config.embedColor)
                        .setTitle(`${emojis.blackbutterfly} Quote Generated`)
                        .setDescription(`Quoting **${quotedMessage.author.tag}**`)
                        .setImage(attachmentUrl)
                        .setFooter({ text: `Requested by ${i.user.tag}` })
                        .setTimestamp();
                    await i.user.send({ embeds: [dmEmbed] });
                    await i.reply({ content: `${emojis.success} Image sent to your DMs!`, flags: MessageFlags.Ephemeral });
                } catch (error) {
                    await i.reply({ content: `${emojis.error} Could not send DM.`, flags: MessageFlags.Ephemeral });
                }
                return;
            }

            if (currentOptions.confirmed) {
                await i.reply({ content: 'Quote already confirmed. You can only download or send to DM.', flags: MessageFlags.Ephemeral });
                return;
            }

            if (i.customId === 'quote_font_select' && i.isStringSelectMenu()) {
                currentOptions.fontFamily = i.values[0];
                client.quoteOptions.set(sentMsg.id, currentOptions);
                await i.deferUpdate();
                try {
                    const newUrl = await regenerateQuote(i, sentMsg, quotedMessage, currentOptions, attachmentUrl);
                    attachmentUrl = newUrl;
                } catch (e) {
                    console.error(`Failed to regenerate after font change: ${e.message}`);
                }
                return;
            }

            await i.deferUpdate();

            if (i.customId === 'quote_theme_light') currentOptions.theme = 'light';
            else if (i.customId === 'quote_theme_dark') currentOptions.theme = 'dark';
            else if (i.customId === 'quote_layout_layout1') currentOptions.layout = 'layout1';
            else if (i.customId === 'quote_layout_layout2') currentOptions.layout = 'layout2';
            else if (i.customId === 'quote_toggle_bold') currentOptions.boldText = !currentOptions.boldText;
            else if (i.customId === 'quote_toggle_color') currentOptions.avatarColor = !currentOptions.avatarColor;
            else if (i.customId === 'quote_toggle_position') currentOptions.avatarPosition = currentOptions.avatarPosition === 'left' ? 'right' : 'left';
            else return;

            client.quoteOptions.set(sentMsg.id, currentOptions);
            try {
                const newUrl = await regenerateQuote(i, sentMsg, quotedMessage, currentOptions, attachmentUrl);
                attachmentUrl = newUrl;
            } catch (e) {
                console.error(`Failed to regenerate after toggle: ${e.message}`);
            }
        });

        collector.on('end', () => {
            client.quoteOptions.delete(sentMsg.id);
        });
    },
    prefixExecute: async (message, args, client) => {
        if (!message.reference) {
            return messages.error(message, "You must reply to a message to quote it!");
        }

        let quotedMessage;
        try {
            quotedMessage = await message.channel.messages.fetch(message.reference.messageId);
        } catch (error) {
            return messages.error(message, "Could not fetch the replied message!");
        }

        const rawText = message.content.slice(message.content.indexOf(' ') + 1).trim();
        const customText = rawText && rawText !== message.content ? rawText : null;

        if (!quotedMessage.content && quotedMessage.attachments.size === 0) {
            return messages.error(message, "That message has no text or attachments to quote!");
        }

        const defaultOptions = {
            theme: 'light',
            avatarColor: true,
            avatarPosition: 'left',
            boldText: false,
            layout: 'layout1',
            fontFamily: 'Poppins',
            customText: customText || '',
            confirmed: false,
            cancelled: false
        };
        let currentOptions = { ...defaultOptions };

        const loadingMsg = await message.channel.send(`${emojis.loading} | Generating quote image...`);
        const imageBuffer = await createQuoteImage(quotedMessage, currentOptions);
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'quote.png' });

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.blackbutterfly} Quote Generated`)
            .setDescription(`Quoting **${quotedMessage.author.tag}**`)
            .setImage('attachment://quote.png')
            .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        await loadingMsg.delete().catch(() => {});
        const sentMsg = await message.channel.send({ embeds: [embed], files: [attachment] });
        let attachmentUrl = sentMsg.attachments.first()?.url;

        const rows = buildQuoteRows(currentOptions, attachmentUrl, message.author.id);
        await sentMsg.edit({ components: rows });

        if (!client.quoteOptions) client.quoteOptions = new Map();
        client.quoteOptions.set(sentMsg.id, currentOptions);

        const filter = i => i.customId.startsWith('quote_') && i.user.id === message.author.id;
        const collector = sentMsg.createMessageComponentCollector({ filter, time: 24 * 60 * 60 * 1000 });

        collector.on('collect', async i => {
            currentOptions = client.quoteOptions.get(sentMsg.id) || currentOptions;

            if (currentOptions.cancelled) {
                await i.reply({ content: 'This quote has been cancelled.', flags: MessageFlags.Ephemeral });
                return;
            }

            if (i.customId === 'quote_confirm') {
                currentOptions.confirmed = true;
                client.quoteOptions.set(sentMsg.id, currentOptions);
                const newRows = buildQuoteRows(currentOptions, attachmentUrl, message.author.id);
                await i.update({ components: newRows });
                return;
            }

            if (i.customId === 'quote_cancel') {
                currentOptions.cancelled = true;
                client.quoteOptions.set(sentMsg.id, currentOptions);
                const cancelEmbed = new EmbedBuilder()
                    .setColor(0xff5555)
                    .setDescription(`${emojis.error} | Cancelled by the user!`)
                    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();
                await i.update({ embeds: [cancelEmbed], files: [], components: [] });
                collector.stop();
                return;
            }

            if (i.customId === `quote_dm_${message.author.id}`) {
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor(config.embedColor)
                        .setTitle(`${emojis.blackbutterfly} Quote Generated`)
                        .setDescription(`Quoting **${quotedMessage.author.tag}**`)
                        .setImage(attachmentUrl)
                        .setFooter({ text: `Requested by ${i.user.tag}` })
                        .setTimestamp();
                    await i.user.send({ embeds: [dmEmbed] });
                    await i.reply({ content: `${emojis.success} Image sent to your DMs!`, flags: MessageFlags.Ephemeral });
                } catch (error) {
                    await i.reply({ content: `${emojis.error} Could not send DM.`, flags: MessageFlags.Ephemeral });
                }
                return;
            }

            if (currentOptions.confirmed) {
                await i.reply({ content: 'Quote already confirmed. You can only download or send to DM.', flags: MessageFlags.Ephemeral });
                return;
            }

            if (i.customId === 'quote_font_select' && i.isStringSelectMenu()) {
                currentOptions.fontFamily = i.values[0];
                client.quoteOptions.set(sentMsg.id, currentOptions);
                await i.deferUpdate();
                try {
                    const newUrl = await regenerateQuote(i, sentMsg, quotedMessage, currentOptions, attachmentUrl);
                    attachmentUrl = newUrl;
                } catch (e) {
                    console.error(`Failed to regenerate after font change: ${e.message}`);
                }
                return;
            }

            await i.deferUpdate();

            if (i.customId === 'quote_theme_light') currentOptions.theme = 'light';
            else if (i.customId === 'quote_theme_dark') currentOptions.theme = 'dark';
            else if (i.customId === 'quote_layout_layout1') currentOptions.layout = 'layout1';
            else if (i.customId === 'quote_layout_layout2') currentOptions.layout = 'layout2';
            else if (i.customId === 'quote_toggle_bold') currentOptions.boldText = !currentOptions.boldText;
            else if (i.customId === 'quote_toggle_color') currentOptions.avatarColor = !currentOptions.avatarColor;
            else if (i.customId === 'quote_toggle_position') currentOptions.avatarPosition = currentOptions.avatarPosition === 'left' ? 'right' : 'left';
            else return;

            client.quoteOptions.set(sentMsg.id, currentOptions);
            try {
                const newUrl = await regenerateQuote(i, sentMsg, quotedMessage, currentOptions, attachmentUrl);
                attachmentUrl = newUrl;
            } catch (e) {
                console.error(`Failed to regenerate after toggle: ${e.message}`);
            }
        });

        collector.on('end', () => {
            client.quoteOptions.delete(sentMsg.id);
        });
    }
};