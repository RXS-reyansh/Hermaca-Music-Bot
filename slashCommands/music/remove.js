const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a track from queue')
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('Position to remove (1+)')
                .setRequired(true)
                .setMinValue(1))
};