const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emoji')
        .setDescription('Send emoji(s) as text')
        .addStringOption(option =>
            option.setName('emojis')
                .setDescription('Emoji identifiers (separate with spaces, use /$/ to join without spaces)')
                .setRequired(true))
};