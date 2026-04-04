const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song or playlist')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name, URL, or artist')
                .setRequired(true)
                .setAutocomplete(true))
};