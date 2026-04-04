const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: [
        new SlashCommandBuilder()
            .setName('24-7-enable')
            .setDescription('Enable 24/7 mode in a voice channel')
            .addChannelOption(option =>
                option.setName('channel')
                    .setDescription('The voice channel to stay in 24/7')
                    .setRequired(false)
                    .addChannelTypes(2)),
        new SlashCommandBuilder()
            .setName('24-7-disable')
            .setDescription('Disable 24/7 mode')
    ]
};