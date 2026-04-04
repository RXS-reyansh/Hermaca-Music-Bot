const { EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis.js');
const config = require('../../config.js');
const messages = require('../../utils/messages.js');
const { aliases } = require('./blacklist.js');
const ownerId = require('../../config.js').ownerId;

module.exports = {
    name: 'noprefix',
    aliases: ['nop'],
    description: 'Manage noprefix access (owner only)',
    category: 'developer',
    owner: true,
    userPerms: [],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'enable' || subcommand === 'disable') {
            const newState = subcommand === 'enable';
            await client.db.setNoprefixGlobalEnabled(newState);
            client.noprefixGlobalEnabled = newState;
            await interaction.editReply(`Global noprefix is now **${newState ? 'ENABLED' : 'DISABLED'}**.`);
        } else if (subcommand === 'list') {
            const users = await client.db.getAllNoPrefixUsers();
            if (!users.length) {
                return interaction.editReply('No users have noprefix access (besides owner).');
            }
            const userMentions = users.map(id => `<@${id}>`).join('\n');
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${emojis.blackbutterfly} Noprefix Users`)
                .setDescription(userMentions)
                .setFooter({ text: `Total: ${users.length}` });
            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'add') {
            const targetUser = interaction.options.getUser('user');
            const added = await client.db.addNoPrefixUser(targetUser.id);
            if (added) {
                await interaction.editReply(`Added noprefix access for ${targetUser}`);
            } else {
                await interaction.editReply('Failed to add user.');
            }
        } else if (subcommand === 'remove') {
            const targetUser = interaction.options.getUser('user');
            const removed = await client.db.removeNoPrefixUser(targetUser.id);
            if (removed) {
                await interaction.editReply(`Removed noprefix access from ${targetUser}`);
            } else {
                await interaction.editReply('That user does not have noprefix access.');
            }
        }
    },
    prefixExecute: async (message, args, client) => {
        if (message.author.id !== ownerId) {
            return message.reply(`${emojis.blackcrown} This command is reserved for bot owner only!`);
        }

        const subCmd = args[0] ? args[0].toLowerCase() : null;
        if (!subCmd) {
            return messages.error(message, "Usage: `noprefix list`, `noprefix <user>` (add), `noprefix remove <user>`, `noprefix enable`, `noprefix disable`");
        }

        if (subCmd === 'enable' || subCmd === 'disable') {
            const newState = (subCmd === 'enable');
            await client.db.setNoprefixGlobalEnabled(newState);
            client.noprefixGlobalEnabled = newState;
            return messages.success(message, `Global noprefix is now **${newState ? 'ENABLED' : 'DISABLED'}**.`);
        }

        if (subCmd === 'list') {
            const users = await client.db.getAllNoPrefixUsers();
            if (users.length === 0) {
                return messages.info(message, "No users have noprefix access (besides owner).");
            }
            const userMentions = users.map(id => `<@${id}>`).join('\n');
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${emojis.blackbutterfly} Noprefix Users`)
                .setDescription(userMentions)
                .setFooter({ text: `Total: ${users.length}` });
            return message.channel.send({ embeds: [embed] });
        }

        if (subCmd === 'remove') {
            if (!args[1]) return messages.error(message, "Please specify a user to remove.");
            const userId = args[1].replace(/[<@!>]/g, '');
            let user;
            try {
                user = await client.users.fetch(userId, { force: true });
            } catch {
                return messages.error(message, "User not found or invalid ID.");
            }
            const removed = await client.db.removeNoPrefixUser(userId);
            if (removed) {
                return messages.success(message, `Removed noprefix access from <@${user.id}>`);
            } else {
                return messages.error(message, "That user does not have noprefix access.");
            }
        }

        // Default: add user
        const userId = args[0].replace(/[<@!>]/g, '');
        let user;
        try {
            user = await client.users.fetch(userId, { force: true });
        } catch {
            return messages.error(message, "User not found or invalid ID.");
        }
        const added = await client.db.addNoPrefixUser(userId);
        if (added) {
            return messages.success(message, `Added noprefix access for <@${user.id}>`);
        } else {
            return messages.error(message, "Failed to add user.");
        }
    }
};