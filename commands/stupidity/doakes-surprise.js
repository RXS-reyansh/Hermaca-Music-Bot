const emojis = require('../../emojis.js');

module.exports = {
    name: 'doakes-surprise',
    description: 'Send Doakes surprise emoji with message',
    category: 'utility',
    owner: false,
    userPerms: [],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        await interaction.reply({ content: `${emojis.doakesknows}` });
        await interaction.followUp({ content: "Surprise, motherfucker!", flags: MessageFlags.Ephemeral });
    },
    prefixExecute: async (message, args, client) => {
        await message.delete().catch(() => {});
        let emojiMessage;
        if (message.reference) {
            try {
                const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
                emojiMessage = await repliedMessage.reply(`${emojis.doakesknows}`);
            } catch {
                emojiMessage = await message.channel.send(`${emojis.doakesknows}`);
            }
        } else {
            emojiMessage = await message.channel.send(`${emojis.doakesknows}`);
        }
        setTimeout(async () => {
            await message.channel.send("Surprise, motherfucker!");
        }, 250);
    }
};