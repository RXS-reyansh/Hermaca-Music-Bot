const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reveal')
        .setDescription('Reveal spoiler text in a message (reply to a message)')
};