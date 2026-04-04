const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setspotify')
        .setDescription('Set your Spotify username for playlist access')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Your Spotify username')
                .setRequired(true))
};