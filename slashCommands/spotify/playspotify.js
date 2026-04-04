const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playspotify')
        .setDescription('Play your saved Spotify playlists')
};