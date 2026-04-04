const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'skipto',
    aliases: ['jump', 'st'],
    description: 'Skip to a specific track in the queue',
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

        if (position < 1 || position > player.queue.length) {
            return messages.error(interaction, `There is no track at position **${position}**!`);
        }

        if (position === 1) {
            player.stop();
            return messages.success(interaction, `Skipped to track **${player.queue[0]?.info.title || 'next'}**.`);
        }

        player.queue.splice(0, position - 1);
        player.stop();
        await messages.success(interaction, `Skipped to track **${player.current.info.title}** (position ${position})!`);
    },
    prefixExecute: async (message, args, client) => {
        const position = parseInt(args[0]);
        const player = client.riffy.players.get(message.guild.id);

        if (isNaN(position)) {
            return messages.info(message.channel, 'Provide the position of the track you want to skip to.');
        }
        if (position < 1 || position > player.queue.length) {
            return messages.error(message, `There is no track at position **${position}**!`);
        }

        if (position === 1) {
            player.stop();
            return messages.success(message, `Skipped to track **${player.queue[0]?.info.title || 'next'}**.`);
        }

        player.queue.splice(0, position - 1);
        player.stop();
        await messages.success(message, `Skipped to track **${player.current.info.title}** (position ${position})!`);
    }
};