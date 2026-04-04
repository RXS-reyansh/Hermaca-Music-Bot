const emojis = require('../../emojis.js');
const config = require('../../config.js');
const messages = require('../../utils/messages.js');
const { formatDuration } = require('../../utils/formatting.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'nowplaying',
    aliases: ['np'],
    description: 'Show current track info',
    category: 'music',
        owner: false,
    userPerms: [],
    botPerms: [],
    player: true,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const player = client.riffy.players.get(interaction.guild.id);
        if (!player || !player.current) {
            return messages.error(interaction, "No track is currently playing!");
        }

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.blacksparkles} Now Playing`)
            .setDescription(`[${player.current.info.title}](${player.current.info.uri})`);

        // Thumbnail extraction (similar to original)
        let thumbnail = player.current.info.thumbnail || player.current.info.artworkUrl || player.current.info.image;
        if (thumbnail) embed.setThumbnail(thumbnail);

        embed.addFields(
            { name: 'Artist', value: `${emojis.blackbutterfly} ${player.current.info.author || "Unknown"}`, inline: true },
            { name: 'Duration', value: `${emojis.blackbutterfly} ${formatDuration(player.current.info.length)}`, inline: true },
            { name: 'Requested By', value: `${emojis.blackbutterfly} ${player.current.info.requester?.tag || "Unknown"}`, inline: true }
        ).setFooter({ text: 'Use /help to see all commands' });

        await interaction.editReply({ embeds: [embed] });
    },
    prefixExecute: async (message, args, client) => {
        const player = client.riffy.players.get(message.guild.id);
        if (!player || !player.current) {
            return messages.error(message, "No track is currently playing!");
        }
        await messages.nowPlaying(message.channel, player.current);
    }
};