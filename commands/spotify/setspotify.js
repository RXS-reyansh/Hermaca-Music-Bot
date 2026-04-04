const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'setspotify',
    description: 'Set your Spotify username for playlist access',
    category: 'spotify',
        owner: false,
    userPerms: [],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const username = interaction.options.getString('username');
        const success = await client.db.setSpotifyId(interaction.user.id, username);
        if (success) {
            client.spotifyIds = await client.db.loadSpotifyIds();
            await messages.success(interaction, `Spotify ID **${username}** saved! Use /playspotify anytime.`);
        } else {
            await messages.error(interaction, "Failed to save Spotify ID!");
        }
    },
    prefixExecute: async (message, args, client) => {
        const username = args.join(' ');
        if (!username) return messages.error(message, "Please provide your Spotify username!");
        const success = await client.db.setSpotifyId(message.author.id, username);
        if (success) {
            client.spotifyIds = await client.db.loadSpotifyIds();
            await messages.success(message, `Spotify ID **${username}** saved! Use /playspotify anytime.`);
        } else {
            await messages.error(message, "Failed to save Spotify ID!");
        }
    }
};
