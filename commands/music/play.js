const { EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis.js');
const config = require('../../config.js');
const messages = require('../../utils/messages.js');
const { formatDuration, extractThumbnail } = require('../../utils/formatting.js');

/**
 * Helper to send responses (exactly as in index.js)
 */
async function sendResponse(context, content, isInteraction = false) {
    if (isInteraction) {
        return await context.editReply(
            typeof content === 'string' ? { content } : content
        );
    } else {
        if (typeof content === 'string') {
            return await context.channel.send(content);
        } else {
            return await context.channel.send(content);
        }
    }
}

async function handlePlay(context, query, isInteraction, client) {
    try {
        const guild = isInteraction ? context.guild : context.guild;
        const member = isInteraction ? context.member : context.member;
        const user = isInteraction ? context.user : context.author;
        const channel = isInteraction ? context.channel : context.channel;

        let player = client.riffy.players.get(guild.id);
        if (!player) {
            player = client.riffy.createConnection({
                guildId: guild.id,
                voiceChannel: member.voice.channel.id,
                textChannel: channel.id,
                deaf: true,
            });
        } else {
            if (player.voiceChannel !== member.voice.channel.id) {
                player.setVoiceChannel(member.voice.channel.id);
            }
            if (player.textChannel !== channel.id) {
                player.setTextChannel(channel.id);
            }
        }

        const twentyFourSevenData = await client.load24SevenData();
        const guild24SevenData = twentyFourSevenData[guild.id];
        if (guild24SevenData && guild24SevenData.enabled) {
            if (!client.original24SevenChannels.has(guild.id)) {
                client.original24SevenChannels.set(guild.id, {
                    voiceChannel: guild24SevenData.channelId,
                    textChannel: player.textChannel || channel.id
                });
            }

            const botMember = guild.members.me;
            const botVoiceChannel = botMember?.voice?.channel;
            if (botVoiceChannel && botVoiceChannel.id !== member.voice.channel.id) {
                player.setVoiceChannel(member.voice.channel.id);
                player.setTextChannel(channel.id);
            }
        }

        const savedVolume = client.guildVolumes.get(guild.id);
        if (savedVolume !== undefined) {
            player.setVolume(savedVolume);
        }

        const resolve = await client.riffy.resolve({ query, requester: user });
        const { loadType, tracks, playlistInfo } = resolve;

        if (!tracks || !tracks.length) {
            return await sendResponse(
                context,
                `${emojis.error} | No results found! Try with a different search term.`,
                isInteraction
            );
        }

        if (loadType === "playlist") {
            let allTracks = tracks;
            let totalTrackCount = tracks.length;
            let playlistImage = null;
            let creationDate = null;
            let isSpotifyPlaylist = query.includes('spotify.com/playlist/');

            if (isSpotifyPlaylist) {
                const spotifyRegex = /spotify\.com\/playlist\/([a-zA-Z0-9]+)/;
                const match = query.match(spotifyRegex);
                if (match) {
                    const playlistId = match[1];
                    try {
                        const { getAllPlaylistTracks, getPlaylistDetails } = require("../../utils/spotifyPlaylists.js");
                        const fullTracks = await getAllPlaylistTracks(playlistId);
                        if (fullTracks && fullTracks.length > 0) {
                            allTracks = [];
                            totalTrackCount = fullTracks.length;
                            const details = await getPlaylistDetails(playlistId);
                            playlistImage = details?.image || null;
                            creationDate = details?.created_at || null;
                            let addedCount = 0;
                            const CONCURRENCY_LIMIT = 5;
                            for (let i = 0; i < fullTracks.length; i += CONCURRENCY_LIMIT) {
                                const chunk = fullTracks.slice(i, i + CONCURRENCY_LIMIT);
                                const resolvedTracks = await Promise.all(chunk.map(async (trackData) => {
                                    try {
                                        let res = await client.riffy.resolve({ query: trackData.uri, requester: user });
                                        let track = res.tracks?.[0];
                                        if (!track) {
                                            const fallbackQuery = `${trackData.title} ${trackData.artist}`.trim();
                                            if (fallbackQuery) {
                                                try {
                                                    res = await client.riffy.resolve({ query: fallbackQuery, requester: user });
                                                    track = res.tracks?.[0];
                                                } catch (e) {}
                                            }
                                        }
                                        if (track) {
                                            track.info.requester = user;
                                            if (trackData.thumbnail) {
                                                track.info.thumbnail = trackData.thumbnail;
                                            }
                                            return track;
                                        }
                                    } catch (err) {}
                                    return null;
                                }));
                                resolvedTracks.forEach((t, idx) => {
                                    if (!t) return;
                                    player.queue.add(t);
                                    addedCount++;
                                    const original = chunk[idx];
                                    if (original && original.thumbnail) {
                                        if (!player._spotifyThumbs) player._spotifyThumbs = new Map();
                                        player._spotifyThumbs.set(t.info.uri, original.thumbnail);
                                    }
                                });
                                if (i + CONCURRENCY_LIMIT < fullTracks.length)
                                    await new Promise(r => setTimeout(r, 30));
                            }
                        }
                    } catch (spotifyError) {
                        console.error(`Spotify playlist fetch error: ${spotifyError.message}`);
                        allTracks = tracks;
                        totalTrackCount = tracks.length;
                    }
                }
            }
            if (allTracks === tracks) {
                for (const track of tracks) {
                    track.info.requester = user;
                    player.queue.add(track);
                }
                totalTrackCount = tracks.length;
            }
            let thumbnail = playlistImage;
            if (!thumbnail && tracks[0]?.info) {
                thumbnail = extractThumbnail(tracks[0].info);
            }

            let creationDateStr = 'Unknown';
            if (creationDate) {
                try {
                    creationDateStr = new Date(creationDate).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    });
                } catch {}
            }
            if (isInteraction) {
                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle(`${emojis.success} Playing ${playlistInfo.name || 'Spotify Playlist'}`)
                    .setDescription(`[${playlistInfo.name || 'Playlist'}](${query})`)
                    .addFields(
                        { name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', value: " ", inline: false },
                        { name: `${emojis.music} Playlist created on: ${creationDateStr}`, value: " ", inline: false },
                        { name: `${emojis.music} Number of tracks: ${totalTrackCount} tracks`, value: " ", inline: false }
                    )
                    .setFooter({ text: 'Enjoy your music!', iconURL: 'https://i.ibb.co/GfHpz0fQ/image.gif' });
                if (thumbnail && typeof thumbnail === 'string' && thumbnail.trim() !== '') {
                    embed.setThumbnail(thumbnail);
                }
                await sendResponse(context, { embeds: [embed] }, isInteraction);
            } else {
                await messages.playingPlaylist(channel, {
                    name: playlistInfo.name,
                    uri: query,
                    url: query,
                    thumbnail: thumbnail,
                    image: thumbnail,
                    created_at: creationDate,
                    tracksCount: totalTrackCount
                }, tracks, isSpotifyPlaylist);
            }

            if (!player.playing && !player.paused) {
                client.cancelInactivityTimer(guild.id);
                player.play();
            }
        } else if (loadType === "search" || loadType === "track") {
            const track = tracks[0];
            track.info.requester = user;
            const position = player.queue.length + 1;
            player.queue.add(track);

            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.success} Added to queue: ${track.info.title}`)
                .addFields(
                    { name: 'Artist', value: track.info.author || 'Unknown', inline: true },
                    { name: 'Duration', value: formatDuration(track.info.length), inline: true },
                    { name: 'Position', value: `#${position}`, inline: true }
                );
            const trackThumbnail = extractThumbnail(track.info);
            if (trackThumbnail && typeof trackThumbnail === 'string') {
                embed.setThumbnail(trackThumbnail);
            }
            await sendResponse(context, { embeds: [embed] }, isInteraction);

            if (!player.playing && !player.paused) {
                client.cancelInactivityTimer(guild.id);
                player.play();
            }
        } else {
            await sendResponse(
                context,
                `${emojis.error} | No results found! Try with a different search term.`,
                isInteraction
            );
        }
    } catch (error) {
        console.error(`Error in handlePlay: ${error.message}`);
        await sendResponse(
            context,
            `${emojis.error} | An error occurred while playing the track: ${error.message}`,
            isInteraction
        );
    }
}

module.exports = {
    name: 'play',
    aliases: ['p'],
    description: 'Plays a song or playlist',
    category: 'music',
    owner: false,
    userPerms: [],
    botPerms: ['Connect', 'Speak'],
    player: false,
    inVoiceChannel: true,
    sameVoiceChannel: true,
    execute: async (interaction, client) => {
        const query = interaction.options.getString('query');
        if (!query) return messages.error(interaction, "Please provide a song to play!");
        await handlePlay(interaction, query, true, client);
    },
    prefixExecute: async (message, args, client) => {
        const query = args.join(' ');
        if (!query) return messages.error(message, "Please provide a song to play!");
        const loadingMsg = await message.channel.send(`${emojis.loading} | Starting playback...`);
        await handlePlay(message, query, false, client);
        loadingMsg.delete().catch(() => {});
    }
};