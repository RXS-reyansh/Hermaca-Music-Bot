const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'add',
    description: 'Add a track at specific position',
    category: 'music',
        owner: false,
    userPerms: [],
    botPerms: ['Connect', 'Speak'],
    player: true,
    inVoiceChannel: true,
    sameVoiceChannel: true,
    execute: async (interaction, client) => {
        const song = interaction.options.getString('song');
        const position = interaction.options.getInteger('position');
        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) {
            return messages.error(interaction, "Nothing is playing! Use /play first.");
        }
        try {
            const resolve = await client.riffy.resolve({ query: song, requester: interaction.user });
            const { loadType, tracks } = resolve;
            if (!tracks?.length) {
                return messages.error(interaction, "No results found!");
            }
            if (loadType === "playlist") {
                return messages.error(interaction, "Playlists not supported with /add. Use /play instead.");
            }
            const track = tracks[0];
            track.info.requester = interaction.user;
            const insertPos = Math.min(position - 1, player.queue.length);
            player.queue.splice(insertPos, 0, track);
            await messages.success(interaction, `Added **${track.info.title}** at position **${position}**! Queue now has ${player.queue.length} tracks.`);
        } catch (error) {
            await messages.error(interaction, "Failed to add track!");
        }
    },
    prefixExecute: async (message, args, client) => {
        const position = parseInt(args[args.length - 1]);
        if (isNaN(position)) {
            return messages.error(message, "Please provide a valid position! Usage: ~add <song> <position>");
        }
        const song = args.slice(0, -1).join(' ');
        if (!song) {
            return messages.error(message, "Please provide a song!");
        }
        const player = client.riffy.players.get(message.guild.id);
        if (!player) {
            return messages.error(message, "Nothing is playing! Use ~play first.");
        }
        try {
            const resolve = await client.riffy.resolve({ query: song, requester: message.author });
            const { loadType, tracks } = resolve;
            if (!tracks?.length) {
                return messages.error(message, "No results found!");
            }
            if (loadType === "playlist") {
                return messages.error(message, "Playlists not supported with /add. Use /play instead.");
            }
            const track = tracks[0];
            track.info.requester = message.author;
            const insertPos = Math.min(position - 1, player.queue.length);
            player.queue.splice(insertPos, 0, track);
            await messages.success(message, `Added **${track.info.title}** at position **${position}**! Queue now has ${player.queue.length} tracks.`);
        } catch (error) {
            await messages.error(message, "Failed to add track!");
        }
    }
};