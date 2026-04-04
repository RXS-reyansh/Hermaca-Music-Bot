const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'react',
    description: 'React to a message with an emoji',
    category: 'utility',
    owner: false,
    userPerms: ['AddReactions'],
    botPerms: ['AddReactions'],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const messageId = interaction.options.getString('message_id');
        const emojiIdent = interaction.options.getString('emoji');
        const channel = interaction.channel;

        let message;
        try {
            message = await channel.messages.fetch(messageId);
        } catch {
            return messages.error(interaction, "Could not fetch that message.");
        }

        const emoji = await client.resolveEmoji(interaction.client, emojiIdent, interaction.guild);
        if (!emoji) {
            return messages.error(interaction, "Emoji not found.");
        }

        try {
            await message.react(emoji);
            await messages.success(interaction, "Reacted to the message.");
        } catch (error) {
            console.error(`React slash error: ${error.message}`);
            await messages.error(interaction, `Failed to react: ${error.message}`);
        }
    },
    prefixExecute: async (message, args, client) => {
        if (!args.length) {
            return messages.error(message.channel, "Please provide an emoji name, ID, or markdown.");
        }

        const identifier = args.join(' ');
        let emoji = null;
        let emojiId = null;
        const customEmojiRegex = /^<a?:\w+:(\d+)>$/;
        const match = identifier.match(customEmojiRegex);
        if (match) {
            emojiId = match[1];
        } else if (/^\d+$/.test(identifier)) {
            emojiId = identifier;
        }

        if (emojiId) {
            emoji = client.emojis.cache.get(emojiId);
            if (!emoji) {
                for (const guild of client.guilds.cache.values()) {
                    try {
                        const fetched = await guild.emojis.fetch(emojiId).catch(() => null);
                        if (fetched) {
                            emoji = fetched;
                            client.emojis.cache.set(emojiId, fetched);
                            break;
                        }
                    } catch {}
                }
            }
        } else {
            const nameLower = identifier.toLowerCase();
            if (message.guild) {
                emoji = message.guild.emojis.cache.find(e => e.name.toLowerCase() === nameLower);
            }
            if (!emoji) {
                emoji = client.emojis.cache.find(e => e.name.toLowerCase() === nameLower);
            }
            if (!emoji) {
                for (const guild of client.guilds.cache.values()) {
                    try {
                        await guild.emojis.fetch();
                        const found = guild.emojis.cache.find(e => e.name.toLowerCase() === nameLower);
                        if (found) {
                            emoji = found;
                            break;
                        }
                    } catch {}
                }
            }
        }

        if (!emoji) {
            return messages.error(message.channel, "Emoji not found! Make sure the bot is in the same server as the emoji.");
        }

        let targetMessage;
        if (message.reference) {
            try {
                targetMessage = await message.channel.messages.fetch(message.reference.messageId);
            } catch {
                return messages.error(message.channel, "Could not fetch the replied message!");
            }
        } else {
            try {
                const msgs = await message.channel.messages.fetch({ limit: 2 });
                const messageArray = Array.from(msgs.values());
                targetMessage = messageArray[1];
                if (!targetMessage) {
                    return messages.error(message.channel, "No message found to react to!");
                }
            } catch {
                return messages.error(message.channel, "Could not fetch the last message!");
            }
        }

        try {
            await targetMessage.react(emoji);
            setTimeout(() => message.delete().catch(() => {}), 1000);
            const successMsg = await messages.success(message.channel, "Reacted!");
            setTimeout(() => successMsg.delete().catch(() => {}), 5000);
        } catch (error) {
            console.error(`React error: ${error.message}`);
            if (error.code === 10014) {
                await messages.error(message.channel, "Emoji not found! The bot might not have access to this emoji.");
            } else if (error.code === 50001) {
                await messages.error(message.channel, "I don't have permission to add reactions in this channel.");
            } else if (error.code === 50013) {
                await messages.error(message.channel, "I don't have permission to add reactions.");
            } else {
                await messages.error(message.channel, `Failed to react: ${error.message}`);
            }
        }
    }
};