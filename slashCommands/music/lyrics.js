const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Show lyrics of the current track')
};