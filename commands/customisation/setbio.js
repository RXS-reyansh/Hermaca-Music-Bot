const { REST, Routes } = require('discord.js');
const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');
const config = require('../../config.js');
const ownerId = require('../../config.js').ownerId;

module.exports = {
    name: 'setbio',
    description: "Set the bot's server profile bio (About Me)",
    category: 'customisation',
    owner: false,
    userPerms: ['Administrator'],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const text = interaction.options.getString('text');
        const isOwner = interaction.user.id === ownerId;
        if (!isOwner && !interaction.member.permissions.has('Administrator')) {
            return messages.error(interaction, "You need `Administrator` permission.");
        }

        if (text.toLowerCase() === 'reset') {
            await messages.loading(interaction, "Resetting server bio...");
            try {
                const rest = new REST({ version: '10' }).setToken(config.botToken);
                await rest.patch(Routes.guildMember(interaction.guild.id, '@me'), { body: { bio: null } });
                await messages.success(interaction, "Server bio reset to global default!");
            } catch (error) {
                console.error(`Setbio slash reset error: ${error.message}`);
                await messages.error(interaction, `Failed to reset bio: ${error.message}`);
            }
            return;
        }

        const withNewlines = text.replace(/\\n/g, '\n');
        const { result: finalBio, invalid } = await client.replaceEmojiPlaceholders(withNewlines, interaction.client, interaction.guild);
        if (invalid.length) {
            return messages.error(interaction, `The following emoji identifiers were not found:\n${invalid.map(id => `• ${id}`).join('\n')}`);
        }
        if (finalBio.length > 190) {
            return messages.error(interaction, `Bio exceeds the **190 character limit** (current: **${finalBio.length} characters**).\nPlease shorten your bio by **${finalBio.length - 190}** characters and try again.`);
        }

        await messages.loading(interaction, "Setting server bio...");
        try {
            const rest = new REST({ version: '10' }).setToken(config.botToken);
            await rest.patch(Routes.guildMember(interaction.guild.id, '@me'), { body: { bio: finalBio } });
            const quotedBio = finalBio.split('\n').map(line => `> ${line}`).join('\n');
            await messages.success(interaction, `Server bio set to:\n${quotedBio}`);
        } catch (error) {
            console.error(`Setbio slash error: ${error.message}`);
            if (error.message.includes('190') || error.message.includes('BASE_TYPE_MAX_LENGTH')) {
                await messages.error(interaction, "Discord's character limit is **190 characters**. Your bio is too long.");
            } else if (error.message.includes('50035')) {
                await messages.error(interaction, "Invalid bio format. Please check for unsupported characters.");
            } else {
                await messages.error(interaction, `Failed to set bio: ${error.message}`);
            }
        }
    },
    prefixExecute: async (message, args, client) => {
        const isOwner = message.author.id === ownerId;
        if (!isOwner && !message.member.permissions.has('Administrator')) {
            return messages.error(message, "You need `Administrator` permission.");
        }
        const rawBio = message.content.slice(client.prefix.length + 'setbio'.length).replace(/^\s+/, '');
        if (!rawBio) {
            return messages.error(message, "Please provide bio text or \"reset\".");
        }
        if (rawBio.toLowerCase() === 'reset') {
            const loadingMsg = await message.channel.send(`${emojis.loading} | Resetting server profile bio...`);
            try {
                const rest = new REST({ version: '10' }).setToken(config.botToken);
                await rest.patch(Routes.guildMember(message.guild.id, '@me'), { body: { bio: null } });
                await message.channel.send(`${emojis.success} | Server bio reset to global default!`);
                setTimeout(() => loadingMsg.delete().catch(() => {}), 3000);
            } catch (error) {
                console.error(`Setbio reset error: ${error.message}`);
                await loadingMsg.delete().catch(() => {});
                await message.channel.send(`${emojis.error} | Failed to reset bio: ${error.message}`);
            }
            return;
        }

        const withNewlines = rawBio.replace(/\\n/g, '\n');
        const { result: finalBio, invalid } = await client.replaceEmojiPlaceholders(withNewlines, client, message.guild);
        if (invalid.length) {
            return messages.error(message, `The following emoji identifiers were not found:\n${invalid.map(id => `• ${id}`).join('\n')}`);
        }
        if (finalBio.length > 190) {
            return messages.error(message, `Bio exceeds the **190 character limit** (current: **${finalBio.length} characters**).\nPlease shorten your bio by **${finalBio.length - 190}** characters and try again.`);
        }

        const loadingMsg = await message.channel.send(`${emojis.loading} | Setting server profile bio...`);
        try {
            const rest = new REST({ version: '10' }).setToken(config.botToken);
            await rest.patch(Routes.guildMember(message.guild.id, '@me'), { body: { bio: finalBio } });
            const quotedBio = finalBio.split('\n').map(line => `> ${line}`).join('\n');
            await message.channel.send(`${emojis.success} | Server bio set to:\n${quotedBio}`);
            setTimeout(() => loadingMsg.delete().catch(() => {}), 3000);
        } catch (error) {
            console.error(`Setbio error: ${error.message}`);
            await loadingMsg.delete().catch(() => {});
            if (error.message.includes('190') || error.message.includes('BASE_TYPE_MAX_LENGTH')) {
                await message.channel.send(`${emojis.error} | Discord's character limit is **190 characters**. Your bio is too long.`);
            } else if (error.message.includes('50035')) {
                await message.channel.send(`${emojis.error} | Invalid bio format. Please check for unsupported characters.`);
            } else {
                await message.channel.send(`${emojis.error} | Failed to set bio: ${error.message}`);
            }
        }
    }
};