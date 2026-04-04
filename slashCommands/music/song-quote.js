const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('song-quote')
        .setDescription('Create a quote image with current track')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text to display on the image')
                .setRequired(true))
};