const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Adjust player volume (0-100)')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Volume level (0-100)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(100))
};