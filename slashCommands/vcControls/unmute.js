const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmute a user in voice channel')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to unmute (leave empty for yourself)')
                .setRequired(false))
};