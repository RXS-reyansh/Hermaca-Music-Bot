const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');
const { aliases } = require('./blacklist.js');
const ownerId = require('../../config.js').ownerId;

module.exports = {
    name: 'unblacklist',
    aliases: ['unbl', 'ubl'],
    description: 'Remove a user from the blacklist (owner only)',
    category: 'developer',
    owner: true,
    userPerms: [],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const targetUser = interaction.options.getUser('user');
        if (!targetUser) {
            return messages.error(interaction, "Please provide a user to unblacklist.");
        }

        const removed = await client.db.removeBlacklistedUser(targetUser.id);
        if (removed) {
            await messages.success(interaction, `Successfully removed ${targetUser} from the blacklist.`);
        } else {
            await messages.error(interaction, "User was not in the blacklist or failed to remove.");
        }
    },
    prefixExecute: async (message, args, client) => {
        if (message.author.id !== ownerId) {
            return messages.error(message, "This command is reserved for bot owner only!");
        }

        const target = args[0];
        if (!target) {
            return messages.error(message, "Please provide a user mention or ID to unblacklist.");
        }

        let userId = target.replace(/[<@!>]/g, '');
        let user;
        try {
            user = await client.users.fetch(userId, { force: true });
        } catch {
            return messages.error(message, "Invalid user ID or user not found.");
        }

        const removed = await client.db.removeBlacklistedUser(user.id);
        if (removed) {
            await messages.success(message.channel, `Successfully removed ${user} from the blacklist. They can now use bot commands again.`);
        } else {
            await messages.error(message.channel, "User was not in the blacklist or failed to remove.");
        }
    }
};