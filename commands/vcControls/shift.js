const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');
const { hasMoveMembersPermission } = require('../../utils/permissions.js');
const ownerId = require('../../config.js').ownerId;

module.exports = {
    name: 'shift',
    description: 'Move a user to another voice channel',
    category: 'vcControls',
    owner: false,
    userPerms: [],
    botPerms: ['MoveMembers'],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const targetChannel = interaction.options.getChannel('channel');
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
                return messages.error(interaction, "You are not in a voice channel!");
            } else {
                return messages.error(interaction, "The user is not in any voice channel!");
            }
        }
        const sourceChannel = targetMember.voice.channel;

        let destChannel;
        if (targetChannel) {
            destChannel = guild.channels.cache.get(targetChannel.id);
            if (!destChannel) return messages.error(interaction, "Voice channel not found!");
            if (destChannel.type !== 2) return messages.error(interaction, "Provide a voice channel!");
        } else {
            const botMember = guild.members.me;
            if (botMember.voice.channel) {
                destChannel = botMember.voice.channel;
            } else {
                const voiceChannels = guild.channels.cache.filter(c => c.type === 2).sort((a, b) => a.rawPosition - b.rawPosition);
                destChannel = voiceChannels.first();
                if (!destChannel) return messages.error(interaction, "No voice channels exist in this server!");
            }
        }
        // Check if already in the same channel
        if (destChannel.id === sourceChannel.id) {
            return messages.error(interaction, "User is already in that voice channel.");
        }

        try {
            await targetMember.voice.setChannel(destChannel);
            await messages.success(interaction, `Shifted ${targetMember} from ${sourceChannel} to ${destChannel}!`);
        } catch (error) {
            console.error(`Shift error: ${error.message}`);
            await messages.error(interaction, `Failed to shift: ${error.message}`);
        }
    },
    prefixExecute: async (message, args, client) => {
        let targetUser = message.author;
        let targetChannel = null;
        const guild = message.guild;
        const commandUserId = message.author.id;

        if (args.length >= 1) {
            const userMatch = args[0].match(/^<@!?(\d+)>$/);
            const userId = userMatch ? userMatch[1] : args[0];
            try {
                targetUser = await client.users.fetch(userId);
                args.shift();
            } catch { /* ignore */ }
        }
        if (args.length >= 1) {
            const channelMatch = args[0].match(/^<#(\d+)>$/);
            const channelId = channelMatch ? channelMatch[1] : args[0];
            targetChannel = message.guild.channels.cache.get(channelId);
            if (targetChannel) args.shift();
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
                return await messages.error(message, "You are not in a voice channel!");
            } else {
                return await messages.error(message, "The user is not in any voice channel!");
            }
        }
        const sourceChannel = targetMember.voice.channel;

        let destChannel;
        if (targetChannel) {
            destChannel = guild.channels.cache.get(targetChannel.id);
            if (!destChannel) return await messages.error(message, "Voice channel not found!");
            if (destChannel.type !== 2) return await messages.error(message, "Provide a voice channel!");
        } else {
            const botMember = guild.members.me;
            if (botMember.voice.channel) {
                destChannel = botMember.voice.channel;
            } else {
                const voiceChannels = guild.channels.cache.filter(c => c.type === 2).sort((a, b) => a.rawPosition - b.rawPosition);
                destChannel = voiceChannels.first();
                if (!destChannel) return await messages.error(message, "No voice channels exist in this server!");
            }
        }
        // Check if already in the same channel
        if (destChannel.id === sourceChannel.id) {
            return await messages.error(message, "User is already in that voice channel.");
        }

        try {
            await targetMember.voice.setChannel(destChannel);
            await messages.success(message, `Shifted ${targetMember} from ${sourceChannel} to ${destChannel}!`);
        } catch (error) {
            console.error(`Shift error: ${error.message}`);
            await messages.error(message, `Failed to shift: ${error.message}`);
        }
    }
};
