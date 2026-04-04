const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: '24-7',
    description: 'Enable or disable 24/7 mode',
    category: 'music',
    owner: false,
    userPerms: ['Administrator'],
    botPerms: ['Connect', 'Speak'],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    // Only prefixExecute - slash commands are separate
    prefixExecute: async (message, args, client) => {
        const subCommand = args[0] ? args[0].toLowerCase() : null;

        if (subCommand === 'enable') {
            let channel = null;
            if (args[1]) {
                let channelId = args[1].replace(/[<#>]/g, '');
                channel = message.guild.channels.cache.get(channelId);
                if (!channel || channel.type !== 2) {
                    return messages.error(message.channel, "Invalid voice channel!");
                }
            } else {
                // Use bot's current voice channel
                const botVoiceChannel = message.guild.members.me.voice.channel;
                if (!botVoiceChannel) {
                    return messages.error(message.channel, "I'm not in a voice channel. Please specify a channel or join one first.");
                }
                channel = botVoiceChannel;
            }
            const result = await client.enable24Seven(message.guild.id, channel.id, message.channel);
            if (result.success) {
                await messages.success(message.channel, result.message);
            } else {
                await messages.error(message.channel, result.message);
            }
        } else if (subCommand === 'disable') {
            const result = await client.disable24Seven(message.guild.id);
            if (result.success) {
                await messages.success(message.channel, result.message);
            } else {
                await messages.error(message.channel, result.message);
            }
        } else {
            await messages.error(message.channel, "Invalid subcommand. Use 'enable' or 'disable'.");
        }
    }
};