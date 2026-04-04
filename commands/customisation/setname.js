const { REST, Routes } = require('discord.js');
const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');
const config = require('../../config.js');
const ownerId = require('../../config.js').ownerId;

module.exports = {
    name: 'setname',
    description: "Change the bot's server nickname",
    category: 'customisation',
    owner: false,
    userPerms: ['Administrator'],
    botPerms: ['ChangeNickname'],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const nickname = interaction.options.getString('nickname');
        if (nickname.length > 32) {
            return messages.error(interaction, "Nickname must be 32 characters or less.");
        }
        await messages.loading(interaction, "Changing nickname...");
        try {
            const rest = new REST({ version: '10' }).setToken(config.botToken);
            await rest.patch(Routes.guildMember(interaction.guild.id, '@me'), {
                body: { nick: nickname }
            });
            await messages.success(interaction, `Nickname changed to **${nickname}**!`);
        } catch (error) {
            console.error(`Setname slash error: ${error.message}`);
            await messages.error(interaction, `Failed: ${error.message}`);
        }
    },
    prefixExecute: async (message, args, client) => {
        const isOwner = message.author.id === ownerId;
        if (!isOwner && !message.member.permissions.has('Administrator')) {
            return messages.error(message, "You need `Administrator` permission.");
        }
        if (args[0] && args[0].toLowerCase() === 'reset') {
            const loadingMsg = await message.channel.send(`${emojis.loading} | Resetting nickname...`);
            try {
                const rest = new REST({ version: '10' }).setToken(config.botToken);
                await rest.patch(Routes.guildMember(message.guild.id, '@me'), { body: { nick: null } });
                await message.channel.send(`${emojis.success} | Nickname reset to global username!`);
                setTimeout(() => loadingMsg.delete().catch(() => {}), 3000);
            } catch (error) {
                console.error(`Reset nickname error: ${error.message}`);
                await loadingMsg.delete().catch(() => {});
                await message.channel.send(`${emojis.error} | Failed to reset nickname: ${error.message}`);
            }
            return;
        }

        const newNick = args.join(' ').trim();
        if (!newNick) {
            return messages.error(message, "Please provide a new nickname for the bot.");
        }
        if (newNick.length > 32) {
            return messages.error(message, "Nickname must be 32 characters or less.");
        }

        const loadingMsg = await message.channel.send(`${emojis.loading} | Changing nickname...`);
        try {
            const rest = new REST({ version: '10' }).setToken(config.botToken);
            await rest.patch(Routes.guildMember(message.guild.id, '@me'), { body: { nick: newNick } });
            await message.channel.send(`${emojis.success} | Nickname changed to **${newNick}**!`);
            setTimeout(() => loadingMsg.delete().catch(() => {}), 3000);
        } catch (error) {
            console.error(`Setname error: ${error.message}`);
            await loadingMsg.delete().catch(() => {});
            if (error.status === 403) {
                await message.channel.send(`${emojis.error} | Missing permissions! I need the \`Change Nickname\` permission.`);
            } else {
                await message.channel.send(`${emojis.error} | Failed to change nickname: ${error.message}`);
            }
        }
    }
};