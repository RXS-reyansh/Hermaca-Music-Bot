const { PermissionsBitField } = require('discord.js');
const emojis = require('../emojis.js');

/**
 * Validates a command (slash or prefix) and returns an error message or null.
 */
function validate(command, context, client, ownerId) {
    // Common properties
    const isInteraction = context.isCommand !== undefined;
    const user = isInteraction ? context.user : context.author;
    const member = isInteraction ? context.member : context.member;
    const guild = isInteraction ? context.guild : context.guild;

    // 1. Owner check
    if (command.owner && user.id !== ownerId) {
        return `${emojis.error} | This command is reserved for the bot owner.`;
    }

    // 2. User permissions
    if (command.userPerms?.length) {
        const missing = command.userPerms.filter(perm => !member.permissions.has(perm));
        if (missing.length) {
            return `${emojis.error} | You need the following permissions: ${missing.join(', ')}`;
        }
    }

    // 3. Bot permissions
    if (command.botPerms?.length) {
        const botMember = guild.members.me;
        const missing = command.botPerms.filter(perm => !botMember.permissions.has(perm));
        if (missing.length) {
            return `${emojis.error} | I need the following permissions: ${missing.join(', ')}`;
        }
    }

    // 4. Player existence (if required)
    if (command.player) {
        const player = client.riffy.players.get(guild.id);
        if (!player || !player.current) {
            return `${emojis.error} | No track is currently playing!`;
        }
    }

    // 5. Bot in voice channel (if required)
    if (command.inVoiceChannel) {
        const botVoice = guild.members.me.voice.channel;
        if (!botVoice) {
            return `${emojis.error} | I'm not in a voice channel!`;
        }
    }

    // 6. Same voice channel (if required)
    if (command.sameVoiceChannel && command.inVoiceChannel) {
        const botVoice = guild.members.me.voice.channel;
        const userVoice = member.voice.channel;
        if (!userVoice || userVoice.id !== botVoice?.id) {
            return `${emojis.error} | You must be in the same voice channel as me!`;
        }
    }

    return null; // All checks passed
}

module.exports = { validate };