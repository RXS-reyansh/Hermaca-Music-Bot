const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all commands or get help for a specific command')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Get help for a specific command')
                .setRequired(false)
                .setAutocomplete(true))
};