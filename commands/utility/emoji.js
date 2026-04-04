const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'emoji',
    description: 'Send emoji(s) as text',
    category: 'utility',
    owner: false,
    userPerms: [],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const emojisInput = interaction.options.getString('emojis');
        const tokens = emojisInput.split(/\s+/);
        const partsPerToken = tokens.map(token => token.split('/$/'));
        const resolvedGroups = [];
        const invalid = [];

        for (const group of partsPerToken) {
            const resolvedInGroup = [];
            for (const ident of group) {
                const emoji = await client.resolveEmoji(interaction.client, ident, interaction.guild);
                if (emoji) {
                    resolvedInGroup.push(emoji.toString());
                } else {
                    invalid.push(ident);
                }
            }
            resolvedGroups.push(resolvedInGroup.join(''));
        }

        const finalString = resolvedGroups.join(' ').trim();

        if (!finalString && invalid.length) {
            return messages.error(interaction, "All provided emoji identifiers were invalid!");
        }

        if (finalString) {
            await interaction.channel.send(finalString);
        }

        if (invalid.length) {
            await messages.error(interaction, `Some emojis were invalid:\n${invalid.map(id => `• ${id}`).join('\n')}`);
        } else {
            await messages.success(interaction, "Emoji message sent.");
        }
    },
    prefixExecute: async (message, args, client) => {
        const input = args.join(' ');
        if (!input) return messages.error(message.channel, "Please provide emoji identifiers.");

        const tokens = input.split(/\s+/);
        const partsPerToken = tokens.map(token => token.split('/$/'));
        const resolvedGroups = [];
        let anyInvalid = false;

        for (const group of partsPerToken) {
            const resolvedInGroup = [];
            for (const ident of group) {
                const emoji = await client.resolveEmoji(client, ident, message.guild);
                if (emoji) {
                    resolvedInGroup.push(emoji.toString());
                } else {
                    anyInvalid = true;
                }
            }
            resolvedGroups.push(resolvedInGroup.join(''));
        }
        const finalString = resolvedGroups.join(' ').trim();

        if (!finalString && anyInvalid) {
            return messages.error(message.channel, "All provided emoji identifiers were invalid!");
        }

        try {
            await message.delete();
        } catch {}

        if (finalString) {
            if (message.reference?.messageId) {
                try {
                    const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
                    await repliedMessage.reply(finalString);
                } catch {
                    await message.channel.send(finalString);
                }
            } else {
                await message.channel.send(finalString);
            }
        }

        if (anyInvalid) {
            const errorMsg = await messages.error(message.channel, "Any one of the emoji IDs were invalid!");
            setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
        }
    }
};