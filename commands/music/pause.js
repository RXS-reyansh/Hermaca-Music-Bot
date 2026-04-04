const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'pause',
    description: 'Pause the current track',
    category: 'music',
        owner: false,
    userPerms: [],
    botPerms: ['Connect', 'Speak'],
    player: true,
    inVoiceChannel: true,
    sameVoiceChannel: true,
    execute: async (interaction, client) => {
        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) {
            return messages.error(interaction, "Nothing is playing!");
        }
        if (player.paused) {
            return messages.error(interaction, "The player is already paused!");
        }
        player.pause(true);
        await messages.success(interaction, "Paused the music!");
    },
    prefixExecute: async (message, args, client) => {
        const player = client.riffy.players.get(message.guild.id);
        if (!player) {
            return messages.error(message, "Nothing is playing!");
        }
        if (player.paused) {
            return messages.error(message, "The player is already paused!");
        }
        player.pause(true);
        await messages.success(message, "Paused the music!");
    }
};