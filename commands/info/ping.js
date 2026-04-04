const { EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis.js');
const config = require('../../config.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'ping',
    description: 'Show the bot\'s ping',
    category: 'info',
    owner: false,
    userPerms: [],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const wsLatency = Math.round(client.actualWsPing || client.ws.ping || 0);
        const clusterId = client.clusterId || "45";
        let shardId = 667;
        if (client.shard) {
            try { shardId = client.shard.ids[0] || 0; } catch {}
        }
        const restLatency = Date.now() - interaction.createdTimestamp;
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.redblackcross} Cluster ${clusterId}`)
            .addFields({
                name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                value: `• Discord REST latency: \`${restLatency}ms\`\n• Discord Gateway (WS) latency: \`${wsLatency}ms\` (Shard ${shardId})`,
                inline: false
            })
            .setFooter({ text: `Database on MongoDB • Powered by ${client.hostingService || 'Unknown'}` })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
    prefixExecute: async (message, args, client) => {
        await messages.ping(message.channel, client, message, client.hostingService);
    }
};