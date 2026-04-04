const { REST, Routes } = require('discord.js');
const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');
const config = require('../../config.js');
const { aliases } = require('./setavatar.js');
const ownerId = require('../../config.js').ownerId;

module.exports = {
    name: 'setbanner',
    aliases: ['setbn'],
    description: "Change the bot's server banner",
    category: 'customisation',
    owner: false,
    userPerms: ['Administrator'],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const image = interaction.options.getAttachment('image');
        if (!image) {
            return messages.error(interaction, "Please attach an image.");
        }
        await messages.loading(interaction, "Setting server banner...");
        try {
            const base64 = await client.imageUrlToBase64(image.url);
            const rest = new REST({ version: '10' }).setToken(config.botToken);
            await rest.patch(Routes.guildMember(interaction.guild.id, '@me'), {
                body: { banner: base64 }
            });
            await messages.success(interaction, "Server banner updated.");
        } catch (error) {
            console.error(`Setbanner slash error: ${error.message}`);
            await messages.error(interaction, `Failed: ${error.message}`);
        }
    },
    prefixExecute: async (message, args, client) => {
        const isOwner = message.author.id === ownerId;
        if (!isOwner && !message.member.permissions.has('Administrator')) {
            return messages.error(message, "You need `Administrator` permission.");
        }
        if (args[0] && args[0].toLowerCase() === 'reset') {
            const loadingMsg = await message.channel.send(`${emojis.loading} | Resetting server banner...`);
            try {
                const rest = new REST({ version: '10' }).setToken(config.botToken);
                await rest.patch(Routes.guildMember(message.guild.id, '@me'), { body: { banner: null } });
                await message.channel.send(`${emojis.success} | Server banner reset to global banner!`);
                setTimeout(() => loadingMsg.delete().catch(() => {}), 3000);
            } catch (error) {
                console.error(`Reset banner error: ${error.message}`);
                await loadingMsg.delete().catch(() => {});
                await message.channel.send(`${emojis.error} | Failed to reset banner: ${error.message}`);
            }
            return;
        }

        let imageUrl = null;
        if (message.attachments.size) {
            imageUrl = message.attachments.first().url;
        } else if (args.length) {
            const url = args[0];
            if (url.match(/^https?:\/\/.+\/.*\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i)) {
                imageUrl = url;
            }
        }

        if (!imageUrl) {
            return messages.error(message, "Please attach an image or provide a direct image URL.");
        }

        const loadingMsg = await message.channel.send(`${emojis.loading} | Setting new server banner...`);
        try {
            const base64 = await client.imageUrlToBase64(imageUrl);
            const rest = new REST({ version: '10' }).setToken(config.botToken);
            await rest.patch(Routes.guildMember(message.guild.id, '@me'), { body: { banner: base64 } });
            await message.channel.send(`${emojis.success} | Server banner updated successfully!`);
            setTimeout(() => loadingMsg.delete().catch(() => {}), 3000);
        } catch (error) {
            console.error(`Setbanner error: ${error.message}`);
            await loadingMsg.delete().catch(() => {});
            await message.channel.send(`${emojis.error} | Failed to update banner: ${error.message}`);
        }
    }
};