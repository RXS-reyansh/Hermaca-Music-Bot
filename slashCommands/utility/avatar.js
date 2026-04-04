const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription("View a user's avatar")
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user (leave empty for yourself)')
                .setRequired(false))
};