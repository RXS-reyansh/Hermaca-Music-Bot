const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skipto')
        .setDescription('Skip to a specific track in the queue')
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('Track position in the queue')
                .setRequired(true)
                .setMinValue(1))
};