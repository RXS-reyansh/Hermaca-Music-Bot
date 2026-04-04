const emojis = require('../../emojis.js');

module.exports = {
    name: 'emma-rawr',
    description: 'Send Emma rawr emoji',
    category: 'utility',
    owner: false,
    userPerms: [],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        await interaction.reply({ content: `${emojis.emmarawr}`, flags: MessageFlags.Ephemeral });
    },
    prefixExecute: async (message, args, client) => {
        await message.delete().catch(() => {});
        if (message.reference) {
            try {
                const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
                await repliedMessage.reply(`${emojis.emmarawr}`);
            } catch {
                await message.channel.send(`${emojis.emmarawr}`);
            }
        } else {
            await message.channel.send(`${emojis.emmarawr}`);
        }
    }
};