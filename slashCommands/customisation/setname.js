const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setname')
        .setDescription('Change the bot\'s server nickname')
        .addStringOption(option =>
            option.setName('nickname')
                .setDescription('New nickname (max 32 characters)')
                .setRequired(true))
};