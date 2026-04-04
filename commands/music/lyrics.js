const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');
const { getLyrics } = require('../../utils/lyrics.js');
const { sendLyricsEmbeds } = require('../../utils/embeds.js');

module.exports = {
    name: 'lyrics',
    description: 'Show lyrics of the current track',
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

        await messages.loading(interaction, "Searching for lyrics...");

        const lyricsData = await getLyrics(player.current.info.title, player.current.info.author || "");

        if (!lyricsData || !lyricsData.lyrics) {
            return messages.error(interaction, "Lyrics not found for this track!");
        }

        // Logging
        const guildName = interaction.guild?.name || 'DM';
        let provider = lyricsData.cached ? `${lyricsData.source}/Cache` : lyricsData.source;
        let logMessage = `${player.current.info.author} - ${player.current.info.title} | Provider: ${provider} | Requested by: ${interaction.user.tag} | Server: ${guildName}`;
        if (lyricsData.clientName && !lyricsData.cached) logMessage += ` | API Client: ${lyricsData.clientName}`;
        console.log(`[LYRICS] ${logMessage}`);

        await sendLyricsEmbeds(interaction, true, null, lyricsData.lyrics, lyricsData.source, player.current.info.author, player.current.info.title, interaction.user);
    },
    prefixExecute: async (message, args, client) => {
        const player = client.riffy.players.get(message.guild.id);
        if (!player || !player.current) {
            return messages.error(message, "No track is currently playing!");
        }

        const loadingMsg = await message.channel.send(`${emojis.loading} | Searching for lyrics...`);

        const lyricsData = await getLyrics(player.current.info.title, player.current.info.author || "");

        if (!lyricsData || !lyricsData.lyrics) {
            if (loadingMsg) await loadingMsg.delete().catch(() => {});
            return messages.error(message, "Lyrics not found for this track!");
        }

        const guildName = message.guild?.name || 'DM';
        let provider = lyricsData.cached ? `${lyricsData.source}/Cache` : lyricsData.source;
        let logMessage = `${player.current.info.author} - ${player.current.info.title} | Provider: ${provider} | Requested by: ${message.author.tag} | Server: ${guildName}`;
        if (lyricsData.clientName && !lyricsData.cached) logMessage += ` | API Client: ${lyricsData.clientName}`;
        console.log(`[LYRICS] ${logMessage}`);

        await sendLyricsEmbeds(message, false, loadingMsg, lyricsData.lyrics, lyricsData.source, player.current.info.author, player.current.info.title, message.author);
    }
};