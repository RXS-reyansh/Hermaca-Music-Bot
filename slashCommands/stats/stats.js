const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription("View your or another user's music statistics")
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to view stats for (leave empty for yourself)')
                .setRequired(false))
};