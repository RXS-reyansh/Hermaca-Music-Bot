const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setavatar')
        .setDescription('Change the bot\'s server avatar')
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('Image to set as avatar')
                .setRequired(true))
};