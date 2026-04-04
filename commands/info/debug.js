const { buildDebugEmbed } = require('../../utils/embeds.js');
const emojis = require('../../emojis.js');
const ownerId = require('../../config.js').ownerId;

module.exports = {
    name: 'debug',
    aliases: ['botstats'],
    description: 'Debug bot status',
    category: 'info',
    owner: false,
    userPerms: [],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const nodes = Array.from(client.riffy.nodes.values());
        const embed = buildDebugEmbed(client, interaction, nodes);
        await interaction.editReply({ embeds: [embed] });
    },
    prefixExecute: async (message, args, client) => {
        if (message.author.id !== ownerId) {
            return message.reply(`${emojis.error} | This command is reserved for the bot owner.`);
        }
        const nodes = Array.from(client.riffy.nodes.values());
        const embed = buildDebugEmbed(client, message, nodes);
        await message.channel.send({ embeds: [embed] });
    }
};