const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'volume',
    aliases: ['vol'],
    description: 'Adjust player volume (0-100)',
    category: 'music',
        owner: false,
    userPerms: [],
    botPerms: ['Connect', 'Speak'],
    player: true,
    inVoiceChannel: true,
    sameVoiceChannel: true,
    execute: async (interaction, client) => {
        const volume = interaction.options.getInteger('level');
        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) {
            return messages.error(interaction, "Nothing is playing!");
        }
        if (volume < 0 || volume > 100) {
            return messages.error(interaction, "Please provide a valid volume between 0 and 100!");
        }
        player.setVolume(volume);
        await messages.success(interaction, `Volume set to **${volume}%**`);
    },
    prefixExecute: async (message, args, client) => {
        const player = client.riffy.players.get(message.guild.id);
        if (!player) {
            return messages.error(message, "Nothing is playing!");
        }

        // Special cases for "six seven" and "six nine" (69/67)
        if (args.length >= 2 && args[0].toLowerCase() === 'six' && args[1].toLowerCase() === 'seven') {
            player.setVolume(67);
            return messages.success(message, "Volume set to **67%**");
        }
        if (args.length >= 2 && args[0].toLowerCase() === 'six' && args[1].toLowerCase() === 'nine') {
            player.setVolume(69);
            return messages.success(message, "Volume set to **69%**");
        }

        const volume = parseInt(args[0]);
        if (isNaN(volume)) {
            return messages.error(message, "Please provide a valid volume level (0-100)!");
        }
        if (volume < 0 || volume > 100) {
            return messages.error(message, "Volume must be between 0 and 100!");
        }
        player.setVolume(volume);
        await messages.success(message, `Volume set to **${volume}%**`);
    }
};