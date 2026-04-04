const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'reveal',
    description: 'Reveal spoiler text in a message (reply to a message)',
    category: 'utility',
    owner: false,
    userPerms: [],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        await messages.info(interaction, "This command only works as a prefix command. Use `~reveal` in reply to a message.");
    },
    prefixExecute: async (message, args, client) => {
        if (!message.reference) {
            return messages.error(message.channel, "Please reply to a spoiler message!");
        }
        try {
            const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
            const content = repliedMessage.content;
            if (!content.includes('||')) {
                return messages.error(message.channel, "The replied message doesn't contain spoiler text!");
            }
            const revealedText = content.replace(/\|\|/g, '');
            await message.channel.send(`📖 **Revealed:** ${revealedText}`);
        } catch (error) {
            await messages.error(message.channel, "Could not fetch the replied message!");
        }
    }
};