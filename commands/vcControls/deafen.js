const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');
const { hasDeafenMembersPermission } = require('../../utils/permissions.js');
const ownerId = require('../../config.js').ownerId;

module.exports = {
    name: 'deafen',
    description: 'Deafen a user in voice channel',
    category: 'vcControls',
        owner: false,
    userPerms: [],
    botPerms: ['DeafenMembers'],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const guild = interaction.guild;
        const commandUserId = interaction.user.id;

        if (!hasDeafenMembersPermission(commandUserId, guild, ownerId)) {
            return await messages.error(interaction, "You need `Deafen Members` permission, Administrator, or be the bot owner to use this command.");
        }

        let targetMember;
        try {
            targetMember = await guild.members.fetch(targetUser.id);
        } catch {
            return messages.error(interaction, "Could not find that user in this server.");
        }

        if (!targetMember.voice.channel) {
            if (targetUser.id === commandUserId) {
                return messages.error(interaction, "You are not in a voice channel!");
            } else {
                return messages.error(interaction, "The user is not in any voice channel!");
            }
        }

        try {
            await targetMember.voice.setDeaf(true);
            const successText = targetUser.id === commandUserId
                ? `Successfully deafened you in ${targetMember.voice.channel}!`
                : `Successfully deafened ${targetMember} in ${targetMember.voice.channel}!`;
            await messages.success(interaction, successText);
        } catch (error) {
            console.error(`Deafen error: ${error.message}`);
            await messages.error(interaction, `Failed to deafen: ${error.message}`);
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

        if (!hasDeafenMembersPermission(commandUserId, guild, ownerId)) {
            return await messages.error(message, "You need `Deafen Members` permission, Administrator, or be the bot owner to use this command.");
        }

        let targetMember;
        try {
            targetMember = await guild.members.fetch(targetUser.id);
        } catch {
            return await messages.error(message, "Could not find that user in this server.");
        }

        if (!targetMember.voice.channel) {
            if (targetUser.id === commandUserId) {
                return await messages.error(message, "You are not in a voice channel!");
            } else {
                return await messages.error(message, "The user is not in any voice channel!");
            }
        }

        try {
            await targetMember.voice.setDeaf(true);
            const successText = targetUser.id === commandUserId
                ? `Successfully deafened you in ${targetMember.voice.channel}!`
                : `Successfully deafened ${targetMember} in ${targetMember.voice.channel}!`;
            await messages.success(message, successText);
        } catch (error) {
            console.error(`Deafen error: ${error.message}`);
            await messages.error(message, `Failed to deafen: ${error.message}`);
        }
    }
};
