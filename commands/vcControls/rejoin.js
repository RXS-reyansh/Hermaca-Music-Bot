const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'rejoin',
    description: 'Make the bot leave and rejoin the current voice channel',
    category: 'vcControls',
        owner: false,
    userPerms: [],
    botPerms: ['Connect', 'Speak'],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) {
            const prefix = client.getGuildPrefix(interaction.guild.id);
            return messages.error(interaction, `The bot is in no voice channel from before. Use \`${prefix}join\` instead!`);
        }

        const oldVoiceChannelId = player.voiceChannel;
        const voiceChannel = interaction.guild.channels.cache.get(oldVoiceChannelId);
        if (!voiceChannel || voiceChannel.type !== 2) {
            return messages.error(interaction, "The previous voice channel no longer exists or is invalid!");
        }

        const permissions = voiceChannel.permissionsFor(interaction.guild.members.me);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            return messages.error(interaction, `I don't have permission to join/speak in ${voiceChannel.toString()}.`);
        }

        await client.clearVoiceChannelStatus(oldVoiceChannelId);
        player.destroy();
        await new Promise(resolve => setTimeout(resolve, 500));

        const newPlayer = client.riffy.createConnection({
            guildId: interaction.guild.id,
            voiceChannel: voiceChannel.id,
            textChannel: interaction.channel.id,
            deaf: true,
        });
        const savedVolume = client.guildVolumes.get(interaction.guild.id);
        if (savedVolume !== undefined) newPlayer.setVolume(savedVolume);

        await client.setVoiceChannelStatus(voiceChannel.id, `${emojis.greensparkles || '✨'} | Idle.`);
        const twentyFourSevenData = await client.load24SevenData();
        if (!twentyFourSevenData[interaction.guild.id]?.enabled) {
            client.startInactivityTimer(interaction.guild.id, interaction.channel.id);
        }

        await messages.success(interaction, `Rejoined ${voiceChannel.toString()}!`);
    },
    prefixExecute: async (message, args, client) => {
        const player = client.riffy.players.get(message.guild.id);
        if (!player) {
            const prefix = client.getGuildPrefix(message.guild.id);
            return messages.error(message, `The bot is in no voice channel from before. Use \`${prefix}join\` instead!`);
        }

        const oldVoiceChannelId = player.voiceChannel;
        const voiceChannel = message.guild.channels.cache.get(oldVoiceChannelId);
        if (!voiceChannel || voiceChannel.type !== 2) {
            return messages.error(message, "The previous voice channel no longer exists or is invalid!");
        }

        const permissions = voiceChannel.permissionsFor(message.guild.members.me);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            return messages.error(message, `I don't have permission to join/speak in ${voiceChannel.toString()}.`);
        }

        await client.clearVoiceChannelStatus(oldVoiceChannelId);
        player.destroy();
        await new Promise(resolve => setTimeout(resolve, 500));

        const newPlayer = client.riffy.createConnection({
            guildId: message.guild.id,
            voiceChannel: voiceChannel.id,
            textChannel: message.channel.id,
            deaf: true,
        });
        const savedVolume = client.guildVolumes.get(message.guild.id);
        if (savedVolume !== undefined) newPlayer.setVolume(savedVolume);

        await client.setVoiceChannelStatus(voiceChannel.id, `${emojis.greensparkles || '✨'} | Idle.`);
        const twentyFourSevenData = await client.load24SevenData();
        if (!twentyFourSevenData[message.guild.id]?.enabled) {
            client.startInactivityTimer(message.guild.id, message.channel.id);
        }

        await messages.success(message, `Rejoined ${voiceChannel.toString()}!`);
    }
};
