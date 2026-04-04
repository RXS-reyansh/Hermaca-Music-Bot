const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Make the bot join a voice channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The voice channel to join (optional)')
                .setRequired(false)
                .addChannelTypes(2))
};