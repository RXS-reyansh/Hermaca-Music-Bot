const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Set your AFK status with a reason (and optional image)')
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for being AFK')
                .setRequired(true))
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('Image to display with your AFK status')
                .setRequired(false))
};