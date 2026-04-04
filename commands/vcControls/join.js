const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'join',
    description: 'Make the bot join a voice channel',
    category: 'vcControls',
        owner: false,
    userPerms: [],
    botPerms: ['Connect', 'Speak'],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const channelArg = interaction.options.getChannel('channel');
        const member = interaction.member;
        const guild = interaction.guild;
        let targetChannel = null;

        if (channelArg) {
            targetChannel = channelArg;
        } else {
            if (member.voice.channel) {
                targetChannel = member.voice.channel;
            } else {
                targetChannel = guild.channels.cache.find(c => c.type === 2);
            }
        }

        if (!targetChannel) {
            return messages.error(interaction, "No voice channel found to join.");
        }

        const permissions = targetChannel.permissionsFor(guild.members.me);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            return messages.error(interaction, `I don't have permission to join/speak in ${targetChannel.toString()}.`);
        }

        let player = client.riffy.players.get(guild.id);
        if (player) {
            if (player.voiceChannel !== targetChannel.id) player.setVoiceChannel(targetChannel.id);
            player.setTextChannel(interaction.channel.id);
        } else {
            player = client.riffy.createConnection({
                guildId: guild.id,
                voiceChannel: targetChannel.id,
                textChannel: interaction.channel.id,
                deaf: true,
            });
        }

        const savedVolume = client.guildVolumes.get(guild.id);
        if (savedVolume !== undefined) player.setVolume(savedVolume);

        await client.setVoiceChannelStatus(targetChannel.id, `${emojis.greensparkles || '✨'} | Idle.`);
        client.cancelInactivityTimer(guild.id);
        const twentyFourSevenData = await client.load24SevenData();
        if (!twentyFourSevenData[guild.id]?.enabled) {
            client.startInactivityTimer(guild.id, interaction.channel.id);
        }

        await messages.success(interaction, `Joined ${targetChannel.toString()}!`);
    },
    prefixExecute: async (message, args, client) => {
        const channelArg = args.join(' ');
        let targetChannel = null;
        const member = message.member;
        const guild = message.guild;

        if (channelArg) {
            const channelId = channelArg.replace(/[<#>]/g, '');
            targetChannel = guild.channels.cache.get(channelId);
            if (!targetChannel) {
                targetChannel = guild.channels.cache.find(c => c.type === 2 && c.name.toLowerCase() === channelArg.toLowerCase());
            }
        } else {
            if (member.voice.channel) {
                targetChannel = member.voice.channel;
            } else {
                targetChannel = guild.channels.cache.find(c => c.type === 2);
            }
        }

        if (!targetChannel) {
            return messages.error(message, "No voice channel found to join.");
        }

        const permissions = targetChannel.permissionsFor(guild.members.me);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            return messages.error(message, `I don't have permission to join/speak in ${targetChannel.toString()}.`);
        }

        let player = client.riffy.players.get(guild.id);
        if (player) {
            if (player.voiceChannel !== targetChannel.id) player.setVoiceChannel(targetChannel.id);
            player.setTextChannel(message.channel.id);
        } else {
            player = client.riffy.createConnection({
                guildId: guild.id,
                voiceChannel: targetChannel.id,
                textChannel: message.channel.id,
                deaf: true,
            });
        }

        const savedVolume = client.guildVolumes.get(guild.id);
        if (savedVolume !== undefined) player.setVolume(savedVolume);

        await client.setVoiceChannelStatus(targetChannel.id, `${emojis.greensparkles || '✨'} | Idle.`);
        client.cancelInactivityTimer(guild.id);
        const twentyFourSevenData = await client.load24SevenData();
        if (!twentyFourSevenData[guild.id]?.enabled) {
            client.startInactivityTimer(guild.id, message.channel.id);
        }

        await messages.success(message, `Joined ${targetChannel.toString()}!`);
    }
};
