const emojis = require('../../emojis.js');

function startInactivityTimer(guildId, textChannelId) {
    if (this.inactivityTimers.has(guildId)) {
        clearTimeout(this.inactivityTimers.get(guildId));
    }

    const timer = setTimeout(async () => {
        const player = this.riffy.players.get(guildId);
        if (!player) {
            this.inactivityTimers.delete(guildId);
            return;
        }
        if (!player.current && player.queue.length === 0) {
            const channel = this.channels.cache.get(textChannelId || player.textChannel);
            if (channel) {
                await channel.send(`${emojis.info} Left the voice channel due to inactivity. Enable 24/7 mode if you don't want this.`);
            }
            await this.clearVoiceChannelStatus(player.voiceChannel);
            player.destroy();
        }
        this.inactivityTimers.delete(guildId);
    }, 5 * 60 * 1000);

    this.inactivityTimers.set(guildId, timer);
}

function cancelInactivityTimer(guildId) {
    if (this.inactivityTimers.has(guildId)) {
        clearTimeout(this.inactivityTimers.get(guildId));
        this.inactivityTimers.delete(guildId);
    }
}

module.exports = { startInactivityTimer, cancelInactivityTimer };