const { AttachmentBuilder } = require('discord.js');
const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');
const { PermissionsBitField } = require('discord.js');
const ownerId = require('../../config.js').ownerId;

module.exports = {
    name: 'say',
    description: 'Make the bot say something',
    category: 'utility',
    owner: false,
    userPerms: ['ManageMessages'],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const text = interaction.options.getString('text');
        const attachment = interaction.options.getAttachment('attachment');

        const withNewlines = text.replace(/\\n/g, '\n');
        const { result: finalText, invalid } = await client.replaceEmojiPlaceholders(withNewlines, interaction.client, interaction.guild);
        if (invalid.length) {
            return messages.error(interaction, `Invalid emoji identifiers:\n${invalid.map(id => `• ${id}`).join('\n')}`);
        }

        let files = [];
        if (attachment) {
            const response = await fetch(attachment.url);
            const buffer = Buffer.from(await response.arrayBuffer());
            files.push(new AttachmentBuilder(buffer, { name: attachment.name }));
        }

        await interaction.channel.send({ content: finalText || null, files: files.length ? files : undefined });
        await messages.success(interaction, "Message sent.");
    },
    prefixExecute: async (message, args, client) => {
        const isOwner = message.author.id === ownerId;
        const hasManageMessages = message.member.permissions.has(PermissionsBitField.Flags.ManageMessages);
        const hasAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);
        if (!isOwner && !hasManageMessages && !hasAdmin) {
            return messages.error(message, "You need `Manage Messages` or `Administrator` permission.");
        }

        const rawText = message.content.slice(client.prefix.length + 'say'.length).replace(/^\s+/, '');
        if (!rawText && !message.attachments.size) {
            return messages.error(message, "You need to provide something to say or attach a file!");
        }

        let processed = rawText
            .replace(/\\\\n/g, '\u0000')
            .replace(/\\n/g, '\n')
            .replace(/\u0000/g, '\\n');

        let anyInvalidEmoji = false;
        const emojiRegex = /-emoji-([^\s]+)/g;
        const placeholders = [];
        let match;
        while ((match = emojiRegex.exec(processed))) {
            placeholders.push(match[0]);
        }

        if (placeholders.length) {
            const emojiMap = new Map();
            await Promise.all(placeholders.map(async fullMatch => {
                const inner = fullMatch.slice(7);
                const parts = inner.split('/$/');
                const resolvedParts = [];
                for (const part of parts) {
                    const emoji = await client.resolveEmoji(client, part, message.guild);
                    if (emoji) {
                        resolvedParts.push(emoji.toString());
                    } else {
                        anyInvalidEmoji = true;
                    }
                }
                emojiMap.set(fullMatch, resolvedParts.join(''));
            }));
            processed = processed.replace(emojiRegex, match => emojiMap.get(match) || '');
        }

        let files = [];
        if (message.attachments.size) {
            files = await Promise.all(message.attachments.map(async attachment => {
                const response = await fetch(attachment.url);
                const buffer = Buffer.from(await response.arrayBuffer());
                return new AttachmentBuilder(buffer, { name: attachment.name });
            }));
        }

        await message.delete().catch(() => {});

        const sendOptions = { content: processed || null, files: files.length ? files : undefined };
        if (message.reference) {
            try {
                const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
                await repliedMessage.reply(sendOptions);
            } catch {
                await message.channel.send(sendOptions);
            }
        } else {
            await message.channel.send(sendOptions);
        }

        if (anyInvalidEmoji) {
            const errorMsg = await messages.error(message.channel, "Any one of the emoji IDs were invalid!");
            setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
        }
    }
};