const emojis = require('../../emojis.js');

module.exports = {
    name: 'emma-heart',
    description: 'Send Emma heart emoji',
    category: 'utility',
    owner: false,
    userPerms: [],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        await interaction.reply({ content: `${emojis.emmaheart1}`, flags: MessageFlags.Ephemeral });
    },
    prefixExecute: async (message, args, client) => {
        await message.delete().catch(() => {});
        if (message.reference) {
            try {
                const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
                await repliedMessage.reply(`${emojis.emmaheart1}`);
            } catch {
                await message.channel.send(`${emojis.emmaheart1}`);
            }
        } else {
            await message.channel.send(`${emojis.emmaheart1}`);
        }
    }
};