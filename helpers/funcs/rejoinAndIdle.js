const emojis = require('../../emojis.js');

async function rejoinAndIdle(guildId, textChannelId) {
    const player = this.riffy.players.get(guildId);
    if (!player) return null;

    const voiceChannelId = player.voiceChannel;
    const guild = this.guilds.cache.get(guildId);
    if (!guild) return null;

    const voiceChannel = guild.channels.cache.get(voiceChannelId);
    if (!voiceChannel || voiceChannel.type !== 2) return null;
    const textChannel = textChannelId || player.textChannel;

    await this.clearVoiceChannelStatus(voiceChannelId);
    this.cancelInactivityTimer(guildId);
    player.destroy();
    await new Promise(resolve => setTimeout(resolve, 800));

    const newPlayer = this.riffy.createConnection({
        guildId: guildId,
        voiceChannel: voiceChannel.id,
        textChannel: textChannel,
        deaf: true,
    });
    const savedVolume = this.guildVolumes.get(guildId);
    if (savedVolume !== undefined) {
        newPlayer.setVolume(savedVolume);
    }

    const twentyFourSevenData = await this.load24SevenData();
    const guild24Seven = twentyFourSevenData[guildId]?.enabled === true;

    if (guild24Seven) {
        await this.setVoiceChannelStatus(voiceChannel.id, `${emojis.blade} | 24/7 enabled!`);
    } else {
        await this.setVoiceChannelStatus(voiceChannel.id, `${emojis.greensparkles || '✨'} | Idle.`);
        this.startInactivityTimer(guildId, textChannel);
    }

    return newPlayer;
}

module.exports = { rejoinAndIdle };