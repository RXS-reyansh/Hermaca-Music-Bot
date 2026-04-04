const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rejoin')
        .setDescription('Make the bot leave and rejoin the current voice channel')
};