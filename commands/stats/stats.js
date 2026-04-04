const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'stats',
    description: "View your or another user's music statistics",
    category: 'stats',
        owner: false,
    userPerms: [],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        try {
            const userStats = await client.db.getUserStats(targetUser.id);
            const userRank = await client.db.getUserRank(targetUser.id);
            if (!userStats) {
                return messages.error(interaction, `No statistics found for ${targetUser.username}. Play some music first!`);
            }
            await messages.userStatsEmbedInteraction(interaction, userStats, userRank, targetUser, interaction.user.id === targetUser.id);
        } catch (error) {
            console.error('Stats error:', error);
            await messages.error(interaction, "Failed to fetch statistics!");
        }
    },
    prefixExecute: async (message, args, client) => {
        let targetUser = message.author;
        if (args.length > 0) {
            const mention = args[0].match(/^<@!?(\d+)>$/);
            const userId = mention ? mention[1] : args[0];
            try {
                targetUser = await client.users.fetch(userId);
            } catch {
                return messages.error(message, "Invalid user! Use `~stats` for your own stats or `~stats @user` for another user.");
            }
        }
        try {
            const userStats = await client.db.getUserStats(targetUser.id);
            const userRank = await client.db.getUserRank(targetUser.id);
            if (!userStats) {
                return messages.error(message, `No statistics found for ${targetUser.username}. Play some music first!`);
            }
            await messages.userStats(message.channel, userStats, userRank, targetUser);
        } catch (error) {
            console.error('Stats error:', error);
            await messages.error(message, "Failed to fetch statistics!");
        }
    }
};
