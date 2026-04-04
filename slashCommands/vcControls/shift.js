const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shift')
        .setDescription('Move a user to another voice channel')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to move (defaults to yourself)')
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Target voice channel (defaults to bot\'s channel or first VC)')
                .setRequired(false)
                .addChannelTypes(2))
};