const emojis = require('../../emojis.js');
const config = require('../../config.js');
const messages = require('../../utils/messages.js');
const { formatDuration, getDurationString } = require('../../utils/formatting.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'status',
    description: 'Show player status',
    category: 'music',
        owner: false,
    userPerms: [],
    botPerms: [],
    player: true,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) {
            return messages.error(interaction, "No active player found!");
        }
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.info} Player Status`)
            .addFields(
                { name: 'Status', value: player.playing ? `${emojis.playboy} Playing` : `${emojis.pause} Paused`, inline: true },
                { name: 'Volume', value: `${emojis.playboy} ${player.volume}%`, inline: true },
                { name: 'Loop Mode', value: `${emojis.playboy} ${player.loop === "queue" ? 'Queue' : 'Disabled'}`, inline: true }
            );
        if (player.queue.current) {
            const track = player.queue.current;
            embed.setDescription(
                `**Currently Playing:**\n${emojis.music} [${track.info.title}](${track.info.uri})\n${emojis.time} Duration: ${getDurationString(track)}`
            );
            if (track.info.thumbnail) embed.setThumbnail(track.info.thumbnail);
        }
        await interaction.editReply({ embeds: [embed] });
    },
    prefixExecute: async (message, args, client) => {
        const player = client.riffy.players.get(message.guild.id);
        if (!player) {
            return messages.error(message, "No active player found!");
        }
        await messages.playerStatus(message.channel, player);
    }
};