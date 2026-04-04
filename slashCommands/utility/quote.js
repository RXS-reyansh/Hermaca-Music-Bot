const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quote')
        .setDescription('Generate a quote image from a message')
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('The ID of the message to quote')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Optional custom text to add')
                .setRequired(false))
};