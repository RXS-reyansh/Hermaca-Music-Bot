const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'mystats',
    description: 'View your personal music statistics across all servers',
    category: 'stats',
        owner: false,
    userPerms: [],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        try {
            const userStats = await client.db.getUserStats(interaction.user.id);
            const userRank = await client.db.getUserRank(interaction.user.id);
            if (!userStats) {
                return messages.error(interaction, `No statistics found for ${interaction.user.username}. Play some music first!`);
            }
            await messages.userStatsEmbedInteraction(interaction, userStats, userRank, interaction.user, true);
        } catch (error) {
            console.error('Mystats error:', error);
            await messages.error(interaction, "Failed to fetch statistics!");
        }
    },
    prefixExecute: async (message, args, client) => {
        try {
            const userStats = await client.db.getUserStats(message.author.id);
            const userRank = await client.db.getUserRank(message.author.id);
            if (!userStats) {
                return messages.error(message, `No statistics found for ${message.author.username}. Play some music first!`);
            }
            await messages.userStats(message.channel, userStats, userRank, message.author);
        } catch (error) {
            console.error('Mystats error:', error);
            await messages.error(message, "Failed to fetch statistics!");
        }
    }
};
