const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'leave',
    description: 'Make the bot leave the voice channel',
    category: 'vcControls',
        owner: false,
    userPerms: [],
    botPerms: ['Connect'],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) {
            return messages.error(interaction, "I'm not in a voice channel!");
        }
        const voiceChannelId = player.voiceChannel;
        await client.clearVoiceChannelStatus(voiceChannelId);
        client.cancelInactivityTimer(interaction.guild.id);
        player.destroy();
        await messages.success(interaction, "Left the voice channel!");
    },
    prefixExecute: async (message, args, client) => {
        const player = client.riffy.players.get(message.guild.id);
        if (!player) {
            return messages.error(message, "I'm not in a voice channel!");
        }
        const voiceChannelId = player.voiceChannel;
        await client.clearVoiceChannelStatus(voiceChannelId);
        client.cancelInactivityTimer(message.guild.id);
        player.destroy();
        await messages.success(message, "Left the voice channel!");
    }
};
