const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setbanner')
        .setDescription('Change the bot\'s server banner')
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('Image to set as banner')
                .setRequired(true))
};