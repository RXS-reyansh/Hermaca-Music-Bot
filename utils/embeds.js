const { EmbedBuilder } = require('discord.js');
const emojis = require('../emojis.js');
const config = require('../config.js');
const os = require('os');
const { getDisplayServerCount, getDisplayUserCount, getBuildName } = require('../helpers/botStats.js');

function buildDebugEmbed(client, context, nodes) {
    const clientId = client.user.id;
    const actualGuilds = client.guilds.cache.size;
    const actualUsers = client.users.cache.size;
    const displayGuilds = getDisplayServerCount(clientId, actualGuilds);
    const displayUsers = getDisplayUserCount(clientId, actualUsers);

    // Uptime
    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptimeString = `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;

    // Active players
    let activePlayers = 0;
    for (const player of client.riffy.players.values()) {
        if (player.playing) activePlayers++;
    }

    // System stats - BOT SPECIFIC
    // RAM: Bot heap memory usage
    const heapUsed = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    let heapTotal = (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(1);
    
    // Ensure minimum total RAM display
    if (parseFloat(heapTotal) < config.minTotalRamMB) {
        heapTotal = config.minTotalRamMB;
    }
    
    const ramPercent = ((heapUsed / heapTotal) * 100).toFixed(1);

    // CPU usage for the process
    let cpuPercent = 'N/A';
    try {
        // Initialize CPU baseline if not exists
        if (!client._cpuBaseline) {
            client._cpuBaseline = {
                usage: process.cpuUsage(),
                timestamp: Date.now()
            };
            // First call will generate fallback
            cpuPercent = (Math.random() * (config.fakeUpperCpuUsage - config.fakeLowerCpuUsage) + config.fakeLowerCpuUsage).toFixed(1);
        } else {
            const currentUsage = process.cpuUsage(client._cpuBaseline.usage);
            const elapsedMs = Date.now() - client._cpuBaseline.timestamp;
            
            // Total microseconds of CPU time used
            const totalCpuUs = currentUsage.user + currentUsage.system;
            
            // Only calculate if elapsed time is meaningful
            if (elapsedMs > 100 && totalCpuUs > 0) {
                // Convert to milliseconds
                const totalCpuMs = totalCpuUs / 1000;
                
                // Calculate percentage: (ms used / ms elapsed) * 100
                let calculated = (totalCpuMs / elapsedMs) * 100;
                
                // Validate the calculated value
                if (isNaN(calculated) || calculated < 0 || calculated > 400) {
                    // Out of range or invalid, use fallback
                    cpuPercent = (Math.random() * (config.fakeUpperCpuUsage - config.fakeLowerCpuUsage) + config.fakeLowerCpuUsage).toFixed(1);
                } else {
                    // Valid value, use it
                    cpuPercent = calculated.toFixed(1);
                }
            } else {
                // Not enough elapsed time, use fallback
                cpuPercent = (Math.random() * (config.fakeUpperCpuUsage - config.fakeLowerCpuUsage) + config.fakeLowerCpuUsage).toFixed(1);
            }
            
            // Reset baseline every 5 seconds
            if (elapsedMs > 5000) {
                client._cpuBaseline = {
                    usage: process.cpuUsage(),
                    timestamp: Date.now()
                };
            }
        }
    } catch(e) { 
        // On error, use fallback
        cpuPercent = (Math.random() * (config.fakeUpperCpuUsage - config.fakeLowerCpuUsage) + config.fakeLowerCpuUsage).toFixed(1);
    }

    // Threads (active handles)
    let threadCount = 'N/A';
    try {
        if (process._getActiveHandles) {
            threadCount = process._getActiveHandles().length;
        }
    } catch(e) {}

    // Architecture
    const buildName = getBuildName(clientId);
    const discordJsVersion = require('discord.js').version;

    // Lavalink section – exact format requested
    let lavalinkText = '';
    const riffyPackage = require('../package.json');
    const riffyVersion = riffyPackage.dependencies?.riffy?.replace(/[\^~=]/g, '') || 'unknown';
    
    // Get nodes list (either from parameter or from client.riffy)
    let nodeList = nodes;
    if (!nodeList || nodeList.length === 0) {
        nodeList = Array.from(client.riffy.nodes.values());
    }
    
    if (nodeList && nodeList.length > 0) {
        for (const node of nodeList) {
            lavalinkText += `**Node:** ${node.name}\n`;
            
            // Node version – always show, from config if available, else from node object
            let nodeVersion = node.version || 'Unknown';
            if (nodeVersion === 'Unknown' && config.nodes) {
                const configNode = config.nodes.find(n => n.name === node.name);
                if (configNode && configNode.version) nodeVersion = configNode.version;
            }
            lavalinkText += `**Node version:** ${nodeVersion}\n`;
        }
    } else {
        lavalinkText = `${emojis.error} No Lavalink nodes connected\n`;
    }
    lavalinkText += `**Client:** Riffy v${riffyVersion}`;

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`${emojis.blackcross} Stats of ${client.user.displayName}`)
        .setThumbnail("https://i.ibb.co/NdjhZLMH/hermaca-gif-pfp.gif")
        .setTimestamp();

    // General
    embed.addFields({
        name: `${emojis.blackbutterfly1} General`,
        value: [
            `**Servers:** ${displayGuilds.toLocaleString()}`,
            `**Users:** ${displayUsers.toLocaleString()}`,
            `**Uptime:** ${uptimeString}`,
            `**Active Players:** ${activePlayers}`
        ].join('\n'),
        inline: false
    });

    // System
    embed.addFields({
        name: `${emojis.blackbutterfly1} System`,
        value: [
            `**RAM:** ${heapUsed} MB / ${heapTotal} MB (${ramPercent}%)`,
            `**CPU:** ${cpuPercent}%`,
            `**Threads:** ${threadCount}`
        ].join('\n'),
        inline: false
    });

    // Architecture – only Build, Discord.js, Node.js
    embed.addFields({
        name: `${emojis.blackbutterfly1} Architecture`,
        value: [
            `**Build:** ${buildName}`,
            `**Discord.js:** v${discordJsVersion}`,
            `**Node.js:** ${process.version}`
        ].join('\n'),
        inline: false
    });

    // Lavalink – formatted exactly as requested
    embed.addFields({
        name: `${emojis.blackbutterfly1} Lavalink`,
        value: lavalinkText,
        inline: false
    });

    return embed;
}

async function sendLyricsEmbeds(context, isInteraction, loadingMsg, lyrics, source, trackArtist, trackTitle, requester) {
    const MAX_LENGTH = 3150;
    const lines = lyrics.split('\n');
    const chunks = [];
    let currentChunk = [];
    let currentLength = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineLength = line.length + 1;
        if (currentLength + lineLength > MAX_LENGTH && currentChunk.length > 0) {
            chunks.push(currentChunk.join('\n'));
            currentChunk = [line];
            currentLength = lineLength;
            continue;
        }
        currentChunk.push(line);
        currentLength += lineLength;
    }
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n'));
    }

    const embedBase = new EmbedBuilder().setColor(config.embedColor);
    const footerText = `Lyrics powered by ${source} • Requested by ${requester.tag}`;
    const footerIcon = 'https://i.ibb.co/GfHpz0fQ/image.gif';

    for (let i = 0; i < chunks.length; i++) {
        const isLast = (i === chunks.length - 1);
        const embed = EmbedBuilder.from(embedBase);
        if (i === 0) {
            embed.setTitle(`${emojis.blacksparkles} Lyrics of **${trackArtist} - ${trackTitle}**`);
        }
        embed.setDescription(chunks[i]);
        if (isLast) {
            embed.setFooter({ text: footerText, iconURL: footerIcon });
        }

        if (isInteraction) {
            if (i === 0) {
                await context.editReply({ content: null, embeds: [embed] });
            } else {
                await context.followUp({ embeds: [embed] });
            }
        } else {
            if (i === 0 && loadingMsg) {
                await loadingMsg.delete().catch(() => {});
            }
            await context.channel.send({ embeds: [embed] });
        }
    }
}

module.exports = { sendLyricsEmbeds, buildDebugEmbed };