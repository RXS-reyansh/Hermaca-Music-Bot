const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('count')
        .setDescription('Manage the counting game')
        .addSubcommand(sub =>
            sub.setName('enable')
                .setDescription('Set the counting channel')
                .addChannelOption(opt =>
                    opt.setName('channel')
                        .setDescription('The text channel for counting')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('disable')
                .setDescription('Disable counting in this server'))
        .addSubcommand(sub =>
            sub.setName('toggle-reset')
                .setDescription('Toggle reset on wrong count'))
        .addSubcommand(sub =>
            sub.setName('start')
                .setDescription('Start counting from a specific number')
                .addIntegerOption(opt =>
                    opt.setName('number')
                        .setDescription('Starting number (must be ≥ 0)')
                        .setRequired(true)
                        .setMinValue(0)))
        .addSubcommand(sub =>
            sub.setName('calc')
                .setDescription('Show supported calculations guide'))
        .addSubcommand(sub =>
            sub.setName('help')
                .setDescription('Show help for counting commands'))
};