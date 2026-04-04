const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'shuffle',
    description: 'Shuffle the current queue',
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
        if (!player.queue.length) {
            return messages.error(interaction, "Not enough tracks in queue to shuffle!");
        }
        player.queue.shuffle();
        await messages.success(interaction, "Shuffled the queue!");
    },
    prefixExecute: async (message, args, client) => {
        const player = client.riffy.players.get(message.guild.id);
        if (!player) {
            return messages.error(message, "Nothing is playing!");
        }
        if (!player.queue.length) {
            return messages.error(message, "Not enough tracks in queue to shuffle!");
        }
        player.queue.shuffle();
        await messages.success(message, "Shuffled the queue!");
    }
};