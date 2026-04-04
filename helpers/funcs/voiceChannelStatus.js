const config = require('../../config.js');
const emojis = require('../../emojis.js');

async function setVoiceChannelStatus(channelId, status) {
    if (!channelId) return;
    const token = process.env.DISCORD_TOKEN || config.botToken;
    try {
        const response = await fetch(`https://discord.com/api/v9/channels/${channelId}/voice-status`, {
            headers: {
                "Authorization": `Bot ${token}`,
                "Content-Type": "application/json"
            },
            method: "PUT",
            body: JSON.stringify({ status: status || null })
        });
        if (!response.ok) {
            const { log } = require('../../utils/logger.js');
            log('ERROR', `❌ Failed to set voice status in ${channelId}: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        const { log } = require('../../utils/logger.js');
        log('ERROR', `❌ Error setting voice status: ${error.message}`);
    }
}

async function clearVoiceChannelStatus(channelId) {
    await this.setVoiceChannelStatus(channelId, null);
}

async function updatePlayerVoiceStatus(player) {
    if (!player || !player.voiceChannel) return;

    const guildId = player.guildId;
    const channelId = player.voiceChannel;

    const twentyFourSevenData = await this.load24SevenData();
    const guild24Seven = twentyFourSevenData[guildId]?.enabled === true;

    const track = player.current || player.queue.current;
    if (track) {
        const status = `${emojis.cutemusic} | ${track.info.title} - ${track.info.author}`;
        const truncated = status.length > 500 ? status.slice(0, 497) + '...' : status;
        await this.setVoiceChannelStatus(channelId, truncated);
    } else {
        if (guild24Seven) {
            await this.setVoiceChannelStatus(channelId, `${emojis.blade} | 24/7 enabled!`);
        } else {
            await this.setVoiceChannelStatus(channelId, `${emojis.greensparkles || '✨'} | Idle.`);
        }
    }
}

module.exports = { setVoiceChannelStatus, clearVoiceChannelStatus, updatePlayerVoiceStatus };