const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'playspotify',
    aliases: ['ps'],
    description: 'Play your saved Spotify playlists',
    category: 'spotify',
        owner: false,
    userPerms: [],
    botPerms: ['Connect', 'Speak'],
    player: false,
    inVoiceChannel: true,
    sameVoiceChannel: true,
    execute: async (interaction, client) => {
        const userSpotifyId = await client.db.getSpotifyId(interaction.user.id);
        if (!userSpotifyId) {
            return messages.error(interaction, "No Spotify ID found! Use `/setspotify` first.");
        }

        await messages.loading(interaction, "Fetching your Spotify playlists...");

        try {
            const { SpotifyUserPlaylists } = require('../../utils/spotifyPlaylists.js');
            let playlists = null;
            let retryCount = 0;
            const maxRetries = 3;

            while (retryCount < maxRetries && !playlists) {
                try {
                    const playlistsPromise = SpotifyUserPlaylists(userSpotifyId);
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Spotify API timeout (15 seconds)')), 15000));
                    playlists = await Promise.race([playlistsPromise, timeoutPromise]);
                } catch (error) {
                    console.error(`Spotify playlist error: ${error.message}`);
                    retryCount++;
                    if (retryCount === maxRetries) throw error;
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            if (!playlists || !playlists.length) {
                return messages.error(interaction, "No playlists found! Make sure your Spotify account has public playlists.");
            }

            await messages.sendPlaylistSelector(interaction, playlists, interaction.user.id, client, userSpotifyId);
        } catch (error) {
            console.error(`Spotify playlist error: ${error.message}`);
            await messages.error(interaction, `Failed to fetch Spotify playlists: ${error.message}`);
        }
    },
    prefixExecute: async (message, args, client) => {
        if (!message.member.voice.channel) {
            return messages.error(message, "You must be in a voice channel!");
        }

        const userSpotifyId = await client.db.getSpotifyId(message.author.id);
        if (!userSpotifyId) {
            return messages.error(message, "No Spotify ID found! Use `~setspotify` first.");
        }

        const loadingMsg = await message.channel.send(`${emojis.loading} | Fetching your Spotify playlists...`);

        try {
            const { SpotifyUserPlaylists } = require('../../utils/spotifyPlaylists.js');
            let playlists = null;
            let retryCount = 0;
            const maxRetries = 3;

            while (retryCount < maxRetries && !playlists) {
                try {
                    const playlistsPromise = SpotifyUserPlaylists(userSpotifyId);
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Spotify API timeout (15 seconds)')), 15000));
                    playlists = await Promise.race([playlistsPromise, timeoutPromise]);
                } catch (error) {
                    console.error(`Spotify playlist error: ${error.message}`);
                    retryCount++;
                    if (retryCount === maxRetries) throw error;
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            if (!playlists || !playlists.length) {
                await loadingMsg.delete().catch(() => {});
                return messages.error(message, "No playlists found! Make sure your Spotify account has public playlists.");
            }

            await messages.sendPlaylistSelector(message.channel, playlists, message.author.id, client, userSpotifyId);
            setTimeout(() => loadingMsg.delete().catch(() => {}), 2000);
        } catch (error) {
            console.error(`Spotify playlist error: ${error.message}`);
            await loadingMsg.delete().catch(() => {});
            await messages.error(message, `Failed to fetch Spotify playlists: ${error.message}`);
        }
    }
};
