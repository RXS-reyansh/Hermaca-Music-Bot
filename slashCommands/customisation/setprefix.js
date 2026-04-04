const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setprefix')
        .setDescription('Change the bot\'s command prefix for this server')
        .addStringOption(option =>
            option.setName('new_prefix')
                .setDescription('New prefix (single word, max 10 characters)')
                .setRequired(true)
                .setMaxLength(10))
};