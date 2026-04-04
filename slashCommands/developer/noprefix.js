const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('noprefix')
        .setDescription('Manage noprefix access (owner only)')
        .addSubcommand(sub =>
            sub.setName('enable')
                .setDescription('Enable global noprefix mode'))
        .addSubcommand(sub =>
            sub.setName('disable')
                .setDescription('Disable global noprefix mode'))
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('List users with noprefix access'))
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Add a user to noprefix access')
                .addUserOption(opt =>
                    opt.setName('user')
                        .setDescription('User to add')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Remove a user from noprefix access')
                .addUserOption(opt =>
                    opt.setName('user')
                        .setDescription('User to remove')
                        .setRequired(true)))
};