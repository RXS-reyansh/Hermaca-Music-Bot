const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unblacklist')
        .setDescription('Remove a user from the blacklist (owner only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to unblacklist')
                .setRequired(true))
};