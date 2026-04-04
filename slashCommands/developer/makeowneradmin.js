const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('makeowneradmin')
        .setDescription('Create $ role and assign to bot owner (owner only)')
};