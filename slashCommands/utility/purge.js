const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Delete messages in bulk')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1‑100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('all')
                .setDescription('Delete ALL messages in the channel (admin only)')
                .setRequired(false))
};