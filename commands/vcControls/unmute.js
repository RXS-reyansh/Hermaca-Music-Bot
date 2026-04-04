const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');
const { hasMuteMembersPermission } = require('../../utils/permissions.js');
const ownerId = require('../../config.js').ownerId;

module.exports = {
    name: 'unmute',
    description: 'Unmute a user in voice channel',
    category: 'vcControls',
        owner: false,
    userPerms: [],
    botPerms: ['MuteMembers'],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const guild = interaction.guild;
        const commandUserId = interaction.user.id;

        if (!hasMuteMembersPermission(commandUserId, guild, ownerId)) {
            return messages.error(interaction, "You need `Mute Members` permission, Administrator, or be the bot owner to use this command.");
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
            await targetMember.voice.setMute(false);
            const successText = targetUser.id === commandUserId
                ? `Successfully unmuted you in ${targetMember.voice.channel}!`
                : `Successfully unmuted ${targetMember} in ${targetMember.voice.channel}!`;
            await messages.success(interaction, successText);
        } catch (error) {
            console.error(`Unmute error: ${error.message}`);
            await messages.error(interaction, `Failed to unmute: ${error.message}`);
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

        if (!hasMuteMembersPermission(commandUserId, guild, ownerId)) {
            return await messages.error(message, "You need `Mute Members` permission, Administrator, or be the bot owner to use this command.");
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
            await targetMember.voice.setMute(false);
            const successText = targetUser.id === commandUserId
                ? `Successfully unmuted you in ${targetMember.voice.channel}!`
                : `Successfully unmuted ${targetMember} in ${targetMember.voice.channel}!`;
            await messages.success(message, successText);
        } catch (error) {
            console.error(`Unmute error: ${error.message}`);
            await messages.error(message, `Failed to unmute: ${error.message}`);
        }
    }
};
