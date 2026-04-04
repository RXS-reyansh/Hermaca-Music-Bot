const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'remove',
    description: 'Remove a track from queue',
    category: 'music',
        owner: false,
    userPerms: [],
    botPerms: ['Connect', 'Speak'],
    player: true,
    inVoiceChannel: true,
    sameVoiceChannel: true,
    execute: async (interaction, client) => {
        const position = interaction.options.getInteger('position');
        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) {
            return messages.error(interaction, "Nothing is playing!");
        }
        if (position < 1 || position > player.queue.length) {
            return messages.error(interaction, `Please provide a valid track position between 1 and ${player.queue.length}!`);
        }
        const removed = player.queue.remove(position - 1);
        await messages.success(interaction, `Removed **${removed.info.title}** from the queue!`);
    },
    prefixExecute: async (message, args, client) => {
        const position = parseInt(args[0]);
        if (isNaN(position)) {
            return messages.error(message, "Please provide a valid position! Usage: ~remove <position>");
        }
        const player = client.riffy.players.get(message.guild.id);
        if (!player) {
            return messages.error(message, "Nothing is playing!");
        }
        if (position < 1 || position > player.queue.length) {
            return messages.error(message, `Please provide a valid track position between 1 and ${player.queue.length}!`);
        }
        const removed = player.queue.remove(position - 1);
        await messages.success(message, `Removed **${removed.info.title}** from the queue!`);
    }
};