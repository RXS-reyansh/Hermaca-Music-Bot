const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: '24-7-disable',
    description: 'Disable 24/7 mode',
    category: '24-7',
    owner: false,
    userPerms: ['Administrator'],
    botPerms: ['Connect', 'Speak'],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const player = client.riffy.players.get(interaction.guild.id);
        if (player) {
            player.destroy();
        }
        const result = await client.disable24Seven(interaction.guild.id);
        if (result.success) {
            await messages.success(interaction, result.message);
        } else {
            await messages.error(interaction, result.message);
        }
    }
};