const db = require('../../database/database.js');
const emojis = require('../../emojis.js');

async function load24SevenData() {
    return await db.load24SevenData();
}

async function enable24Seven(guildId, channelId, textChannel) {
    const guild = this.guilds.cache.get(guildId);
    if (!guild) {
        return { success: false, message: "Guild not found" };
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel || channel.type !== 2) {
        return { success: false, message: "Voice channel not found" };
    }

    const textChannelId = textChannel?.id || channel.id;

    if (this.riffy.nodes.size === 0) {
        return { success: false, message: "Music nodes are not ready yet. Please try again in a few moments." };
    }

    try {
        const player = this.riffy.createConnection({
            guildId: guild.id,
            voiceChannel: channel.id,
            textChannel: textChannelId,
            deaf: true,
        });
        player.setVolume(10);
        await this.updatePlayerVoiceStatus(player);
    } catch (error) {
        return { success: false, message: `Failed to join channel: ${error.message}` };
    }

    const result = await db.enable24Seven(guildId, channelId, textChannelId);
    if (result.success) {
        return { success: true, message: `24/7 enabled. Channel set to <#${channelId}>` };
    } else {
        return result;
    }
}

async function disable24Seven(guildId) {
    const player = this.riffy.players.get(guildId);
    if (player) {
        await this.clearVoiceChannelStatus(player.voiceChannel);
        player.destroy();
    }
    const result = await db.disable24Seven(guildId);
    return result;
}

module.exports = { load24SevenData, enable24Seven, disable24Seven };