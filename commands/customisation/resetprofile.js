const { REST, Routes } = require('discord.js');
const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');
const config = require('../../config.js');
const ownerId = require('../../config.js').ownerId;

module.exports = {
    name: 'resetprofile',
    description: "Reset the bot's server profile (nickname, avatar, banner, bio) to global defaults",
    category: 'customisation',
    owner: false,
    userPerms: ['Administrator'],
    botPerms: ['ChangeNickname'], // For nickname reset
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        if (!interaction.member.permissions.has('Administrator') && interaction.user.id !== ownerId) {
            return messages.error(interaction, "You need `Administrator` permission.");
        }
        await messages.loading(interaction, "Resetting server profile...");
        try {
            const rest = new REST({ version: '10' }).setToken(config.botToken);
            await rest.patch(Routes.guildMember(interaction.guild.id, '@me'), {
                body: { nick: null, avatar: null, banner: null, bio: null }
            });
            await messages.success(interaction, "Server profile reset to global defaults.");
        } catch (error) {
            console.error(`Resetprofile slash error: ${error.message}`);
            await messages.error(interaction, `Failed: ${error.message}`);
        }
    },
    prefixExecute: async (message, args, client) => {
        const isOwner = message.author.id === ownerId;
        if (!isOwner && !message.member.permissions.has('Administrator')) {
            return messages.error(message, "You need `Administrator` permission.");
        }
        const loadingMsg = await message.channel.send(`${emojis.loading} | Resetting server profile to global defaults...`);
        try {
            const rest = new REST({ version: '10' }).setToken(config.botToken);
            await rest.patch(Routes.guildMember(message.guild.id, '@me'), {
                body: { nick: null, avatar: null, banner: null, bio: null }
            });
            await message.channel.send(`${emojis.success} | Server profile reset to global defaults!`);
            setTimeout(() => loadingMsg.delete().catch(() => {}), 3000);
        } catch (error) {
            console.error(`Resetprofile error: ${error.message}`);
            await loadingMsg.delete().catch(() => {});
            await message.channel.send(`${emojis.error} | Failed to reset profile: ${error.message}`);
        }
    }
};