const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user in voice channel')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to mute (leave empty for yourself)')
                .setRequired(false))
};