const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'clear',
    description: 'Clear the current queue',
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
            return messages.error(interaction, "Queue is already empty!");
        }
        if (player.playing || player.paused) {
            player._manualStop = true;
        }
        player.queue.clear();
        await messages.success(interaction, "Cleared the queue!");
        if (!player.playing && !player.paused) {
            delete player._manualStop;
            await client.rejoinAndIdle(interaction.guild.id, player.textChannel);
        }
    },
    prefixExecute: async (message, args, client) => {
        const player = client.riffy.players.get(message.guild.id);
        if (!player) {
            return messages.error(message, "Nothing is playing!");
        }
        if (!player.queue.length) {
            return messages.error(message, "Queue is already empty!");
        }
        if (player.playing || player.paused) {
            player._manualStop = true;
        }
        player.queue.clear();
        await messages.success(message, "Cleared the queue!");
        if (!player.playing && !player.paused) {
            delete player._manualStop;
            await client.rejoinAndIdle(message.guild.id, player.textChannel);
        }
    }
};