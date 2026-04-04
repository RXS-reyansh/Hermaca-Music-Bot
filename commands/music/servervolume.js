const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'servervolume',
    description: 'Set permanent volume for this server (0-100)',
    category: 'music',
        owner: false,
    userPerms: ['Administrator'],
    botPerms: ['Connect', 'Speak'],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const volume = interaction.options.getInteger('level');
        if (volume < 0 || volume > 100) {
            return messages.error(interaction, "Please provide a valid volume between 0 and 100!");
        }

        client.guildVolumes.set(interaction.guild.id, volume);
        await client.saveGuildVolumes();

        const player = client.riffy.players.get(interaction.guild.id);
        if (player) player.setVolume(volume);

        await messages.success(interaction, `Server volume set to **${volume}%** permanently!`);
    },
    prefixExecute: async (message, args, client) => {
        const volume = parseInt(args[0]);
        if (isNaN(volume)) {
            return messages.error(message, "Please provide a valid volume level (0-100)!");
        }
        if (volume < 0 || volume > 100) {
            return messages.error(message, "Volume must be between 0 and 100!");
        }

        client.guildVolumes.set(message.guild.id, volume);
        await client.saveGuildVolumes();

        const player = client.riffy.players.get(message.guild.id);
        if (player) player.setVolume(volume);

        await messages.success(message, `Server volume set to **${volume}%** permanently!`);
    }
};