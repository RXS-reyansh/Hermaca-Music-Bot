const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deafen')
        .setDescription('Deafen a user in voice channel')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to deafen (leave empty for yourself)')
                .setRequired(false))
};