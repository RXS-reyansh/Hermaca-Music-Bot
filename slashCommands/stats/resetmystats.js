const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetmystats')
        .setDescription('Reset your personal statistics (irreversible!)')
};