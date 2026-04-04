const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'move',
    description: 'Move a song in the queue',
    category: 'music',
        owner: false,
    userPerms: [],
    botPerms: ['Connect', 'Speak'],
    player: true,
    inVoiceChannel: true,
    sameVoiceChannel: true,
    execute: async (interaction, client) => {
        const from = interaction.options.getInteger('from');
        const to = interaction.options.getInteger('to');
        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) {
            return messages.error(interaction, "Nothing is playing!");
        }
        if (!player.queue.length) {
            return messages.error(interaction, "Queue is empty!");
        }
        const fromPos = from - 1;
        const toPos = to - 1;
        if (fromPos < 0 || toPos < 0 || fromPos >= player.queue.length || toPos > player.queue.length) {
            return messages.error(interaction, `Valid positions: 1-${player.queue.length + 1}`);
        }
        const movedTrack = player.queue[fromPos];
        player.queue.splice(fromPos, 1);
        player.queue.splice(toPos, 0, movedTrack);
        await messages.success(interaction, `Moved **${movedTrack.info.title}** from **${from}** to **${to}**!`);
    },
    prefixExecute: async (message, args, client) => {
        const from = parseInt(args[0]);
        const to = parseInt(args[1]);
        if (isNaN(from) || isNaN(to)) {
            return messages.error(message, "Please provide valid positions! Usage: ~move <from> <to>");
        }
        const player = client.riffy.players.get(message.guild.id);
        if (!player) {
            return messages.error(message, "Nothing is playing!");
        }
        if (!player.queue.length) {
            return messages.error(message, "Queue is empty!");
        }
        const fromPos = from - 1;
        const toPos = to - 1;
        if (fromPos < 0 || toPos < 0 || fromPos >= player.queue.length || toPos > player.queue.length) {
            return messages.error(message, `Valid positions: 1-${player.queue.length + 1}`);
        }
        const movedTrack = player.queue[fromPos];
        player.queue.splice(fromPos, 1);
        player.queue.splice(toPos, 0, movedTrack);
        await messages.success(message, `Moved **${movedTrack.info.title}** from **${from}** to **${to}**!`);
    }
};