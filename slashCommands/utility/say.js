const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Make the bot say something')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Text to say (use \\n for newline, -emoji-<id> for emojis)')
                .setRequired(true))
        .addAttachmentOption(option =>
            option.setName('attachment')
                .setDescription('Optional file to attach')
                .setRequired(false))
};