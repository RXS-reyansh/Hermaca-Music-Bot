const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetprofile')
        .setDescription('Reset the bot\'s server profile (nickname, avatar, banner, bio) to global defaults')
};