const { REST, Routes } = require('discord.js');
const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');
const config = require('../../config.js');
const { aliases } = require('../music/play.js');
const ownerId = require('../../config.js').ownerId;
const { MessageFlags } = require('discord.js');

module.exports = {
    name: 'setavatar',
    aliases: ['setav', 'setpfp'],
    description: "Change the bot's server avatar",
    category: 'customisation',
    owner: false,
    userPerms: ['Administrator'],
    botPerms: ['ChangeNickname'], // Actually avatar change requires ManageNicknames? No, it's a separate endpoint. Bot only needs to be able to change its own avatar (always true).
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const image = interaction.options.getAttachment('image');
        if (!image) {
            return messages.error(interaction, "Please attach an image.");
        }
        await messages.loading(interaction, "Setting server avatar...");
        try {
            const base64 = await client.imageUrlToBase64(image.url);
            const rest = new REST({ version: '10' }).setToken(config.botToken);
            await rest.patch(Routes.guildMember(interaction.guild.id, '@me'), {
                body: { avatar: base64 }
            });
            await messages.success(interaction, "Server avatar updated.");
        } catch (error) {
            console.error(`Setavatar slash error: ${error.message}`);
            await messages.error(interaction, `Failed: ${error.message}`);
        }
    },
    prefixExecute: async (message, args, client) => {
        const isOwner = message.author.id === ownerId;
        if (!isOwner && !message.member.permissions.has('Administrator')) {
            return messages.error(message, "You need `Administrator` permission.");
        }
        if (args[0] && args[0].toLowerCase() === 'reset') {
            const loadingMsg = await message.channel.send(`${emojis.loading} | Resetting server avatar...`);
            try {
                const rest = new REST({ version: '10' }).setToken(config.botToken);
                await rest.patch(Routes.guildMember(message.guild.id, '@me'), { body: { avatar: null } });
                await message.channel.send(`${emojis.success} | Server avatar reset to global avatar!`);
                setTimeout(() => loadingMsg.delete().catch(() => {}), 3000);
            } catch (error) {
                console.error(`Reset avatar error: ${error.message}`);
                await loadingMsg.delete().catch(() => {});
                await message.channel.send(`${emojis.error} | Failed to reset avatar: ${error.message}`);
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

        const loadingMsg = await message.channel.send(`${emojis.loading} | Setting new server avatar...`);
        try {
            const base64 = await client.imageUrlToBase64(imageUrl);
            const rest = new REST({ version: '10' }).setToken(config.botToken);
            await rest.patch(Routes.guildMember(message.guild.id, '@me'), { body: { avatar: base64 } });
            await message.channel.send(`${emojis.success} | Server avatar updated successfully!`);
            setTimeout(() => loadingMsg.delete().catch(() => {}), 3000);
        } catch (error) {
            console.error(`Setavatar error: ${error.message}`);
            await loadingMsg.delete().catch(() => {});
            await message.channel.send(`${emojis.error} | Failed to update avatar: ${error.message}`);
        }
    }
};