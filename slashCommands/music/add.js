const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add a track at a specific position')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('Song name or URL')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('Position in queue (1+)')
                .setRequired(true)
                .setMinValue(1))
};