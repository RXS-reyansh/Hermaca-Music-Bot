const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('react')
        .setDescription('React to a message with an emoji')
        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('ID of the message to react to')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('emoji')
                .setDescription('Emoji name, ID, or custom emoji')
                .setRequired(true))
};