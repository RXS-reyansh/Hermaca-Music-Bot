const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Make the bot leave the voice channel')
};