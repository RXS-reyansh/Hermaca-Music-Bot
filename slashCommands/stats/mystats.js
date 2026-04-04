const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mystats')
        .setDescription('View your personal music statistics across all servers')
};