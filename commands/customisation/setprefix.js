const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');
const ownerId = require('../../config.js').ownerId;

module.exports = {
    name: 'setprefix',
    description: "Change the bot's command prefix for this server",
    category: 'customisation',
    owner: false,
    userPerms: ['Administrator'],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const newPrefix = interaction.options.getString('new_prefix');
        const member = interaction.member;
        const guild = interaction.guild;
        const isOwner = interaction.user.id === ownerId;
        const isAdmin = member.permissions.has('Administrator');
        if (!isOwner && !isAdmin) {
            return messages.error(interaction, "You need `Administrator` permission to change the prefix.");
        }

        const cleanPrefix = newPrefix.trim();
        if (!cleanPrefix) {
            return messages.error(interaction, "Prefix cannot be empty.");
        }
        if (cleanPrefix.length > 10) {
            return messages.error(interaction, "Prefix must be 10 characters or less.");
        }

        const success = await client.db.setGuildPrefix(guild.id, cleanPrefix);
        if (!success) {
            return messages.error(interaction, "Failed to save prefix.");
        }

        client.guildPrefixes.set(guild.id, cleanPrefix);
        await messages.success(interaction, `Command prefix for this server is now \`${cleanPrefix}\`.`);
    },
    prefixExecute: async (message, args, client) => {
        const newPrefix = args.join(' ');
        if (!newPrefix) {
            return messages.error(message, "Please provide a new prefix.");
        }
        const isOwner = message.author.id === ownerId;
        const isAdmin = message.member.permissions.has('Administrator');
        if (!isOwner && !isAdmin) {
            return messages.error(message, "You need `Administrator` permission to change the prefix.");
        }

        const cleanPrefix = newPrefix.trim();
        if (!cleanPrefix) {
            return messages.error(message, "Prefix cannot be empty.");
        }
        if (cleanPrefix.length > 10) {
            return messages.error(message, "Prefix must be 10 characters or less.");
        }

        const success = await client.db.setGuildPrefix(message.guild.id, cleanPrefix);
        if (!success) {
            return messages.error(message, "Failed to save prefix.");
        }

        client.guildPrefixes.set(message.guild.id, cleanPrefix);
        await messages.success(message, `Command prefix for this server is now \`${cleanPrefix}\`.`);
    }
};