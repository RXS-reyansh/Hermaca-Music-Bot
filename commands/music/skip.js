const emojis = require('../../emojis.js');

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

async function handleSkip(context, isInteraction = false) {
    const guild = isInteraction ? context.guild : context.guild;
    const player = context.client.riffy.players.get(guild.id);

    if (!player) {
        return await sendResponse(context, `${emojis.error} | Nothing is playing!`, isInteraction);
    }
    if (!player.queue.length) {
        return await sendResponse(context, `${emojis.error} | No more tracks in queue to skip to!`, isInteraction);
    }

    player.stop();
    await sendResponse(context, `${emojis.success} | Skipped the current track!`, isInteraction);
}

module.exports = {
    name: 'skip',
    description: 'Skip the current track',
    category: 'music',
    owner: false,
    userPerms: [],
    botPerms: ['Connect', 'Speak'],
    player: true,
    inVoiceChannel: true,
    sameVoiceChannel: true,
    execute: async (interaction, client) => {
        await handleSkip(interaction, true);
    },
    prefixExecute: async (message, args, client) => {
        await handleSkip(message, false);
    }
};