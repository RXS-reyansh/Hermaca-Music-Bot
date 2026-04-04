const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'leaderboard',
    aliases: ['lb'],
    description: 'Global leaderboard of top listeners',
    category: 'stats',
        owner: false,
    userPerms: [],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        try {
            const leaderboardData = await client.db.getLeaderboard(10);
            await messages.leaderboardInteraction(interaction, leaderboardData);
        } catch (error) {
            console.error('Leaderboard error:', error);
            await messages.error(interaction, "Failed to fetch leaderboard!");
        }
    },
    prefixExecute: async (message, args, client) => {
        try {
            const leaderboardData = await client.db.getLeaderboard(10);
            await messages.leaderboard(message.channel, leaderboardData);
        } catch (error) {
            console.error('Leaderboard error:', error);
            await messages.error(message, "Failed to fetch leaderboard!");
        }
    }
};
