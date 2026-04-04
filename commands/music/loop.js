const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'loop',
    description: 'Toggle queue loop mode',
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
        const currentMode = player.loop;
        const newMode = currentMode === "none" ? "queue" : "none";
        player.setLoop(newMode);
        await messages.success(interaction, `${newMode === "queue" ? "Enabled" : "Disabled"} loop mode!`);
    },
    prefixExecute: async (message, args, client) => {
        const player = client.riffy.players.get(message.guild.id);
        if (!player) {
            return messages.error(message, "Nothing is playing!");
        }
        const currentMode = player.loop;
        const newMode = currentMode === "none" ? "queue" : "none";
        player.setLoop(newMode);
        await messages.success(message, `${newMode === "queue" ? "Enabled" : "Disabled"} loop mode!`);
    }
};