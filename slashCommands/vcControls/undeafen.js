const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('undeafen')
        .setDescription('Undeafen a user in voice channel')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to undeafen (leave empty for yourself)')
                .setRequired(false))
};