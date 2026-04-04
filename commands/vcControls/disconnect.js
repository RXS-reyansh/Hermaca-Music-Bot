const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');
const { hasMoveMembersPermission } = require('../../utils/permissions.js');
const ownerId = require('../../config.js').ownerId;

module.exports = {
    name: 'disconnect',
    description: 'Disconnect a user from voice channel (defaults to yourself)',
    category: 'vcControls',
        owner: false,
    userPerms: [],
    botPerms: ['MoveMembers'],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const guild = interaction.guild;
        const commandUserId = interaction.user.id;

        if (!hasMoveMembersPermission(commandUserId, guild, ownerId)) {
            return messages.error(interaction, "You need `Move Members` permission, Administrator, or be the bot owner to use this command.");
        }

        let targetMember;
        try {
            targetMember = await guild.members.fetch(targetUser.id);
        } catch {
            return messages.error(interaction, "Could not find that user in this server.");
        }

        if (!targetMember.voice.channel) {
            if (targetUser.id === commandUserId) {
                return messages.error(interaction, "You are not in any voice channel!");
            } else {
                return messages.error(interaction, "The provided user is not in any voice channel!");
            }
        }
        const sourceChannel = targetMember.voice.channel;

        try {
            await targetMember.voice.disconnect();
            const successText = targetUser.id === commandUserId
                ? `Successfully disconnected you from ${sourceChannel}!`
                : `Successfully disconnected ${targetMember} from ${sourceChannel}!`;
            await messages.success(interaction, successText);
        } catch (error) {
            console.error(`Disconnect error: ${error.message}`);
            await messages.error(interaction, `Failed to disconnect: ${error.message}`);
        }
    },
    prefixExecute: async (message, args, client) => {
        let targetUser = message.author;
        const guild = message.guild;
        const commandUserId = message.author.id;

        if (args.length > 0) {
            const mention = args[0].match(/^<@!?(\d+)>$/);
            const userId = mention ? mention[1] : args[0];
            try {
                targetUser = await client.users.fetch(userId);
            } catch { /* ignore */ }
        }

        if (!hasMoveMembersPermission(commandUserId, guild, ownerId)) {
            return await messages.error(message, "You need `Move Members` permission, Administrator, or be the bot owner to use this command.");
        }

        let targetMember;
        try {
            targetMember = await guild.members.fetch(targetUser.id);
        } catch {
            return await messages.error(message, "Could not find that user in this server.");
        }

        if (!targetMember.voice.channel) {
            if (targetUser.id === commandUserId) {
                return await messages.error(message, "You are not in any voice channel!");
            } else {
                return await messages.error(message, "The provided user is not in any voice channel!");
            }
        }
        const sourceChannel = targetMember.voice.channel;

        try {
            await targetMember.voice.disconnect();
            const successText = targetUser.id === commandUserId
                ? `Successfully disconnected you from ${sourceChannel}!`
                : `Successfully disconnected ${targetMember} from ${sourceChannel}!`;
            await messages.success(message, successText);
        } catch (error) {
            console.error(`Disconnect error: ${error.message}`);
            await messages.error(message, `Failed to disconnect: ${error.message}`);
        }
    }
};
