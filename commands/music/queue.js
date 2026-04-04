const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

async function sendResponse(context, content, isInteraction = false) {
    if (isInteraction) {
        return await context.editReply(
            typeof content === 'string' ? { content } : content
        );
    } else {
        if (typeof content === 'string') {
            return await context.channel.send(content);
        } else {
            return await context.channel.send(content);
        }
    }
}

async function handleQueue(context, isInteraction = false) {
    const guild = isInteraction ? context.guild : context.guild;
    const user = isInteraction ? context.user : context.author;
    const player = context.client.riffy.players.get(guild.id);

    if (!player) {
        return await sendResponse(context, `${emojis.error} | Nothing is playing!`, isInteraction);
    }

    const queue = player.queue;
    await messages.queueList(context, queue, player.current, user.id);
}

module.exports = {
    name: 'queue',
    aliases: ['q'],
    description: 'Show the current queue',
    category: 'music',
    owner: false,
    userPerms: [],
    botPerms: [],
    player: true,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        await handleQueue(interaction, true);
    },
    prefixExecute: async (message, args, client) => {
        await handleQueue(message, false);
    }
};