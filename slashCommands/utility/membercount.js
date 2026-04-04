const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('membercount')
        .setDescription('Shows the number of members, users, and bots in the server')
};