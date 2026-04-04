const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Blacklist a user from using the bot (owner only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to blacklist')
                .setRequired(true))
};