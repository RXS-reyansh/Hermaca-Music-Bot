const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('disconnect')
        .setDescription('Disconnect a user from voice channel (defaults to yourself)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to disconnect (leave empty for yourself)')
                .setRequired(false))
};