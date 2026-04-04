const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banner')
        .setDescription("View a user's banner")
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user (leave empty for yourself)')
                .setRequired(false))
};