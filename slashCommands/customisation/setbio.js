const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setbio')
        .setDescription('Set the bot\'s server profile bio (About Me)')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('Bio text or "reset" to clear')
                .setRequired(true))
};