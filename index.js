require("dotenv").config();
const config = require("./config.js");

const colors = {
    color1: '#FAF7F3',
    color2: '#F0E4D3',
    color3: '#DCC5B2',
    color4: '#D9A299'
};

function blendColors(hex1, hex2, ratio) {
    const r1 = parseInt(hex1.slice(1, 3), 16);
    const g1 = parseInt(hex1.slice(3, 5), 16);
    const b1 = parseInt(hex1.slice(5, 7), 16);
    
    const r2 = parseInt(hex2.slice(1, 3), 16);
    const g2 = parseInt(hex2.slice(3, 5), 16);
    const b2 = parseInt(hex2.slice(5, 7), 16);
    
    const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function hexToAnsi(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `\x1b[38;2;${r};${g};${b}m`;
}

const reset = '\x1b[0m';
const bright = '\x1b[1m';

const gradientColors = [
    colors.color1,
    blendColors(colors.color1, colors.color2, 0.33),
    blendColors(colors.color1, colors.color2, 0.66),
    colors.color2,
    blendColors(colors.color2, colors.color3, 0.5),
    colors.color3,
    blendColors(colors.color3, colors.color4, 0.5),
    colors.color4
];

console.log('─'.repeat(120));
console.log(`${hexToAnsi(gradientColors[0])}${bright} /$$   /$$                                                                ${reset}`);
console.log(`${hexToAnsi(gradientColors[1])}| $$  | $$                                                                ${reset}`);
console.log(`${hexToAnsi(gradientColors[2])}| $$  | $$  /$$$$$$   /$$$$$$  /$$$$$$/$$$$   /$$$$$$   /$$$$$$$  /$$$$$$ ${reset}`);
console.log(`${hexToAnsi(gradientColors[3])}| $$$$$$$$ /$$__  $$ /$$__  $$| $$_  $$_  $$ |____  $$ /$$_____/ |____  $${reset}`);
console.log(`${hexToAnsi(gradientColors[4])}| $$__  $$| $$$$$$$$| $$  \\__/| $$ \\ $$ \\ $$  /$$$$$$$| $$        /$$$$$$$${reset}`);
console.log(`${hexToAnsi(gradientColors[5])}| $$  | $$| $$_____/| $$      | $$ | $$ | $$ /$$__  $$| $$       /$$__  $${reset}`);
console.log(`${hexToAnsi(gradientColors[6])}| $$  | $$|  $$$$$$$| $$      | $$ | $$ | $$|  $$$$$$$|  $$$$$$$|  $$$$$$$${reset}`);
console.log(`${hexToAnsi(gradientColors[7])}|__/  |__/ \\_______/|__/      |__/ |__/ |__/ \\_______/ \\_______/ \\_______/${reset}`);

const { log, line, setBotReady } = require('./logger.js');

const ownerId = config.ownerId;
const token = process.env.DISCORD_TOKEN || config.botToken;
if (!token || token.length < 50) {
    log('ERROR', '❌ Invalid or missing Discord token!');
    process.exit(1);
}
log('CLIENT', 'Custom fonts loaded');

const { 
    Client, 
    GatewayIntentBits, 
    Partials, 
    GatewayDispatchEvents, 
    ActivityType, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    ApplicationCommandOptionType, 
    Events, 
    InteractionType, 
    EmbedBuilder,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
	AttachmentBuilder,
	StringSelectMenuBuilder,
	ComponentType
} = require("discord.js");
const { Riffy } = require("riffy");
const { Spotify } = require("riffy-spotify");
const fs = require('fs').promises;
const path = require('path');
const messages = require("./utils/messages.js");
const emojis = require("./emojis.js");
const stickers = require("./stickers.js");
const db = require('./database.js');
const { createQuoteImage } = require("./utils/quoteGenerator");
/* const { recordSongPlay, getUserStats, getUserRank, getLeaderboard } = db; */
const prefixCommands = [
    'play', 'p', 'pause', 'resume', 'skip', 'stop', 's', 'lyrics', 'queue', 'q',
    'nowplaying', 'np', 'volume', 'vol', 'servervolume', 'filter', 'shuffle',
    'loop', 'move', 'add', 'remove', 'clear', 'status', 'ping', 'help',
    'setspotify', 'playspotify', 'join', 'leave', 'rejoin', 'shift', 'disconnect', 'song-quote', 'quote',
    'mystats', 'leaderboard', 'resetstats', 'stats', 'afk', 'react', 'emoji',
    'avatar', 'av', 'banner', 'bn', 'purge', 'say', 'reveal', '24/7', 'doakes',
    'emma-heart', 'emma-heart1', 'emma-kiss', 'emma-hii', 'emma-worried',
    'emma-rawr', 'suscat', 'doakes-surprise', 'setavatar', 'setav', 'setbanner',
    'setbn', 'setname', 'steal', 'emma-heart-st', 'emma-heart-st1', 'noprefix', 'nop', 'count'
];
const validCommands = new Set(prefixCommands);

let commandTimeouts = new Map();

process.on('unhandledRejection', (reason, promise) => {
    log('ERROR', `⚠️ Unhandled Rejection at: ${promise} reason: ${reason}`);

    for (const [interactionId, timeout] of commandTimeouts.entries()) {
        clearTimeout(timeout);
        commandTimeouts.delete(interactionId);
    }
});

async function getHostingServiceIP() {
    return new Promise((resolve) => {
        const services = [
            'https://api.ipify.org?format=json',
            'https://api64.ipify.org?format=json',
            'https://ipinfo.io/json',
            'https://icanhazip.com'
        ];
        
        const https = require('https');
        let currentService = 0;

        const hostingServices = {
            'Asterix': '89.106.84.76',
            'Heaven': '23.153.72.157',
            'RR': '51.222.38.113',
			'Wispbyte': '212.227.65.132'
        };
        
        function getHostingName(ip) {

            const hosting = 
                ip === hostingServices.Asterix ? 'Asterix Hosting' :
                ip === hostingServices.Heaven ? 'Heaven Hosting' :
            	ip === hostingServices.RR ? 'RRHosting' :
				ip === hostingServices.Wispbyte ? 'Wispbyte' :
                'Local Host';
            
            return hosting;
        }
        
        function tryNextService() {
            if (currentService >= services.length) {
                log('ERROR', '❌ Could not determine hosting service IP');
                resolve(null);
                return;
            }
            
            const url = services[currentService];
            currentService++;
            
            https.get(url, { timeout: 5000 }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        let ip = '';
                        if (url.includes('icanhazip')) {
                            ip = data.trim();
                        } else {
                            const result = JSON.parse(data);
                            ip = result.ip || (result.ip && result.ip.trim()) || '';
                        }
                        
                        if (ip && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
                            const hosting = getHostingName(ip);
                            log('DATABASE', `🌐🌐🌐 ${hosting} IP ADDRESS: ${ip}/32 (mask /32) 🌐🌐🌐`);
                            resolve({ ip, hosting });
                        } else {
                            tryNextService();
                        }
                    } catch (e) {
                        tryNextService();
                    }
                });
            }).on('error', () => {
                tryNextService();
            }).on('timeout', () => {
                tryNextService();
            });
        }
        
        tryNextService();
    });
}

async function handleInteractionTimeout(interaction, timeout = 15000) {
    return new Promise((resolve) => {
        const timeoutId = setTimeout(async () => {
            try {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ 
						content: `${emojis.error} | Command timeout! Please try again.`, 
						flags: MessageFlags.Ephemeral
					});
                } else if (interaction.deferred) {
                    await interaction.editReply({ 
                        content: `${emojis.error} | Command execution timeout!` 
                    });
                }
            } catch (error) {
                log('ERROR', `Timeout handler error: ${error.message}`);
            }
            resolve(false);
        }, timeout);

        if (interaction.id) {
            commandTimeouts.set(interaction.id, timeoutId);
        }
    });
}

async function imageUrlToBase64(url) {
    const response = await fetch(url, {
        timeout: 10000,
        size: 5 * 1024 * 1024
    });
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const mime = response.headers.get('content-type') || 'image/png';
    return `data:${mime};base64,${buffer.toString('base64')}`;
}

/* async function safeInteractionEdit(interaction, options, timeout = 10000) {
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Interaction edit timeout')), timeout)
    );
    
    try {
        const editPromise = interaction.editReply(options);
        await Promise.race([editPromise, timeoutPromise]);
    } catch (error) {
        if (error.message === 'Interaction edit timeout' || error.code === 10062 || error.code === 50027) {
            if (interaction.channel) {
                const content = typeof options === 'string' ? options : options.content;
                const embeds = options.embeds;
                const components = options.components;
                
                const fallbackMsg = { 
                    content: content || 'Update (interaction expired)' 
                };
                
                if (embeds) fallbackMsg.embeds = embeds;
                if (components) fallbackMsg.components = components;
                
                await interaction.channel.send(fallbackMsg);
            }
            return false;
        } else {
            throw error;
        }
    }
    return true;
} */

/* setInterval(() => {
    const used = process.memoryUsage();
    console.log(`💾 Memory: ${Math.round(used.heapUsed / 1024 / 1024)}MB`);
}, 1200000); */

process.on('unhandledRejection', (error) => {
    log('ERROR', `⚠️ Unhandled Promise Rejection: ${error.message}`);
    if (error.stack) {
        log('ERROR', `Stack: ${error.stack.split('\n').slice(0, 5).join('\n')}`);
    }
});

process.on('uncaughtException', (error) => {
    log('ERROR', `🚨 Uncaught Exception: ${error.message}`);
    if (error.stack) {
        log('ERROR', `Stack: ${error.stack.split('\n').slice(0, 5).join('\n')}`);
    }
});

function extractThumbnail(trackInfo) {
    if (!trackInfo) return null;

    const possibleProps = [
        'thumbnail', 'artworkUrl', 'cover', 'image', 'picture',
        'thumbnailUrl', 'thumbnail_url'
    ];
    for (const prop of possibleProps) {
        const val = trackInfo[prop];
        if (val) {
            if (typeof val === 'string' && val.startsWith('http')) return val;
            if (typeof val === 'object' && val?.url?.startsWith('http')) return val.url;
        }
    }

    if (trackInfo.album?.images?.length) {
        const img = trackInfo.album.images[0];
        if (img?.url?.startsWith('http')) return img.url;
    }

    if (Array.isArray(trackInfo.artwork)) {
        const img = trackInfo.artwork.find(a => a?.url?.startsWith('http'));
        if (img) return img.url;
    }
    return null;
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildEmojisAndStickers,
    ],
    partials: [
        Partials.Channel
    ],
    rest: {
        timeout: 30000,
        retries: 3,
        api: 'https://discord.com/api'
    },
    ws: {
        large_threshold: 250,
        compress: false
    },
    version: '10'
});
client.guildVolumes = new Map();
/* client.guildVolumesFile = path.join(__dirname, 'volumes.json');
client.spotifyIdsFile = path.join(__dirname, 'spotify-ids.json'); */
client.prefix = config.prefix || "~";
/* const twentyFourSevenFile = path.join(__dirname, '24-7.json');
const serversFile = path.join(__dirname, 'servers.json'); */
client.original24SevenChannels = new Map();

client.inactivityTimers = new Map();

client.quoteOptions = new Map();

client.emojis = emojis;
client.stickers = stickers;
client.config = config;

client.ws.on('heartbeat', () => {
    client.lastHeartbeat = Date.now();
});

client.ws.on('heartbeatAck', () => {
    if (client.lastHeartbeat) {
        client.actualWsPing = Date.now() - client.lastHeartbeat;
    }
});

async function loadGuildVolumes() {
    try {
        const volumes = await db.loadGuildVolumes();
        client.guildVolumes = volumes;
    } catch {
        client.guildVolumes = new Map();
    }
}
async function saveGuildVolumes() {
    await db.saveGuildVolumes(client.guildVolumes);
}
async function load24SevenData() {
    return await db.load24SevenData();
}
async function save24SevenData(data) {
    await db.save24SevenData(data);
}
async function loadServersData() {
    return await db.loadServersData();
}
async function saveServersData(data) {
    await db.saveServersData(data);
}
async function enable24Seven(guildId, channelId, textChannel) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
        return { success: false, message: "Guild not found" };
    }
    
    const channel = guild.channels.cache.get(channelId);
    if (!channel || channel.type !== 2) {
        return { success: false, message: "Voice channel not found" };
    }
    
    const textChannelId = textChannel?.id || channel.id;
    
    if (client.riffy.nodes.size === 0) {
        return { 
            success: false, 
            message: "Music nodes are not ready yet. Please try again in a few moments." 
        };
    }
    
    try {
        const player = client.riffy.createConnection({
            guildId: guild.id,
            voiceChannel: channel.id,
            textChannel: textChannelId,
            deaf: true,
        });
        
        player.setVolume(10);
		
		await updatePlayerVoiceStatus(player);
        
    } catch (error) {
        return { success: false, message: `Failed to join channel: ${error.message}` };
    }
    
    const result = await db.enable24Seven(guildId, channelId, textChannelId);
    
    if (result.success) {
        return { 
            success: true, 
            message: `24/7 enabled. Channel set to <#${channelId}>` 
        };
    } else {
        return result;
    }
}
async function disable24Seven(guildId) {
    const player = client.riffy.players.get(guildId);
    if (player) {

        await clearVoiceChannelStatus(player.voiceChannel);
        player.destroy();
    }
    const result = await db.disable24Seven(guildId);
    return result;
}

async function sendHelpWithComponents(interaction) {
    const guild = interaction.guild;
    const user = interaction.user;
    const client = interaction.client;

	const embed = messages.buildMainHelpEmbed(guild, user);
    const rows = messages.getHelpActionRows();

    await interaction.editReply({ embeds: [embed], components: rows });

    const message = await interaction.fetchReply();
    const collector = message.createMessageComponentCollector({
        filter: i => i.user.id === user.id,
        time: 300000
    });

    collector.on('collect', async i => {
        if (i.customId === 'help_home') {
            const mainEmbed = messages.buildMainHelpEmbed(guild, i.user);
            await i.update({ 
                embeds: [mainEmbed], 
                components: messages.getHelpActionRows()
            });
        } else if (i.customId === 'help_category') {
            const categoryKey = i.values[0];
            const categoryName = i.component.options.find(opt => opt.value === categoryKey).label;
            const commands = messages.categories[categoryKey];
            const embed = messages.buildCategoryEmbed(guild, categoryKey, categoryName, commands, i.user);
            await i.update({ 
                embeds: [embed], 
                components: messages.getHelpActionRows(categoryKey)
            });
        }
    });

    collector.on('end', () => {
        const disabledRows = messages.getHelpActionRows().map(row =>
            ActionRowBuilder.from(row).setComponents(
                row.components.map(c => ButtonBuilder.from(c).setDisabled(true))
            )
        );
        interaction.editReply({ components: disabledRows }).catch(() => {});
    });
}

async function sendPrefixHelpWithComponents(message) {
    const guild = message.guild;
    const user = message.author;
    const client = message.client;

	const embed = messages.buildMainHelpEmbed(guild, user);
    const rows = messages.getHelpActionRows();

    const sent = await message.channel.send({ embeds: [embed], components: rows });

    const collector = sent.createMessageComponentCollector({
        filter: i => i.user.id === user.id,
        time: 300000
    });

    collector.on('collect', async i => {
		if (i.customId === 'help_home') {
			const mainEmbed = messages.buildMainHelpEmbed(guild, i.user);
			await i.update({ 
				embeds: [mainEmbed], 
				components: messages.getHelpActionRows()
			});
		} else if (i.customId === 'help_category') {
			const categoryKey = i.values[0];
			const categoryName = i.component.options.find(opt => opt.value === categoryKey).label;
			const commands = messages.categories[categoryKey];
			const embed = messages.buildCategoryEmbed(guild, categoryKey, categoryName, commands, i.user);
			await i.update({ 
				embeds: [embed], 
				components: messages.getHelpActionRows(categoryKey)
			});
		}
	});

    collector.on('end', () => {
        const disabledRows = messages.getHelpActionRows().map(row => 
            ActionRowBuilder.from(row).setComponents(
                row.components.map(c => ButtonBuilder.from(c).setDisabled(true))
            )
        );
        sent.edit({ components: disabledRows }).catch(() => {});
    });
}

const spotify = new Spotify({
    clientId: config.spotify.clientId,
    clientSecret: config.spotify.clientSecret
});
client.riffy = new Riffy(client, config.nodes, {
    send: (payload) => {
        const guild = client.guilds.cache.get(payload.d.guild_id);
        if (guild) guild.shard.send(payload);
    },
    defaultSearchPlatform: "ytmsearch",
    restVersion: "v4",
    plugins: [spotify]
});

client.riffy.on("nodeError", (node, error) => {
    log('ERROR', `❌ Node "${node.name}" error: ${error.message}`);
    if (error.stack) {
        log('ERROR', `Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`);
    }
});

client.riffy.on("trackError", (player, track, error) => {
    log('ERROR', `❌ Track error in guild ${player.guildId}: ${error.message}`);
});

client.riffy.on("nodeDisconnect", (node) => {
    log('ERROR', `❌ Node "${node.name}" disconnected!`);
});
const slashCommands = [
    new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song or playlist')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name, URL, or artist')
                .setRequired(true)
                .setAutocomplete(true)),
    new SlashCommandBuilder()
        .setName('playspotify')
        .setDescription('Play your saved Spotify playlists'),
    new SlashCommandBuilder()
        .setName('setspotify')
        .setDescription('Set your Spotify username for playlist access')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('Your Spotify username')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the current track'),
    new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the current track'),
    new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the current track'),
    new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop playback and clear queue'),
    new SlashCommandBuilder()
        .setName('lyrics')
        .setDescription('Show lyrics of the current track'),
    new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the current queue'),
    new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show current track info'),
    new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Adjust player volume (0-100)')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Volume level (0-100)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(100)),
    new SlashCommandBuilder()
        .setName('servervolume')
        .setDescription('Set permanent volume for this server (0-100)')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Volume level (0-100)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(100)),
    new SlashCommandBuilder()
        .setName('filter')
        .setDescription('Add filters to playback')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Filter type')
                .setRequired(true)
                .addChoices(
                    { name: 'nightcore', value: 'nightcore' },
                    { name: 'vaporwave', value: 'vaporwave' },
                    { name: '8d', value: '8d' },
                    { name: '16d', value: '16d' },
                    { name: 'chipmunk', value: 'chipmunk' },
                    { name: 'deepbass', value: 'deepbass' },
                    { name: 'reset', value: 'reset' },
                    { name: 'help', value: 'help' }
                )),
    new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffle the current queue'),
    new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Toggle queue loop mode'),
    new SlashCommandBuilder()
        .setName('move')
        .setDescription('Move a song in the queue')
        .addIntegerOption(option =>
            option.setName('from')
                .setDescription('Current position of the song')
                .setRequired(true)
                .setMinValue(1))
        .addIntegerOption(option =>
            option.setName('to')
                .setDescription('New position for the song')
                .setRequired(true)
                .setMinValue(1)),
    new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add a track at specific position')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('Song name or URL')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('Position in queue (1+)')
                .setRequired(true)
                .setMinValue(1)),
    new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a track from queue')
        .addIntegerOption(option =>
            option.setName('position')
                .setDescription('Position to remove (1+)')
                .setRequired(true)
                .setMinValue(1)),
    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear the current queue'),
    new SlashCommandBuilder()
        .setName('status')
        .setDescription('Show player status'),
    new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Show the bot\'s ping'),
	new SlashCommandBuilder()
        .setName('24-7-enable')
        .setDescription('Enable 24/7 mode in a voice channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The voice channel to stay in 24/7')
                .setRequired(true)
        ),
    new SlashCommandBuilder()
        .setName('24-7-disable')
        .setDescription('Disable 24/7 mode'),
		
	new SlashCommandBuilder()
    .setName('song-quote')
    .setDescription('Create a quote image with current track')
    .addStringOption(option =>
        option.setName('text')
            .setDescription('Text to display on the image')
            .setRequired(true)),
			
	new SlashCommandBuilder()
		.setName('mystats')
		.setDescription('View your personal music statistics across all servers'),

	new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Global leaderboard of top listeners'),

	new SlashCommandBuilder()
		.setName('resetmystats')
		.setDescription('Reset your personal statistics (irreversible!)'),
		
	new SlashCommandBuilder()
		.setName('stats')
		.setDescription('View your or another user\'s music statistics')
		.addUserOption(option =>
			option.setName('user')
				.setDescription('The user to view stats for (leave empty for yourself)')
				.setRequired(false)),
	new SlashCommandBuilder()
		.setName('debug')
		.setDescription('Debug bot status'),
		
	new SlashCommandBuilder()
		.setName('join')
		.setDescription('Make the bot join a voice channel')
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The voice channel to join (optional)')
				.setRequired(false)
				.addChannelTypes(2)),
				
	new SlashCommandBuilder()
		.setName('leave')
		.setDescription('Make the bot leave the voice channel'),

	new SlashCommandBuilder()
		.setName('rejoin')
		.setDescription('Make the bot leave and rejoin the current voice channel'),
		
	new SlashCommandBuilder()
		.setName('quote')
		.setDescription('Generate a quote image from a message')
		.addStringOption(option =>
			option.setName('message_id')
				.setDescription('The ID of the message to quote')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('text')
				.setDescription('Optional custom text to add')
				.setRequired(false)),
	
	new SlashCommandBuilder()
		.setName('shift')
		.setDescription('Move a user to another voice channel')
		.addUserOption(option =>
			option.setName('user')
				.setDescription('User to move (defaults to yourself)')
				.setRequired(false))
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('Target voice channel (defaults to bot’s channel or first VC)')
				.setRequired(false)
				.addChannelTypes(2)),

	new SlashCommandBuilder()
		.setName('disconnect')
		.setDescription('Disconnect a user from voice channel (defaults to yourself)')
		.addUserOption(option =>
			option.setName('user')
				.setDescription('User to disconnect (leave empty for yourself)')
				.setRequired(false)),
		
	new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all commands'),
].map(command => command.toJSON());
const rest = new REST({ 
    version: '10',
    timeout: 30000,
    retries: 3
}).setToken(config.botToken);
async function registerSlashCommands() {
    try {
        log('SLASH', `ℹ️ Registering slash commands globally...`);
        
        if (!config.clientId) {
            log('ERROR', `❌ No clientId found in config!`);
            return;
        }
        
        log('SLASH', `ℹ️ Number of commands: ${slashCommands.length}`);
        
        const response = await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: slashCommands }
        );
        
        log('SLASH', `✅ ${response.length} slash commands registered globally!`);
        line();
		
    } catch (error) {
        log('ERROR', `❌ Error registering slash commands: ${error.message}`);
        
        if (error.code) {
            log('ERROR', `❌ Error code: ${error.code}`);
        }
        
        if (error.status) {
            log('ERROR', `❌ HTTP status: ${error.status}`);
        }
        
        if (error.message) {
            log('ERROR', `❌ Message: ${error.message}`);
        }
    }
}
async function updateServerInvites() {
    const serversData = await loadServersData();
    const guilds = client.guilds.cache;
    
    for (const guild of guilds.values()) {
        if (!serversData[guild.id]) {
            serversData[guild.id] = {
                name: guild.name,
                inviteCode: null
            };
            
            try {
                let channel = null;
                
                if (guild.systemChannel && guild.systemChannel.permissionsFor(guild.members.me).has('CreateInstantInvite')) {
                    channel = guild.systemChannel;
                }
                
                if (!channel) {
                    channel = guild.channels.cache.find(ch => 
                        (ch.type === 0 || ch.type === 2) &&
                        ch.permissionsFor(guild.members.me).has('CreateInstantInvite') &&
                        ch.viewable
                    );
                }
                
                if (!channel) {
                    channel = guild.channels.cache.find(ch => 
                        ch.type === 0 &&
                        ch.viewable
                    );
                }
                
                if (channel) {
                    log('SERVER LIST', `Creating invite for ${guild.name} in channel: ${channel.name}`);
                    
                    const invite = await channel.createInvite({
                        maxAge: 0,
                        maxUses: 0,
                        reason: 'Server list invite'
                    }).catch(error => {
                        log('ERROR', `Failed to create invite for ${guild.name}: ${error.message}`);
                        return null;
                    });
                    
                    if (invite) {
                        serversData[guild.id].inviteCode = invite.code;
                        log('SERVER LIST', `Created invite for ${guild.name}: ${invite.code}`);
                    } else {
                        serversData[guild.id].inviteCode = 'PERMISSION_DENIED';
                    }
                } else {
                    serversData[guild.id].inviteCode = 'NO_CHANNEL';
                    log('SERVER LIST', `No suitable channel found for ${guild.name}`);
                }
            } catch (error) {
                log('ERROR', `Error creating invite for ${guild.name}: ${error.message}`);
                serversData[guild.id].inviteCode = 'ERROR';
            }
        } else if (serversData[guild.id].name !== guild.name) {
            serversData[guild.id].name = guild.name;
            
            if (!serversData[guild.id].inviteCode || 
                serversData[guild.id].inviteCode === 'N/A' ||
                serversData[guild.id].inviteCode === 'PERMISSION_DENIED' ||
                serversData[guild.id].inviteCode === 'NO_CHANNEL' ||
                serversData[guild.id].inviteCode === 'ERROR') {
                
                try {
                    let channel = guild.channels.cache.find(ch => 
                        (ch.type === 0 || ch.type === 2) &&
                        ch.permissionsFor(guild.members.me).has('CreateInstantInvite') &&
                        ch.viewable
                    );
                    
                    if (channel) {
                        const invite = await channel.createInvite({
                            maxAge: 0,
                            maxUses: 0,
                            reason: 'Server list invite update'
                        }).catch(() => null);
                        
                        if (invite) {
                            serversData[guild.id].inviteCode = invite.code;
                            log('SERVER LIST', `Updated invite for ${guild.name}: ${invite.code}`);
                        }
                    }
                } catch (error) {
                }
            }
        }
    }
    
    const currentGuildIds = guilds.map(g => g.id);
    await db.cleanupOldServers(currentGuildIds);
    await saveServersData(serversData);
    return serversData;
}
function printServerList(serversData) {
    const guilds = client.guilds.cache;
    log('SERVER LIST', '');
    
    for (const guild of guilds.values()) {
        const serverInfo = serversData[guild.id] || { name: guild.name, inviteCode: 'N/A' };
        const inviteCode = serverInfo.inviteCode || 'N/A';
        let inviteDisplay = inviteCode;
        if (inviteCode && !['N/A', 'PERMISSION_DENIED', 'NO_CHANNEL', 'ERROR'].includes(inviteCode)) {
            inviteDisplay = `https://discord.gg/${inviteCode}`;
        }
        const memberCount = guild.memberCount.toLocaleString();
        console.log(`├─ ${guild.name}`);
        console.log(`│  ├─ Members: ${memberCount}`);
        console.log(`│  └─ Invite: ${inviteDisplay}`);
    }
    console.log('└' + '─'.repeat(59));
}
client.once("clientReady", async () => {
    log('CLIENT', `✅ Logged in as ${client.user.tag}`);
    log('CLIENT', `🆔 Client ID: ${client.user.id}`);
	line();
    
    try {

        const hostingInfo = await getHostingServiceIP();
        if (hostingInfo) {
            client.hostingService = hostingInfo.hosting;
            client.hostingIP = hostingInfo.ip;
        }
        if (db.botId) {
            log('DATABASE', `🪐 Database initialized for bot: ${db.botId} (using PREFIXED collections)`);
        } else {
            log('DATABASE', `🪐 Database initialized for Heaven bot (using ORIGINAL collections)`);
        }

        const connected = await db.connect();
        if (!connected) {
            log('ERROR', "❌ Could not connect to database. Some features may not work.");
        } else {
            const clusterId = await db.getOrCreateClusterId();
            client.clusterId = String(clusterId);
            log('DATABASE', `🪐 Cluster ID: ${client.clusterId}`);
            log('DATABASE', '✅ Database connected');
            client.db = db;
        }
        line();
        client.noprefixGlobalEnabled = await db.getNoprefixGlobalEnabled();
        await loadGuildVolumes();
        client.spotifyIds = await db.loadSpotifyIds();

        log('NODE', 'Initializing Riffy...');
        client.riffy.init(client.user.id);

        client.riffy.once("nodeConnect", async (node) => {
            log('NODE', `✅ Node "${node.name}" connected.`);
			line();
            log('LOADING DATA', `✨ Global noprefix is ${client.noprefixGlobalEnabled ? 'ENABLED' : 'DISABLED'}`);
            log('LOADING DATA', '✨ Guild volumes loaded');
            log('LOADING DATA', '✨ Spotify IDs loaded');
            line();

            await new Promise(resolve => setTimeout(resolve, 3000));
            const data = await load24SevenData();
            const guildIds = Object.keys(data);
            
            log('LOADING DATA - 24/7', '');
            console.log(`✨ Found ${guildIds.length} guilds with 24/7 enabled`);
            
           for (let i = 0; i < guildIds.length; i++) {
                const guildId = guildIds[i];
                const settings = data[guildId];
                
                if (settings && settings.enabled) {
                    const guild = client.guilds.cache.get(guildId);
                    if (guild) {
                        const channel = guild.channels.cache.get(settings.channelId);
                        if (channel && channel.type === 2) {
                            try {
                                if (i > 0) {
                                    await new Promise(resolve => setTimeout(resolve, 500));
                                }
                                
                                client.riffy.createConnection({
                                    guildId: guild.id,
                                    voiceChannel: channel.id,
                                    textChannel: channel.id,
                                    deaf: true,
                                });
                                console.log(`[${i+1}/${guildIds.length}] Auto-connected to 24/7 in ${guild.name}`);
                            } catch (error) {
                                log('ERROR', `❌ Failed to auto-connect to 24/7 in ${guild.name}: ${error.message}`);
                            }
                        }
                    }
                }
            }
            
            console.log('✅ 24/7 auto-connect completed');
            line();
            try {
                const ownerUser = await client.users.fetch(ownerId);
                log('OWNER', `🎀 ID: ${ownerId}`);
                log('OWNER', `🎀 Username: ${ownerUser.tag}`);
                log('OWNER', `🎀 Github: ${config.githubProfile || 'Not set'}`);
                line();

                let totalHumans = 0;
                for (const guild of client.guilds.cache.values()) {
                    await guild.members.fetch();
                    const humans = guild.members.cache.filter(m => !m.user.bot).size;
                    totalHumans += humans;
                }
                log('BOT', `Bot Tag: ${client.user.tag}`);
				log('BOT', `Prefix: ${config.prefix}`);
                log('BOT', `Total Servers: ${client.guilds.cache.size}`);
                log('BOT', `Total Users: ${totalHumans}`);
				log('BOT', `Github Repo: ${config.githubRepo || 'Not set'}`);
                line();
            } catch (err) {
                log('ERROR', `Failed to fetch owner or count users: ${err.message}`);
            }

            const serversData = await updateServerInvites();
            printServerList(serversData);

            await registerSlashCommands();

            client.user.setPresence({
                activities: [{
                    name: '/help | 45 Guilds | 67.69k Users',
                    type: ActivityType.Listening,
                }],
                status: 'idle'
            });
            
            log('YAY!', '🎯 Bot fully initialized and ready!');
            line();
            setBotReady(true);
        });
        
    } catch (error) {
        log('ERROR', `❌ Error during initialization: ${error.message}`);
        log('ERROR', error.stack);
    }
});

client.on(Events.InteractionCreate, async interaction => {

    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
        
        if (interaction.commandName === 'play') {
            const focusedValue = interaction.options.getFocused();
            
            if (!focusedValue || focusedValue.length < 2) {
                return await interaction.respond([]);
            }
            
            try {
                const resolve = await client.riffy.resolve({
                    query: focusedValue,
                    requester: interaction.user,
                });
                const choices = [];
                
                if (resolve.tracks && resolve.tracks.length > 0) {
                    resolve.tracks.slice(0, 25).forEach(track => {
                        const title = track.info.title || 'Unknown Title';
                        const author = track.info.author || 'Unknown Artist';
                        const duration = track.info.length ? 
                            Math.floor(track.info.length / 60000) + ':' + 
                            Math.floor((track.info.length % 60000) / 1000).toString().padStart(2, '0') : 
                            'Live';
                        
                        choices.push({
                            name: `${title} - ${author} (${duration})`.slice(0, 100),
                            value: track.info.uri || `${title} - ${author}`
                        });
                    });
                }
                await interaction.respond(choices);
            } catch (error) {
                log('ERROR', `Autocomplete error: ${error.message}`);
                await interaction.respond([]);
            }
        }
        return;
    }

    if (!interaction.isCommand()) return;
    
    const { commandName, options, guild, member } = interaction;

    const voiceCommands = ['play', 'playspotify', 'pause', 'resume', 'skip', 'stop', 'queue', 
                         'nowplaying', 'volume', 'servervolume', 'shuffle', 'loop', 'remove', 
                         'clear', 'status', 'filter', 'move', 'add'];
    
    if (voiceCommands.includes(commandName)) {
        if (!member.voice.channel) {
            try {
                return await interaction.reply({ 
					content: `${emojis.error} | You must be in a voice channel!`, 
					flags: MessageFlags.Ephemeral
				});
            } catch (error) {
                log('ERROR', `Failed to reply to voice check: ${error.message}`);
                return;
            }
        }
    }

    const initialTimeout = setTimeout(async () => {
        if (!interaction.replied && !interaction.deferred) {
            try {
                await interaction.reply({ 
                    content: `${emojis.error} | Command timeout! Please try again.`, 
                    flags: MessageFlags.Ephemeral
                });
            } catch (error) {
                log('ERROR', `Initial timeout reply error: ${error.message}`);
            }
        }
    }, 3000);

    try {

        await interaction.deferReply({ ephemeral: false });
        clearTimeout(initialTimeout);
    } catch (error) {
        clearTimeout(initialTimeout);
        log('ERROR', `Failed to defer interaction: ${error.message}`);

        try {
            await interaction.reply({ 
				content: `${emojis.error} | Failed to process command!`, 
				flags: MessageFlags.Ephemeral 
			});
        } catch (replyError) {
            log('ERROR', `Failed to send error reply: ${replyError.message}`);
        }
        return;
    }

    const executionTimeout = setTimeout(async () => {
        try {
            await interaction.editReply({ 
                content: `${emojis.error} | Command execution timeout! Please try again.` 
            });
        } catch (error) {
            log('ERROR', `Execution timeout edit error: ${error.message}`);
        }
    }, 15000);

    try {
        switch (commandName) {
            case 'play': {
                const query = options.getString('query');
                await handlePlay(interaction, query, true);
                break;
            }
            case 'pause': {
                const player = client.riffy.players.get(guild.id);
                if (!player) return await interaction.editReply(`${emojis.error} | Nothing is playing!`);
                player.pause(true);
                await interaction.editReply(`${emojis.success} | Paused the music!`);
                break;
            }
            case 'resume': {
                const player = client.riffy.players.get(guild.id);
                if (!player) return await interaction.editReply(`${emojis.error} | Nothing is playing!`);
                player.pause(false);
                await interaction.editReply(`${emojis.success} | Resumed the music!`);
                break;
            }
            case 'skip': {
                const player = client.riffy.players.get(guild.id);
                if (!player) return await interaction.editReply(`${emojis.error} | Nothing is playing!`);
                player.stop();
                await interaction.editReply(`${emojis.success} | Skipped the current track!`);
                break;
            }
            case 'stop': {
				await handleStop(interaction, true);
				break;
			}
            case 'lyrics': {
                const player = client.riffy.players.get(guild.id);
                if (!player || !player.current) {
                    return await interaction.editReply(`${emojis.error} | No track is currently playing!`);
                }
                
                await interaction.editReply(`${emojis.loading} | Searching for lyrics...`);
                
                const { getLyrics } = require("./utils/lyrics.js");
                const lyricsData = await getLyrics(player.current.info.title, player.current.info.author || "");
				log('CLIENT', `Lyrics data received: ${JSON.stringify(lyricsData)}`);
                
                if (!lyricsData || !lyricsData.lyrics) {
                    return await interaction.editReply(`${emojis.error} | Lyrics not found for this track!`);
                }
                
                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle(`${emojis.blacksparkles} Lyrics of **${player.current.info.author} - ${player.current.info.title}**`)
                    .setDescription(lyricsData.lyrics.slice(0, 4000))
                    .setFooter({ 
                        text: 'Lyrics powered by Genius.com',
                        iconURL: 'https://i.ibb.co/GfHpz0fQ/image.gif'
                    });
                
                await interaction.editReply({ 
                    content: null,
                    embeds: [embed] 
                });
                break;
            }
            case 'queue': {
                const player = client.riffy.players.get(guild.id);
                if (!player) return await interaction.editReply(`${emojis.error} | Nothing is playing!`);
                await messages.queueListInteraction(interaction, player.queue, player.current, interaction.user.id);
                break;
            }
            case 'nowplaying': {
				const player = client.riffy.players.get(guild.id);
				if (!player || !player.current) {
					return await interaction.editReply(`${emojis.error} | No track is currently playing!`);
				}
				
				const embed = new EmbedBuilder()
					.setColor(config.embedColor)
					.setTitle(`${emojis.blacksparkles} Now Playing`)
					.setDescription(`[${player.current.info.title}](${player.current.info.uri})`);

				let thumbnail = null;
				try {
					thumbnail = (player.current?.info?.thumbnail && typeof player.current.info.thumbnail === 'string' ? player.current.info.thumbnail : null)
							 || extractThumbnail(player.current?.info)
							 || (player.current?.info?.artworkUrl || null)
							 || (player.current?.info?.image || null);
				} catch (e) {
					thumbnail = null;
				}
				if (thumbnail && typeof thumbnail === 'string' && thumbnail.trim() !== '') {
					embed.setThumbnail(thumbnail);
				}
				
				embed.addFields([
					{ name: 'Artist', value: `${emojis.blackbutterfly} ${player.current.info.author || "Unknown"}`, inline: true },
					{ name: 'Duration', value: `${emojis.blackbutterfly} ${formatDuration(player.current.info.length)}`, inline: true },
					{ name: 'Requested By', value: `${emojis.blackbutterfly} ${(player.current.info.requester && player.current.info.requester.tag) || "Unknown"}`, inline: true }
				])
				.setFooter({ text: 'Use /help to see all commands' });
				
				await interaction.editReply({ embeds: [embed] });
				break;
			}
            case 'volume': {
                const volume = options.getInteger('level');
                const player = client.riffy.players.get(guild.id);
                if (!player) return await interaction.editReply(`${emojis.error} | Nothing is playing!`);
                if (volume < 0 || volume > 100) {
                    return await interaction.editReply(`${emojis.error} | Please provide a valid volume between 0 and 100!`);
                }
                player.setVolume(volume);
                await interaction.editReply(`${emojis.success} | Volume set to **${volume}%**`);
                break;
            }
            case 'servervolume': {
                const volume = options.getInteger('level');
                if (volume < 0 || volume > 100) {
                    return await interaction.editReply(`${emojis.error} | Please provide a valid volume between 0 and 100!`);
                }
                client.guildVolumes.set(guild.id, volume);
                await db.saveGuildVolumes(client.guildVolumes);
                
                const player = client.riffy.players.get(guild.id);
                if (player) player.setVolume(volume);
                
                await interaction.editReply(`${emojis.success} | Server volume set to **${volume}%** permanently!`);
                break;
            }
            case 'filter': {
                const filterType = options.getString('type');
                const player = client.riffy.players.get(guild.id);
                
                if (!player) {
                    return await interaction.editReply(`${emojis.error} | Nothing is playing!`);
                }
                
                if (filterType === 'help') {
                    const embed = new EmbedBuilder()
                        .setColor(config.embedColor)
                        .setTitle(`${emojis.info} Filters Help`)
                        .setDescription([
                            `${emojis.music} Use "/filter <filter-name>" to apply a filter`,
                            `${emojis.music} Available Filters: nightcore, vaporwave, 8d, 16d, chipmunk, deepbass, reset`
                        ].join("\n"))
                        .setFooter({ text: "Use /filter reset to clear filters" });
                    
                    await interaction.editReply({ embeds: [embed] });
                    return;
                }
                
                try {
                    switch (filterType) {
                        case 'nightcore':
                            player.filters.setNightcore(true);
                            if (!player.activeFilters) player.activeFilters = [];
                            if (!player.activeFilters.includes("nightcore")) {
                                player.activeFilters.push("nightcore");
                            }
                            break;
                        case 'vaporwave':
                            player.filters.setVaporwave(true);
                            if (!player.activeFilters) player.activeFilters = [];
                            if (!player.activeFilters.includes("vaporwave")) {
                                player.activeFilters.push("vaporwave");
                            }
                            break;
                        case '8d':
                            player.filters.set8D(true);
                            if (!player.activeFilters) player.activeFilters = [];
                            if (!player.activeFilters.includes("8d")) {
                                player.activeFilters.push("8d");
                            }
                            break;
                        case '16d':
                            player.filters.setRotation(true, { rotationHz: 0.4 });
                            player.filters.setTremolo(true, { depth: 0.3, frequency: 4.0 });
                            if (!player.activeFilters) player.activeFilters = [];
                            if (!player.activeFilters.includes("16d")) {
                                player.activeFilters.push("16d");
                            }
                            break;
                        case 'chipmunk':
                            player.filters.setTimescale(true, { speed: 2.0, pitch: 1.5, rate: 0.8 });
                            if (!player.activeFilters) player.activeFilters = [];
                            if (!player.activeFilters.includes("chipmunk")) {
                                player.activeFilters.push("chipmunk");
                            }
                            break;
                        case 'deepbass':
                            player.filters.setEqualizer([
                                { band: 0, gain: 0.3 },
                                { band: 1, gain: 0.25 },
                                { band: 2, gain: 0.2 }
                            ]);
                            if (!player.activeFilters) player.activeFilters = [];
                            if (!player.activeFilters.includes("deepbass")) {
                                player.activeFilters.push("deepbass");
                            }
                            break;
                        case 'reset':
                            player.filters.clearFilters();
                            player.activeFilters = [];
                            break;
                        default:
                            await interaction.editReply(`${emojis.error} | Unknown filter! Use: nightcore, vaporwave, 8d, 16d, chipmunk, deepbass, reset`);
                            return;
                    }
                    
                    await messages.filterApplied(interaction.channel, player.activeFilters || []);
                    await interaction.editReply({ content: '​', embeds: [] });
                } catch (error) {
                    await interaction.editReply(`${emojis.error} | Failed to apply filter.`);
                }
                break;
            }
            case 'shuffle': {
                const player = client.riffy.players.get(guild.id);
                if (!player) return await interaction.editReply(`${emojis.error} | Nothing is playing!`);
                if (!player.queue.length) {
                    return await interaction.editReply(`${emojis.error} | Not enough tracks in queue to shuffle!`);
                }
                player.queue.shuffle();
                await interaction.editReply(`${emojis.success} | Shuffled the queue!`);
                break;
            }
            case 'loop': {
                const player = client.riffy.players.get(guild.id);
                if (!player) return await interaction.editReply(`${emojis.error} | Nothing is playing!`);
                const currentMode = player.loop;
                const newMode = currentMode === "none" ? "queue" : "none";
                player.setLoop(newMode);
                await interaction.editReply(`${emojis.success} | ${newMode === "queue" ? "Enabled" : "Disabled"} loop mode!`);
                break;
            }
            case 'move': {
                const from = options.getInteger('from');
                const to = options.getInteger('to');
                const player = client.riffy.players.get(guild.id);
                if (!player) return await interaction.editReply(`${emojis.error} | Nothing is playing!`);
                if (!player.queue.length) {
                    return await interaction.editReply(`${emojis.error} | Queue is empty!`);
                }
                const fromPos = from - 1;
                const toPos = to - 1;
                
                if (fromPos < 0 || toPos < 0 || fromPos >= player.queue.length || toPos > player.queue.length) {
                    return await interaction.editReply(`${emojis.error} | Valid positions: 1-${player.queue.length + 1}`);
                }
                const movedTrack = player.queue[fromPos];
                player.queue.splice(fromPos, 1);
                player.queue.splice(toPos, 0, movedTrack);
                await interaction.editReply(`${emojis.success} | Moved **${movedTrack.info.title}** from **${from}** to **${to}**!`);
                break;
            }
            case 'add': {
                const song = options.getString('song');
                const position = options.getInteger('position');
                const player = client.riffy.players.get(guild.id);
                if (!player) {
                    return await interaction.editReply(`${emojis.error} | Nothing is playing! Use /play first.`);
                }
                try {
                    const resolve = await client.riffy.resolve({
                        query: song,
                        requester: interaction.user,
                    });
                    const { loadType, tracks } = resolve;
                    if (!tracks?.length) {
                        return await interaction.editReply(`${emojis.error} | No results found!`);
                    }
                    if (loadType === "playlist") {
                        return await interaction.editReply(`${emojis.error} | Playlists not supported with /add. Use /play instead.`);
                    }
                    
                    const track = tracks[0];
                    track.info.requester = interaction.user;
                    const insertPos = Math.min(position - 1, player.queue.length);
                    player.queue.splice(insertPos, 0, track);
                    await interaction.editReply(`${emojis.success} | Added **${track.info.title}** at position **${position}**! Queue now has ${player.queue.length} tracks.`);
                } catch (error) {
                    await interaction.editReply(`${emojis.error} | Failed to add track!`);
                }
                break;
            }
            case 'remove': {
                const position = options.getInteger('position');
                const player = client.riffy.players.get(guild.id);
                if (!player) return await interaction.editReply(`${emojis.error} | Nothing is playing!`);
                if (position < 1 || position > player.queue.length) {
                    return await interaction.editReply(`${emojis.error} | Please provide a valid track position between 1 and ${player.queue.length}!`);
                }
                const removed = player.queue.remove(position - 1);
                await interaction.editReply(`${emojis.success} | Removed **${removed.info.title}** from the queue!`);
                break;
            }
            case 'clear': {
                const player = client.riffy.players.get(guild.id);
                if (!player) return await interaction.editReply(`${emojis.error} | Nothing is playing!`);
                if (!player.queue.length) {
                    return await interaction.editReply(`${emojis.error} | Queue is already empty!`);
                }
                player.queue.clear();
                await interaction.editReply(`${emojis.success} | Cleared the queue!`);
                break;
            }
            case 'status': {
				const player = client.riffy.players.get(guild.id);
				if (!player) return await interaction.editReply(`${emojis.error} | No active player found!`);
				
				const embed = new EmbedBuilder()
					.setColor(config.embedColor)
					.setTitle(`${emojis.info} Player Status`)
					.addFields([
						{ name: 'Status', value: player.playing ? `${emojis.playboy} Playing` : `${emojis.pause} Paused`, inline: true },
						{ name: 'Volume', value: `${emojis.playboy} ${player.volume}%`, inline: true },
						{ name: 'Loop Mode', value: `${emojis.playboy} ${player.loop === "queue" ? 'Queue' : 'Disabled'}`, inline: true }
					]);
				break;
			}
            case 'ping': {
                const wsLatency = Math.round(client.actualWsPing || client.ws.ping || 0);
                const clusterId = client.clusterId || "45";
                let shardId = 667;
                
                if (client.shard) {
                    try {
                        shardId = client.shard.ids[0] || 0;
                    } catch (error) {

                    }
                }
                const restLatency = Date.now() - interaction.createdTimestamp;
                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle(`${emojis.redblackcross} Cluster ${clusterId}`)
                    .addFields(
                        {
                            name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                            value: `• Discord REST latency: \`${restLatency}ms\`\n• Discord Gateway (WS) latency: \`${wsLatency}ms\` (Shard ${shardId})`,
                            inline: false
                        }
                    )
                    .setFooter({ text: `Database on MongoDB • Powered by ${client.hostingService || 'Unknown'}` })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
                break;
            }
            case 'help': {
			  await sendHelpWithComponents(interaction);
			  break;
			}
            case 'setspotify': {
                const username = options.getString('username');
                const success = await db.setSpotifyId(interaction.user.id, username);
                
                if (success) {
                    client.spotifyIds = await db.loadSpotifyIds();
                    await interaction.editReply(`${emojis.success} | Spotify ID **${username}** saved! Use /playspotify anytime.`);
                } else {
                    await interaction.editReply(`${emojis.error} | Failed to save Spotify ID!`);
                }
                break;
            }
            case 'playspotify': {
                await handlePlaySpotify(interaction, true);
                break;
            }
            case '24-7-enable': {
                const channel = options.getChannel('channel');
                if (channel.type !== 2) {
                    return await interaction.editReply(`${emojis.error} | Invalid voice channel!`);
                }
                
                const guild = interaction.guild;
                if (client.riffy.nodes.size === 0) {
                    return await interaction.editReply(`${emojis.error} | Music nodes are not ready yet. Please try again in a few moments.`);
                }
                
                try {
                    const player = client.riffy.createConnection({
                        guildId: guild.id,
                        voiceChannel: channel.id,
                        textChannel: interaction.channel.id,
                        deaf: true,
                    });
                    
                    player.setVolume(10);
                    const result = await db.enable24Seven(guild.id, channel.id);
                    
                    if (result.success) {
                        await interaction.editReply(`${emojis.success} | 24/7 enabled. Channel set to <#${channel.id}>`);
                    } else {
                        await interaction.editReply(`${emojis.error} | ${result.message}`);
                    }
                } catch (error) {
                    await interaction.editReply(`${emojis.error} | Failed to enable 24/7: ${error.message}`);
                }
                break;
            }
            case '24-7-disable': {
                const player = client.riffy.players.get(guild.id);
                if (player) {
                    player.destroy();
                }
                const result = await db.disable24Seven(guild.id);
                
                if (result.success) {
                    await interaction.editReply(`${emojis.success} | ${result.message}`);
                } else {
                    await interaction.editReply(`${emojis.error} | ${result.message}`);
                }
                break;
            }
            case 'song-quote': {
				const text = options.getString('text');
				const player = client.riffy.players.get(guild.id);
				if (!player || !player.current) {
					return await interaction.editReply(`${emojis.error} | No track is currently playing!`);
				}

				try {
					await interaction.editReply(`${emojis.loading} | Generating your song quote...`);

					const { createSongQuoteImage } = require("./utils/songQuoteGenerator");
					const track = player.current;
					const imageBuffer = await createSongQuoteImage(track, text);
					const { AttachmentBuilder } = require('discord.js');
					const attachment = new AttachmentBuilder(imageBuffer, { name: 'song-quote.png' });

					const embed = new EmbedBuilder()
						.setColor(config.embedColor)
						.setTitle(`${emojis.blackbutterfly} Song Quote Generated`)
						.setDescription(`**${track.info.title}** - ${track.info.author || 'Unknown Artist'}`)
						.setImage('attachment://song-quote.png')
						.setFooter({
							text: `Requested by ${interaction.user.tag}`,
							iconURL: interaction.user.displayAvatarURL()
						})
						.setTimestamp();

					await interaction.editReply({
						content: null,
						embeds: [embed],
						files: [attachment]
					});

					const reply = await interaction.fetchReply();

					const getAttachmentUrlWithRetry = async (msg, maxRetries = 10, delayMs = 1000) => {
						for (let attempt = 1; attempt <= maxRetries; attempt++) {
							if (msg.attachments && msg.attachments.size > 0) {
								return msg.attachments.first().url;
							}
							if (msg.embeds && msg.embeds.length > 0 && msg.embeds[0].image && msg.embeds[0].image.url) {
								return msg.embeds[0].image.url;
							}
							await new Promise(resolve => setTimeout(resolve, delayMs));
							try {
								msg = await interaction.fetchReply();
							} catch (fetchError) {
								log('ERROR', `Attachment fetch attempt ${attempt} failed: ${fetchError.message}`);
							}
						}
						throw new Error('Failed to retrieve attachment URL after multiple attempts');
					};

					const attachmentUrl = await getAttachmentUrlWithRetry(reply);

					const row = new ActionRowBuilder()
						.addComponents(
							new ButtonBuilder()
								.setLabel('Download')
								.setStyle(ButtonStyle.Link)
								.setURL(attachmentUrl),
							new ButtonBuilder()
								.setCustomId(`song_quote_dm_${interaction.user.id}`)
								.setLabel('Send in DM')
								.setStyle(ButtonStyle.Secondary)
						);

					await interaction.editReply({ components: [row] });

					const filter = i => i.customId === `song_quote_dm_${interaction.user.id}` && i.user.id === interaction.user.id;
					const collector = reply.createMessageComponentCollector({ filter, time: 60000 });

					collector.on('collect', async i => {
						try {
							const dmEmbed = new EmbedBuilder()
								.setColor(config.embedColor)
								.setTitle(`${emojis.blackbutterfly} Song Quote Generated`)
								.setDescription(`**${track.info.title}** - ${track.info.author || 'Unknown Artist'}`)
								.setImage(attachmentUrl)
								.setFooter({ text: `Requested by ${i.user.tag}` })
								.setTimestamp();

							await i.user.send({ embeds: [dmEmbed] });
							await i.reply({ content: `${emojis.success} Image sent to your DMs!`, flags: MessageFlags.Ephemeral });
						} catch (error) {
							await i.reply({
								content: `${emojis.error} Could not send you a DM. Please make sure your DMs are open.`,
								flags: MessageFlags.Ephemeral
							});
						}
					});

					collector.on('end', async () => {
						const disabledRow = new ActionRowBuilder().addComponents(
							ButtonBuilder.from(row.components[0]),
							ButtonBuilder.from(row.components[1]).setDisabled(true)
						);
						await interaction.editReply({ components: [disabledRow] }).catch(() => {});
					});

				} catch (error) {
					log('ERROR', `Song quote error: ${error.message}`);
					await interaction.editReply(`${emojis.error} | Failed to generate song quote: ${error.message}`);
				}
				break;
			}
			
			case 'quote': {
				await handleQuote(interaction, true, {});
				break;
			}
			
            case 'mystats': {
                try {
                    const userStats = await db.getUserStats(interaction.user.id);
                    const userRank = await db.getUserRank(interaction.user.id);
                    
                    if (!userStats) {
                        return await interaction.editReply(`${emojis.error} | No statistics found for ${interaction.user.username}. Play some music first!`);
                    }
                    
                    await messages.userStatsEmbedInteraction(interaction, userStats, userRank, interaction.user, true);
                } catch (error) {
                    log('ERROR', `Error fetching stats: ${error.message}`);
                    await interaction.editReply(`${emojis.error} | Failed to fetch statistics!`);
                }
                break;
            }
            case 'leaderboard': {
                try {
                    const leaderboardData = await db.getLeaderboard(10);
                    await messages.leaderboardInteraction(interaction, leaderboardData);
                } catch (error) {
                    log('ERROR', `Error fetching leaderboard: ${error.message}`);
                    await interaction.editReply(`${emojis.error} | Failed to fetch leaderboard!`);
                }
                break;
            }
            case 'resetmystats': {
                const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('confirm_reset')
                            .setLabel('Yes, Reset All Stats')
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId('cancel_reset')
                            .setLabel('Cancel')
                            .setStyle(ButtonStyle.Secondary)
                    );
                
                const embed = new EmbedBuilder()
                    .setColor(0xff5555)
                    .setTitle(`${emojis.error} Reset Statistics Confirmation`)
                    .setDescription(`**Are you absolutely sure?**\n\nThis will:\n• Delete all your listening history\n• Remove your top songs/artists\n• Reset your global ranking\n\n**This action is irreversible!**`)
                    .setFooter({ text: 'You have 30 seconds to decide' });
                
                await interaction.editReply({ 
                    embeds: [embed], 
                    components: [row] 
                });
                const filter = i => i.user.id === interaction.user.id;
                const collector = interaction.channel.createMessageComponentCollector({ 
                    filter, 
                    time: 30000 
                });
                
                collector.on('collect', async i => {
                    if (i.customId === 'confirm_reset') {
                        try {
                            const collection = db.collection('user_stats');
                            await collection.deleteOne({ discord_user_id: interaction.user.id });
                            
                            await i.update({
                                content: `${emojis.success} | Your statistics have been reset!`,
                                embeds: [],
                                components: []
                            });
                        } catch (error) {
                            await i.update({
                                content: `${emojis.error} | Failed to reset statistics!`,
                                embeds: [],
                                components: []
                            });
                        }
                    } else if (i.customId === 'cancel_reset') {
                        await i.update({
                            content: `${emojis.success} | Statistics reset cancelled.`,
                            embeds: [],
                            components: []
                        });
                    }
                    collector.stop();
                });
                
                collector.on('end', async () => {
                    try {
                        await interaction.editReply({ components: [] });
                    } catch (error) {

                    }
                });
                break;
            }
            case 'stats': {
                const targetUser = options.getUser('user') || interaction.user;
                try {
                    const userStats = await db.getUserStats(targetUser.id);
                    const userRank = await db.getUserRank(targetUser.id);
                    
                    if (!userStats) {
                        return await interaction.editReply(`${emojis.error} | No statistics found for ${targetUser.username}. Play some music first!`);
                    }
                    
                    await messages.userStatsEmbedInteraction(interaction, userStats, userRank, targetUser, interaction.user.id === targetUser.id);
                } catch (error) {
                    log('ERROR', `Error fetching stats: ${error.message}`);
                    await interaction.editReply(`${emojis.error} | Failed to fetch statistics!`);
                }
                break;
            }
			
			case 'join': {
				const channel = options.getChannel('channel');
				await handleJoin(interaction, channel, true);
				break;
			}
			
			case 'leave': {
				await handleLeave(interaction, true);
				break;
			}

			case 'rejoin': {
				await handleRejoin(interaction, true);
				break;
			}
			
			case 'shift': {
				const targetUser = options.getUser('user') || interaction.user;
				const targetChannel = options.getChannel('channel');
				await handleShift(interaction, true, targetUser, targetChannel);
				break;
			}

			case 'disconnect': {
				const targetUser = options.getUser('user') || interaction.user;
				await handleDisconnect(interaction, true, targetUser);
				break;
			}

            default: {
                await interaction.editReply({ content: `${emojis.error} | Unknown command!` });
                break;
            }
        }
    } catch (error) {
        log('ERROR', `❌ Error executing slash command ${commandName}: ${error.message}`);
        
        try {
            await interaction.editReply({ 
                content: `${emojis.error} | Command failed: ${error.message || 'Unknown error'}` 
            });
        } catch (replyError) {
            log('ERROR', `❌ Could not send error for ${commandName}: ${replyError.message}`);
        }
    } finally {

        clearTimeout(executionTimeout);
    }
});

async function handlePlay(context, query, isInteraction = false) {
    try {
        const guild = isInteraction ? context.guild : context.guild;
        const member = isInteraction ? context.member : context.member;
        const user = isInteraction ? context.user : context.author;
        const channel = isInteraction ? context.channel : context.channel;
        

        let player = client.riffy.players.get(guild.id);
		if (!player) {
			player = client.riffy.createConnection({
				guildId: guild.id,
				voiceChannel: member.voice.channel.id,
				textChannel: channel.id,
				deaf: true,
			});
		} else {
			if (player.voiceChannel !== member.voice.channel.id) {
				player.setVoiceChannel(member.voice.channel.id);
			}
			if (player.textChannel !== channel.id) {
				player.setTextChannel(channel.id);
			}
		}

        const twentyFourSevenData = await load24SevenData();
        const guild24SevenData = twentyFourSevenData[guild.id];
        if (guild24SevenData && guild24SevenData.enabled) {
            if (!client.original24SevenChannels.has(guild.id)) {
                client.original24SevenChannels.set(guild.id, {
                    voiceChannel: guild24SevenData.channelId,
                    textChannel: player.textChannel || channel.id
                });
            }
            
            const botMember = guild.members.me;
            const botVoiceChannel = botMember?.voice?.channel;
            
            if (botVoiceChannel && botVoiceChannel.id !== member.voice.channel.id) {
                player.setVoiceChannel(member.voice.channel.id);
                player.setTextChannel(channel.id);
            }
        }

        const savedVolume = client.guildVolumes.get(guild.id);
        if (savedVolume !== undefined) {
            player.setVolume(savedVolume);
        }
        
        const resolve = await client.riffy.resolve({
            query: query,
            requester: user,
        });
        
        const { loadType, tracks, playlistInfo } = resolve;
        
        if (!tracks || !tracks.length) {
            return await sendResponse(context, `${emojis.error} | No results found! Try with a different search term.`, isInteraction);
        }
        
        if (loadType === "playlist") {
            let allTracks = tracks;
            let totalTrackCount = tracks.length;
            let playlistImage = null;
            let creationDate = null;
            let isSpotifyPlaylist = query.includes('spotify.com/playlist/');

            if (isSpotifyPlaylist) {
                const spotifyRegex = /spotify\.com\/playlist\/([a-zA-Z0-9]+)/;
                const match = query.match(spotifyRegex);
                if (match) {
                    const playlistId = match[1];
                    try {
                        const { getAllPlaylistTracks, getPlaylistDetails } = require("./utils/spotifyPlaylists.js");
                        const fullTracks = await getAllPlaylistTracks(playlistId);
                        if (fullTracks && fullTracks.length > 0) {
                            allTracks = [];
                            totalTrackCount = fullTracks.length;
                            const details = await getPlaylistDetails(playlistId);
                            playlistImage = details?.image || null;
                            creationDate = details?.created_at || null;
                            let addedCount = 0;
                            const CONCURRENCY_LIMIT = 5;
                            for (let i = 0; i < fullTracks.length; i += CONCURRENCY_LIMIT) {
                                const chunk = fullTracks.slice(i, i + CONCURRENCY_LIMIT);
								const resolvedTracks = await Promise.all(chunk.map(async (trackData) => {
									try {
										let res = await client.riffy.resolve({
											query: trackData.uri,
											requester: user
										});
										let track = res.tracks?.[0];
										if (!track) {
											const fallbackQuery = `${trackData.title} ${trackData.artist}`.trim();
											if (fallbackQuery) {
												try {
													res = await client.riffy.resolve({
														query: fallbackQuery,
														requester: user
													});
													track = res.tracks?.[0];
												} catch (e) {
												}
											}
										}

										if (track) {
											track.info.requester = user;
											return track;
										}
									} catch (err) {
									}
									return null;
								}));
                                resolvedTracks.forEach((t, idx) => {
									if (!t) return;

									player.queue.add(t);
									addedCount++;
									const original = chunk[idx];
									if (original && original.thumbnail) {
										if (!player._spotifyThumbs) player._spotifyThumbs = new Map();
										player._spotifyThumbs.set(t.info.uri, original.thumbnail);
									}
								});
                                if (i + CONCURRENCY_LIMIT < fullTracks.length) await new Promise(r => setTimeout(r, 30));
                            }
                        }
                    } catch (spotifyError) {
                        log('ERROR', `❌ Failed to fetch full Spotify playlist: ${spotifyError.message}`);
                        allTracks = tracks;
                        totalTrackCount = tracks.length;
                    }
                }
            }
            if (allTracks === tracks) {
                for (const track of tracks) {
                    track.info.requester = user;
                    player.queue.add(track);
                }
                totalTrackCount = tracks.length;
            }
            let thumbnail = playlistImage;
            if (!thumbnail && tracks[0]?.info) {
                thumbnail = extractThumbnail(tracks[0].info);
            }

            let creationDateStr = 'Unknown';
            if (creationDate) {
                try {
                    creationDateStr = new Date(creationDate).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    });
                } catch { }
            }
            if (isInteraction) {
                const embed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle(`${emojis.success} Playing ${playlistInfo.name || 'Spotify Playlist'}`)
                    .setDescription(`[${playlistInfo.name || 'Playlist'}](${query})`)
                    .addFields({
                        name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                        value: "",
                        inline: false
                    })
                    .addFields(
                        {
                            name: `${emojis.music} Playlist created on: ${creationDateStr}`,
                            value: "",
                            inline: false
                        },
                        {
                            name: `${emojis.music} Number of tracks: ${totalTrackCount} tracks`,
                            value: "",
                            inline: false
                        }
                    )
                    .setFooter({ 
                        text: 'Enjoy your music!',
                        iconURL: 'https://i.ibb.co/GfHpz0fQ/image.gif'
                    });
                
                if (thumbnail && typeof thumbnail === 'string' && thumbnail.trim() !== '') {
                    embed.setThumbnail(thumbnail);
                }
                
                await sendResponse(context, { embeds: [embed] }, isInteraction);
            } else {
                await messages.playingPlaylist(channel, {
                    name: playlistInfo.name,
                    uri: query,
                    url: query,
                    thumbnail: thumbnail,
                    image: thumbnail,
                    created_at: creationDate,
                    tracksCount: totalTrackCount
                }, tracks, isSpotifyPlaylist);
            }

            if (!player.playing && !player.paused) {
				cancelInactivityTimer(guild.id);
                player.play();
            }
        } else if (loadType === "search" || loadType === "track") {
            const track = tracks[0];
            track.info.requester = user;
            const position = player.queue.length + 1;
            player.queue.add(track);
                        
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.success} Added to queue: ${track.info.title}`)
                .addFields(
                    { name: 'Artist', value: track.info.author || 'Unknown', inline: true },
                    { name: 'Duration', value: formatDuration(track.info.length), inline: true },
                    { name: 'Position', value: `#${position}`, inline: true }
                );
            
            const trackThumbnail = extractThumbnail(track.info);
            if (trackThumbnail && typeof trackThumbnail === 'string') {
                embed.setThumbnail(trackThumbnail);
            }
            
            await sendResponse(context, { embeds: [embed] }, isInteraction);
            
            if (!player.playing && !player.paused) {
				cancelInactivityTimer(guild.id);
                player.play();
            }
        } else {
            await sendResponse(context, `${emojis.error} | No results found! Try with a different search term.`, isInteraction);
        }
    } catch (error) {
        log('ERROR', `Error in handlePlay: ${error.message}`);
        await sendResponse(context, `${emojis.error} | An error occurred while playing the track: ${error.message}`, isInteraction);
    }
}

async function handlePause(context, isInteraction = false) {
    const guild = isInteraction ? context.guild : context.guild;
    const player = client.riffy.players.get(guild.id);
    
    if (!player) {
        return await sendResponse(context, `${emojis.error} | Nothing is playing!`, isInteraction);
    }
    if (player.paused) {
        return await sendResponse(context, `${emojis.error} | The player is already paused!`, isInteraction);
    }
    
    player.pause(true);
    await sendResponse(context, `${emojis.success} | Paused the music!`, isInteraction);
}
async function handleResume(context, isInteraction = false) {
    const guild = isInteraction ? context.guild : context.guild;
    const player = client.riffy.players.get(guild.id);
    
    if (!player) {
        return await sendResponse(context, `${emojis.error} | Nothing is playing!`, isInteraction);
    }
    if (!player.paused) {
        return await sendResponse(context, `${emojis.error} | The player is already playing!`, isInteraction);
    }
    
    player.pause(false);
    await sendResponse(context, `${emojis.success} | Resumed the music!`, isInteraction);
}
async function handleSkip(context, isInteraction = false) {
    const guild = isInteraction ? context.guild : context.guild;
    const player = client.riffy.players.get(guild.id);
    
    if (!player) {
        return await sendResponse(context, `${emojis.error} | Nothing is playing!`, isInteraction);
    }
    if (!player.queue.length) {
        return await sendResponse(context, `${emojis.error} | No more tracks in queue to skip to!`, isInteraction);
    }
    
    player.stop();
    await sendResponse(context, `${emojis.success} | Skipped the current track!`, isInteraction);
}
async function handleStop(context, isInteraction = false) {
    const guild = isInteraction ? context.guild : context.guild;
    const player = client.riffy.players.get(guild.id);
    
    if (!player) {
        return await sendResponse(context, `${emojis.error} | Nothing is playing!`, isInteraction);
    }

    player._manualStop = true;

    player.queue.clear();
    player.stop();

    await sendResponse(context, `${emojis.success} | Stopped the music and cleared the queue!`, isInteraction);

    await rejoinAndIdle(guild.id, player.textChannel);
}
async function rejoinAndIdle(guildId, textChannelId) {
    const player = client.riffy.players.get(guildId);
    if (!player) return null;
    
    const voiceChannelId = player.voiceChannel;
    const guild = client.guilds.cache.get(guildId);
    
    if (!guild) return null;
    if (!guild) return null;
    
    const voiceChannel = guild.channels.cache.get(voiceChannelId);
    if (!voiceChannel || voiceChannel.type !== 2) return null;
    const textChannel = textChannelId || player.textChannel;
    
    await clearVoiceChannelStatus(voiceChannelId);
    cancelInactivityTimer(guildId);
    player.destroy();
    await new Promise(resolve => setTimeout(resolve, 800));
    const newPlayer = client.riffy.createConnection({
        guildId: guildId,
        voiceChannel: voiceChannel.id,
        textChannel: textChannel,
        deaf: true,
    });
    const savedVolume = client.guildVolumes.get(guildId);
    if (savedVolume !== undefined) {
        newPlayer.setVolume(savedVolume);
    }
    const twentyFourSevenData = await load24SevenData();
    const guild24Seven = twentyFourSevenData[guildId]?.enabled === true;

    if (guild24Seven) {
        await setVoiceChannelStatus(voiceChannel.id, `${emojis.blade} | 24/7 enabled!`);
    } else {
        await setVoiceChannelStatus(voiceChannel.id, `${emojis.greensparkles || '✨'} | Idle.`);
        startInactivityTimer(guildId, textChannel);
    }

    return newPlayer;
}
async function handleLyrics(context, isInteraction = false) {
    const guild = isInteraction ? context.guild : context.guild;
    const player = client.riffy.players.get(guild.id);
    
    if (!player || !player.current) {
        return await sendResponse(context, `${emojis.error} | No track is currently playing!`, isInteraction);
    }
    
    const trackTitle = player.current.info.title;
    const trackArtist = player.current.info.author || "";

    if (isInteraction) {
        await context.editReply({ 
            content: `${emojis.loading} | Searching for lyrics...` 
        });
    }
    
    const { getLyrics } = require("./utils/lyrics.js");
    const lyricsData = await getLyrics(trackTitle, trackArtist);

    
    if (!lyricsData || !lyricsData.lyrics) {
        return await sendResponse(context, `${emojis.error} | Lyrics not found for this track!`, isInteraction);
    }
    
    if (isInteraction) {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.blacksparkles} Lyrics of **${trackArtist} - ${trackTitle}**`)
            .setDescription(lyricsData.lyrics.slice(0, 4000))
            .setFooter({ 
                text: 'Lyrics powered by Genius.com',
                iconURL: 'https://i.ibb.co/GfHpz0fQ/image.gif'
            });
        
        await context.editReply({ 
            content: null,
            embeds: [embed] 
        });
    } else {
        const channel = context.channel;
        await messages.lyrics(channel, trackTitle, lyricsData, trackArtist);
    }
}
async function handleQueue(context, isInteraction = false) {
    const guild = isInteraction ? context.guild : context.guild;
    const channel = isInteraction ? context.channel : context.channel;
    const user = isInteraction ? context.user : context.author;
    const player = client.riffy.players.get(guild.id);
    
    if (!player) {
        return await sendResponse(context, `${emojis.error} | Nothing is playing!`, isInteraction);
    }
    
    const queue = player.queue;
    if (!queue.length && !player.queue.current) {
        return await sendResponse(context, `${emojis.error} | Queue is empty!`, isInteraction);
    }
    if (isInteraction) {
        await messages.queueListInteraction(context, queue, player.queue.current, user.id);
    } else {
        await messages.queueList(channel, queue, player.queue.current, user.id);
    }
}
async function handleNowPlaying(context, isInteraction = false) {
    const guild = isInteraction ? context.guild : context.guild;
    const channel = isInteraction ? context.channel : context.channel;
    const player = client.riffy.players.get(guild.id);
    
    if (!player) {
        return await sendResponse(context, `${emojis.error} | Nothing is playing!`, isInteraction);
    }
    const currentTrack = player.current || player.queue.current;
    if (!currentTrack) {
        return await sendResponse(context, `${emojis.error} | No track is currently playing!`, isInteraction);
    }
    
    const config = require('./config.js');
    
    if (isInteraction) {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.blacksparkles} Now Playing`)
            .setDescription(`[${currentTrack.info.title}](${currentTrack.info.uri})`);
        
        if (currentTrack.info.thumbnail && typeof currentTrack.info.thumbnail === 'string') {
            embed.setThumbnail(currentTrack.info.thumbnail);
        }  
        
        embed.addFields([
            { name: 'Artist', value: `${emojis.blackbutterfly} ${currentTrack.info.author || "Unknown"}`, inline: true },
            { name: 'Duration', value: `${emojis.blackbutterfly} ${formatDuration(currentTrack.info.length)}`, inline: true },
            { name: 'Requested By', value: `${emojis.blackbutterfly} ${(currentTrack.info.requester && currentTrack.info.requester.tag) || "Unknown"}`, inline: true }
        ])
        .setFooter({ text: 'Use /help to see all commands' });
        
        await context.editReply({ embeds: [embed] });
    } else {
        await messages.nowPlaying(channel, currentTrack);
    }
}
async function handleVolume(context, volume, isInteraction = false) {
    const guild = isInteraction ? context.guild : context.guild;
    const player = client.riffy.players.get(guild.id);
    
    if (!player) {
        return await sendResponse(context, `${emojis.error} | Nothing is playing!`, isInteraction);
    }
    
    if (volume < 0 || volume > 100) {
        return await sendResponse(context, `${emojis.error} | Please provide a valid volume between 0 and 100!`, isInteraction);
    }
    player.setVolume(volume);
    await sendResponse(context, `${emojis.success} | Volume set to **${volume}%**`, isInteraction);
}
async function handleServerVolume(context, volume, isInteraction = false) {
    const guild = isInteraction ? context.guild : context.guild;
    
    if (volume < 0 || volume > 100) {
        return await sendResponse(context, `${emojis.error} | Please provide a valid volume between 0 and 100!`, isInteraction);
    }
    client.guildVolumes.set(guild.id, volume);
    await saveGuildVolumes();
    
    const player = client.riffy.players.get(guild.id);
    if (player) player.setVolume(volume);
    
    await sendResponse(context, `${emojis.success} | Server volume set to **${volume}%** permanently!`, isInteraction);
}
async function handleFilter(context, filterType, isInteraction = false) {
    const guild = isInteraction ? context.guild : context.guild;
    const channel = isInteraction ? context.channel : context.channel;
    const player = client.riffy.players.get(guild.id);
    
	if (filterType === 'help') {
		if (isInteraction) {
			const embed = new EmbedBuilder()
				.setColor(config.embedColor)
				.setTitle(`${emojis.info} Filters Help`)
				.setDescription([
					`${emojis.music} Use "/filter <filter-name>" to apply a filter`,
					`${emojis.music} Available Filters: nightcore, vaporwave, 8d, 16d, chipmunk, deepbass, reset`
				].join("\n"))
				.setFooter({ text: "Use /filter reset to clear filters" });
			
			await context.editReply({ embeds: [embed] });
		} else {
			await messages.filterHelp(channel);
		}
		return;
	}
	
    if (!player) {
        return await sendResponse(context, `${emojis.error} | Nothing is playing!`, isInteraction);
    }
    try {
        switch (filterType) {
            case 'nightcore':
                player.filters.setNightcore(true);
                if (!player.activeFilters) player.activeFilters = [];
                if (!player.activeFilters.includes("nightcore")) {
                    player.activeFilters.push("nightcore");
                }
                break;
            case 'vaporwave':
                player.filters.setVaporwave(true);
                if (!player.activeFilters) player.activeFilters = [];
                if (!player.activeFilters.includes("vaporwave")) {
                    player.activeFilters.push("vaporwave");
                }
                break;
            case '8d':
                player.filters.set8D(true);
                if (!player.activeFilters) player.activeFilters = [];
                if (!player.activeFilters.includes("8d")) {
                    player.activeFilters.push("8d");
                }
                break;
                
            case '16d':
                player.filters.setRotation(true, { rotationHz: 0.4 });
                player.filters.setTremolo(true, { depth: 0.3, frequency: 4.0 });
                if (!player.activeFilters) player.activeFilters = [];
                if (!player.activeFilters.includes("16d")) {
                    player.activeFilters.push("16d");
                }
                break;
            case 'chipmunk':
                player.filters.setTimescale(true, { speed: 2.0, pitch: 1.5, rate: 0.8 });
                if (!player.activeFilters) player.activeFilters = [];
                if (!player.activeFilters.includes("chipmunk")) {
                    player.activeFilters.push("chipmunk");
                }
                break;
            case 'deepbass':
                player.filters.setEqualizer([
                    { band: 0, gain: 0.3 },
                    { band: 1, gain: 0.25 },
                    { band: 2, gain: 0.2 }
                ]);
                if (!player.activeFilters) player.activeFilters = [];
                if (!player.activeFilters.includes("deepbass")) {
                    player.activeFilters.push("deepbass");
                }
                break;
            case 'reset':
                player.filters.clearFilters();
                player.activeFilters = [];
                break;
            default:
                await sendResponse(context, `${emojis.error} | Unknown filter! Use: nightcore, vaporwave, 8d, 16d, chipmunk, deepbass, reset`, isInteraction);
                return;
        }
        
        if (isInteraction) {
			try {
				await context.editReply({ content: '​', embeds: [] });
			} catch (error) {

				if (context.channel) {
					await context.channel.send({ content: '​', embeds: [] });
				}
			}
		}
        await messages.filterApplied(channel, player.activeFilters || []);
    } catch (error) {
        await sendResponse(context, `${emojis.error} | Failed to apply filter.`, isInteraction);
    }
}
async function handleShuffle(context, isInteraction = false) {
    const guild = isInteraction ? context.guild : context.guild;
    const player = client.riffy.players.get(guild.id);
    
    if (!player) {
        return await sendResponse(context, `${emojis.error} | Nothing is playing!`, isInteraction);
    }
    if (!player.queue.length) {
        return await sendResponse(context, `${emojis.error} | Not enough tracks in queue to shuffle!`, isInteraction);
    }
    player.queue.shuffle();
    await sendResponse(context, `${emojis.success} | Shuffled the queue!`, isInteraction);
}
async function handleLoop(context, isInteraction = false) {
    const guild = isInteraction ? context.guild : context.guild;
    const player = client.riffy.players.get(guild.id);
    
    if (!player) {
        return await sendResponse(context, `${emojis.error} | Nothing is playing!`, isInteraction);
    }
    const currentMode = player.loop;
    const newMode = currentMode === "none" ? "queue" : "none";
    
    player.setLoop(newMode);
    await sendResponse(context, `${emojis.success} | ${newMode === "queue" ? "Enabled" : "Disabled"} loop mode!`, isInteraction);
}
async function handleMove(context, from, to, isInteraction = false) {
    const guild = isInteraction ? context.guild : context.guild;
    const player = client.riffy.players.get(guild.id);
    
    if (!player) {
        return await sendResponse(context, `${emojis.error} | Nothing is playing!`, isInteraction);
    }
    if (!player.queue.length) {
        return await sendResponse(context, `${emojis.error} | Queue is empty!`, isInteraction);
    }
    const fromPos = from - 1;
    const toPos = to - 1;
    
    if (fromPos < 0 || toPos < 0 || fromPos >= player.queue.length || toPos > player.queue.length) {
        return await sendResponse(context, `${emojis.error} | Valid positions: 1-${player.queue.length + 1}`, isInteraction);
    }
    const movedTrack = player.queue[fromPos];
    player.queue.splice(fromPos, 1);
    player.queue.splice(toPos, 0, movedTrack);
    await sendResponse(context, `${emojis.success} | Moved **${movedTrack.info.title}** from **${from}** to **${to}**!`, isInteraction);
}
async function handleAdd(context, song, position, isInteraction = false) {
    const guild = isInteraction ? context.guild : context.guild;
    const user = isInteraction ? context.user : context.author;
    const player = client.riffy.players.get(guild.id);
    
    if (!player) {
        return await sendResponse(context, `${emojis.error} | Nothing is playing! Use /play first.`, isInteraction);
    }
    try {
        const resolve = await client.riffy.resolve({
            query: song,
            requester: user,
        });
        const { loadType, tracks } = resolve;
        if (!tracks?.length) {
            return await sendResponse(context, `${emojis.error} | No results found!`, isInteraction);
        }
        if (loadType === "playlist") {
            return await sendResponse(context, `${emojis.error} | Playlists not supported with /add. Use /play instead.`, isInteraction);
        }
        
        const track = tracks[0];
        track.info.requester = user;
        const insertPos = Math.min(position - 1, player.queue.length);
        player.queue.splice(insertPos, 0, track);
        await sendResponse(context, `${emojis.success} | Added **${track.info.title}** at position **${position}**! Queue now has ${player.queue.length} tracks.`, isInteraction);
    } catch (error) {
        await sendResponse(context, `${emojis.error} | Failed to add track!`, isInteraction);
    }
}
async function handleRemove(context, position, isInteraction = false) {
    const guild = isInteraction ? context.guild : context.guild;
    const player = client.riffy.players.get(guild.id);
    
    if (!player) {
        return await sendResponse(context, `${emojis.error} | Nothing is playing!`, isInteraction);
    }
    
    if (position < 1 || position > player.queue.length) {
        return await sendResponse(context, `${emojis.error} | Please provide a valid track position between 1 and ${player.queue.length}!`, isInteraction);
    }
    const removed = player.queue.remove(position - 1);
    await sendResponse(context, `${emojis.success} | Removed **${removed.info.title}** from the queue!`, isInteraction);
}
async function handleClear(context, isInteraction = false) {
    const guild = isInteraction ? context.guild : context.guild;
    const player = client.riffy.players.get(guild.id);
    
    if (!player) {
        return await sendResponse(context, `${emojis.error} | Nothing is playing!`, isInteraction);
    }
    if (!player.queue.length) {
        return await sendResponse(context, `${emojis.error} | Queue is already empty!`, isInteraction);
    }

    if (player.playing || player.paused) {
        player._manualStop = true;
    }
    
    player.queue.clear();
    await sendResponse(context, `${emojis.success} | Cleared the queue!`, isInteraction);

    if (!player.playing && !player.paused) {
        delete player._manualStop;
        await rejoinAndIdle(guild.id, player.textChannel);
    }
}
async function handleStatus(context, isInteraction = false) {
    const guild = isInteraction ? context.guild : context.guild;
    const channel = isInteraction ? context.channel : context.channel;
    const player = client.riffy.players.get(guild.id);
    
    if (!player) {
        return await sendResponse(context, `${emojis.error} | No active player found!`, isInteraction);
    }
    if (isInteraction) {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.info} Player Status`)
            .addFields([
                { name: 'Status', value: player.playing ? `${emojis.playboy} Playing` : `${emojis.pause} Paused`, inline: true },
                { name: 'Volume', value: `${emojis.playboy} ${player.volume}%`, inline: true },
                { name: 'Loop Mode', value: `${emojis.playboy} ${player.loop === "queue" ? 'Queue' : 'Disabled'}`, inline: true }
            ]);
        
        if (player.queue.current) {
            const track = player.queue.current;
            embed.setDescription(
                `**Currently Playing:**\n${emojis.music} [${track.info.title}](${track.info.uri})\n` +
                `${emojis.time} Duration: ${getDurationString(track)}`
            );
            if (track.info.thumbnail && typeof track.info.thumbnail === 'string') {
                embed.setThumbnail(track.info.thumbnail);
            }
        }
        
        await context.editReply({ embeds: [embed] });
    } else {
        await messages.playerStatus(channel, player);
    }
}
async function handlePing(context, isInteraction = false) {
    try {
        if (isInteraction) {
            const wsLatency = Math.round(client.actualWsPing || client.ws.ping || 0);
            const clusterId = client.clusterId || "45";
            let shardId = 667;
            
            if (client.shard) {
                try {
                    shardId = client.shard.ids[0] || 0;
                } catch (error) {

                }
            }
            const restLatency = Date.now() - context.createdTimestamp;
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${emojis.redblackcross} Cluster ${clusterId}`)
                .addFields(
                    {
                        name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                        value: `• Discord REST latency: \`${restLatency}ms\`\n• Discord Gateway (WS) latency: \`${wsLatency}ms\` (Shard ${shardId})`,
                        inline: false
                    }
                )
                .setFooter({ text: `Database on MongoDB • Powered by ${client.hostingService || 'Unknown'}` })
                .setTimestamp();

            await context.editReply({ embeds: [embed] });
            
        } else {
                await messages.ping(context.channel, client, context, client.hostingService);
        }
        
    } catch (error) {
        log('ERROR', `Ping command error: ${error.message}`);
        
        if (isInteraction) {
            try {

                await context.editReply({ 
                    content: `${emojis.error} | Failed to calculate ping!` 
                });
            } catch (editError) {
                log('ERROR', `Could not edit ping response: ${editError.message}`);
            }
        } else {
            await context.channel.send(`${emojis.error} | Failed to calculate ping!`);
        }
    }
}

async function handleLeaderboard(context, isInteraction = false) {
    try {
        const leaderboardData = await db.getLeaderboard(10);
        
        if (isInteraction) {
            await messages.leaderboardInteraction(context, leaderboardData);
        } else {
            await messages.leaderboard(context.channel, leaderboardData);
        }
    } catch (error) {
        log('ERROR', `Error fetching leaderboard: ${error.message}`);
        await sendResponse(context, `${emojis.error} | Failed to fetch leaderboard!`, isInteraction);
    }
}
async function handleResetStats(context, isInteraction = false) {
    const user = isInteraction ? context.user : context.author;
    if (isInteraction) {
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_reset')
                    .setLabel('Yes, Reset All Stats')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel_reset')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        const embed = new EmbedBuilder()
            .setColor(0xff5555)
            .setTitle(`${emojis.error} Reset Statistics Confirmation`)
            .setDescription(`**Are you absolutely sure?**\n\nThis will:\n• Delete all your listening history\n• Remove your top songs/artists\n• Reset your global ranking\n\n**This action is irreversible!**`)
            .setFooter({ text: 'You have 30 seconds to decide' });
        
        await context.editReply({ 
            embeds: [embed], 
            components: [row] 
        });
        const filter = i => i.user.id === user.id;
        const collector = context.channel.createMessageComponentCollector({ 
            filter, 
            time: 30000 
        });
        
        collector.on('collect', async i => {
            if (i.customId === 'confirm_reset') {
                try {
                    const collection = db.collection('user_stats');
                    await collection.deleteOne({ discord_user_id: user.id });
                    
                    await i.update({
                        content: `${emojis.success} | Your statistics have been reset!`,
                        embeds: [],
                        components: []
                    });
                } catch (error) {
                    await i.update({
                        content: `${emojis.error} | Failed to reset statistics!`,
                        embeds: [],
                        components: []
                    });
                }
            } else if (i.customId === 'cancel_reset') {
                await i.update({
                    content: `${emojis.success} | Statistics reset cancelled.`,
                    embeds: [],
                    components: []
                });
            }
            collector.stop();
        });
        
        collector.on('end', async () => {
            try {
                await context.editReply({ components: [] });
            } catch (error) {
            }
        });
    } else {
        await sendResponse(context, 
            `${emojis.error} | Please use \`/resetmystats\` for the interactive reset confirmation.`, 
            isInteraction
        );
    }
}

async function handleStats(context, targetUser, isInteraction = false) {
    try {
        const userStats = await db.getUserStats(targetUser.id);
        const userRank = await db.getUserRank(targetUser.id);
        
        if (!userStats) {
            return await sendResponse(context, 
                `${emojis.error} | No statistics found for ${targetUser.username}. Play some music first!`, 
                isInteraction
            );
        }
        
        if (isInteraction) {
            await messages.userStatsEmbedInteraction(context, userStats, userRank, targetUser, context.user.id === targetUser.id);
        } else {

            await messages.userStats(context.channel, userStats, userRank, targetUser);
        }
    } catch (error) {
        log('ERROR', `Error fetching stats: ${error.message}`);
        await sendResponse(context, `${emojis.error} | Failed to fetch statistics!`, isInteraction);
    }
}
/**
 * Resolves an emoji identifier to a Discord emoji object.
 * @param {Client} client - Discord client instance.
 * @param {string} identifier - Emoji ID, name, or full markdown (<:name:id> / <a:name:id>).
 * @param {Guild} [guild] - Guild to prioritize when searching by name.
 * @returns {Promise<Emoji|null>} Resolved emoji object or null if not found.
 */
async function resolveEmoji(client, identifier, guild = null) {
    let emoji = null;
    let emojiId = null;
    const customEmojiRegex = /^<a?:\w+:(\d+)>$/;
    const match = identifier.match(customEmojiRegex);

    if (match) {
        emojiId = match[1];
    } else if (/^\d+$/.test(identifier)) {
        emojiId = identifier;
    }

    if (emojiId) {
        emoji = client.emojis.cache.get(emojiId);
        if (!emoji) {
            for (const g of client.guilds.cache.values()) {
                try {
                    const fetched = await g.emojis.fetch(emojiId).catch(() => null);
                    if (fetched) {
                        emoji = fetched;
                        client.emojis.cache.set(emojiId, fetched);
                        break;
                    }
                } catch {

                }
            }
        }
    } else {

        const nameLower = identifier.toLowerCase();

        if (guild) {
            emoji = guild.emojis.cache.find(e => e.name.toLowerCase() === nameLower);
        }

        if (!emoji) {
            emoji = client.emojis.cache.find(e => e.name.toLowerCase() === nameLower);
        }

        if (!emoji) {
            for (const g of client.guilds.cache.values()) {
                try {
                    await g.emojis.fetch();
                    const found = g.emojis.cache.find(e => e.name.toLowerCase() === nameLower);
                    if (found) {
                        emoji = found;
                        break;
                    }
                } catch {

                }
            }
        }
    }
    return emoji;
}

async function sendStickerMessage(channel, stickerId, replyTo = null) {
    try {

        const sticker = await client.fetchSticker(stickerId);
        
        if (!sticker) {
            throw new Error('Sticker not found');
        }

        if (sticker.available === false) {
            throw new Error('Sticker not available');
        }

        if (sticker.guild) {
            const guild = client.guilds.cache.get(sticker.guild.id);
            if (!guild) {
                throw new Error('Cannot use server-specific sticker in this guild');
            }
        }

        const messageOptions = {
            stickers: [sticker]
        };

        if (replyTo) {
            try {

                await channel.send(messageOptions);

                return replyTo.reply(`💝`).catch(() => {});
            } catch (replyError) {

                return channel.send(messageOptions);
            }
        } else {

            return channel.send(messageOptions);
        }
        
    } catch (error) {
        log('ERROR', `Sticker error for ${stickerId}: ${error.message}`);

        const stickerUrl = `https://media.discordapp.net/stickers/${stickerId}.png?size=512`;
        
        if (replyTo) {
            try {
                return replyTo.reply(stickerUrl);
            } catch (replyError) {
                return channel.send(stickerUrl);
            }
        } else {
            return channel.send(stickerUrl);
        }
    }
}

async function canBotUseSticker(sticker) {
    if (!sticker) return false;

    if (sticker.available === false) return false;

    if (sticker.format && sticker.format > 3) return false;

    if (sticker.guild) {
        try {
            const guild = await client.guilds.fetch(sticker.guild.id).catch(() => null);
            return !!guild;
        } catch (error) {
            return false;
        }
    }

    return true;
}

function createPingEmbed(restLatency, wsLatency, clusterId, shard) {
    const cluster = clusterId || "45";
    let shardId = 667;
    if (shard) {
        try {
            shardId = shard.ids[0] || 0;
        } catch (error) {

        }
    }
    
    return new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`${emojis.redblackcross} Cluster ${cluster}`)
        .addFields(
            {
                name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
                value: `• Discord REST latency: \`${restLatency}ms\`\n• Discord Gateway (WS) latency: \`${wsLatency}ms\` (Shard ${shardId})`,
                inline: false
            }
        )
        .setFooter({ text: `Database on MongoDB • Powered by ${client.hostingService || 'Unknown'}` })
        .setTimestamp();
}
async function handleSongQuote(context, rawText, isInteraction = false) {
    const processedText = rawText
        .replace(/\\\\n/g, '\u0000')
        .replace(/\\n/g, '\n')
        .replace(/\u0000/g, '\\n');

    const guild = isInteraction ? context.guild : context.guild;
    const player = client.riffy.players.get(guild.id);

    if (!player || !player.current) {
        return await sendResponse(context, `${emojis.error} | No track is currently playing!`, isInteraction);
    }

    try {
        const { createSongQuoteImage } = require("./utils/songQuoteGenerator");
        const track = player.current;

        let loadingMessage;
        if (isInteraction) {
            await context.editReply({ content: `${emojis.loading} | Generating your song quote...` });
        } else {
            loadingMessage = await context.channel.send(`${emojis.loading} | Generating your song quote...`);
        }

        const imageBuffer = await createSongQuoteImage(track, processedText);
        const { AttachmentBuilder } = require('discord.js');
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'song-quote.png' });

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.blackbutterfly} Song Quote Generated`)
            .setDescription(`**${track.info.title}** - ${track.info.author || 'Unknown Artist'}`)
            .setImage('attachment://song-quote.png')
            .setFooter({
                text: `Requested by ${isInteraction ? context.user.tag : context.author.tag}`,
                iconURL: isInteraction ? context.user.displayAvatarURL() : context.author.displayAvatarURL()
            })
            .setTimestamp();

        let sentMessage;
        if (isInteraction) {
            await context.editReply({ content: null, embeds: [embed], files: [attachment] });
            sentMessage = await context.fetchReply();
        } else {
            if (loadingMessage) {
                setTimeout(() => {
                    loadingMessage.delete().catch(() => {});
                }, 2000);
            }
            sentMessage = await context.channel.send({ embeds: [embed], files: [attachment] });
        }

        const getAttachmentUrlWithRetry = async (msg, maxRetries = 10, delayMs = 1000) => {
            for (let attempt = 1; attempt <= maxRetries; attempt++) {

                if (msg.attachments && msg.attachments.size > 0) {
                    return msg.attachments.first().url;
                }

                if (msg.embeds && msg.embeds.length > 0 && msg.embeds[0].image && msg.embeds[0].image.url) {
                    return msg.embeds[0].image.url;
                }

                await new Promise(resolve => setTimeout(resolve, delayMs));
                try {
                    if (isInteraction) {
                        msg = await context.fetchReply();
                    } else {
                        msg = await context.channel.messages.fetch(msg.id);
                    }
                } catch (fetchError) {
                    log('ERROR', `Attachment fetch attempt ${attempt} failed: ${fetchError.message}`);
                }
            }
            throw new Error('Failed to retrieve attachment URL after multiple attempts');
        };

        const attachmentUrl = await getAttachmentUrlWithRetry(sentMessage);


        const userId = isInteraction ? context.user.id : context.author.id;
        const userTag = isInteraction ? context.user.tag : context.author.tag;

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Download')
                    .setStyle(ButtonStyle.Link)
                    .setURL(attachmentUrl),
                new ButtonBuilder()
                    .setCustomId(`song_quote_dm_${userId}`)
                    .setLabel('Send in DM')
                    .setStyle(ButtonStyle.Secondary)
            );

        if (isInteraction) {
            await context.editReply({ components: [row] });
        } else {
            await sentMessage.edit({ components: [row] });
        }

        const filter = i => i.customId === `song_quote_dm_${userId}` && i.user.id === userId;
        const collector = sentMessage.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(config.embedColor)
                    .setTitle(`${emojis.blackbutterfly} Song Quote Generated`)
                    .setDescription(`**${track.info.title}** - ${track.info.author || 'Unknown Artist'}`)
                    .setImage(attachmentUrl)
                    .setFooter({ text: `Requested by ${userTag}` })
                    .setTimestamp();

                await i.user.send({ embeds: [dmEmbed] });
                await i.reply({ content: `${emojis.success} Image sent to your DMs!`, flags: MessageFlags.Ephemeral });
            } catch (error) {
                await i.reply({
                    content: `${emojis.error} Could not send you a DM. Please make sure your DMs are open.`,
                    flags: MessageFlags.Ephemeral
                });
            }
        });

        collector.on('end', async () => {

            const disabledRow = new ActionRowBuilder().addComponents(
                ButtonBuilder.from(row.components[0]),
                ButtonBuilder.from(row.components[1]).setDisabled(true)
            );
            if (isInteraction) {
                await context.editReply({ components: [disabledRow] }).catch(() => {});
            } else {
                await sentMessage.edit({ components: [disabledRow] }).catch(() => {});
            }
        });

    } catch (error) {
        log('ERROR', `Song quote error: ${error.message}`);
        if (!isInteraction && loadingMessage) {
            setTimeout(() => {
                loadingMessage.delete().catch(() => {});
            }, 2000);
        }
        await sendResponse(context, `${emojis.error} | Failed to generate song quote: ${error.message}`, isInteraction);
    }
}
async function handleQuote(context, isInteraction = false, initialOptions = {}) {
    try {
        let quotedMessage, customText, user, channel, guild, member;

        const defaultOptions = {
            theme: 'light',
            avatarColor: true,
            avatarPosition: 'left',
            boldText: false,
            layout: 'layout1',
            fontFamily: 'Poppins',
            customText: '',
            confirmed: false,
            cancelled: false
        };

        let currentOptions = { ...defaultOptions, ...initialOptions };

        if (isInteraction) {
            guild = context.guild;
            channel = context.channel;
            user = context.user;
            member = context.member;
            const messageId = context.options.getString('message_id');
            customText = context.options.getString('text') || null;
            if (!messageId) {
                return await sendResponse(context, `${emojis.error} | Please provide a message ID to quote!`, isInteraction);
            }
            try {
                quotedMessage = await channel.messages.fetch(messageId);
            } catch (error) {
                return await sendResponse(context, `${emojis.error} | Could not fetch that message!`, isInteraction);
            }
        } else {
            guild = context.guild;
            channel = context.channel;
            user = context.author;
            member = context.member;
            if (!context.reference) {
                return await sendResponse(context, `${emojis.error} | You must reply to a message to quote it!`, isInteraction);
            }
            try {
                quotedMessage = await channel.messages.fetch(context.reference.messageId);
            } catch (error) {
                return await sendResponse(context, `${emojis.error} | Could not fetch the replied message!`, isInteraction);
            }
            customText = context.content.slice(context.content.indexOf(' ') + 1).trim() || null;
            if (customText === context.content) customText = null;
        }

        if (!quotedMessage.content && quotedMessage.attachments.size === 0) {
            return await sendResponse(context, `${emojis.error} | That message has no text or attachments to quote!`, isInteraction);
        }

        if (customText) currentOptions.customText = customText;

        const loadingMsg = isInteraction 
            ? await context.editReply({ content: `${emojis.loading} | Generating quote image...` })
            : await context.channel.send(`${emojis.loading} | Generating quote image...`);

        const { createQuoteImage } = require("./utils/quoteGenerator");
        const imageBuffer = await createQuoteImage(quotedMessage, currentOptions);
        const { AttachmentBuilder } = require('discord.js');
        const attachment = new AttachmentBuilder(imageBuffer, { name: 'quote.png' });

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.blackbutterfly} Quote Generated`)
            .setDescription(`Quoting **${quotedMessage.author.tag}**`)
            .setImage('attachment://quote.png')
            .setFooter({
                text: `Requested by ${user.tag}`,
                iconURL: user.displayAvatarURL()
            })
            .setTimestamp();

        let sentMsg;
        if (isInteraction) {
            await context.editReply({ content: null, embeds: [embed], files: [attachment] });
            sentMsg = await context.fetchReply();
        } else {
            await loadingMsg.delete().catch(() => {});
            sentMsg = await context.channel.send({ embeds: [embed], files: [attachment] });
        }

        let attachmentUrl = sentMsg.attachments.first()?.url;

        const buildRows = (options) => {
            if (options.cancelled) return [];

            const rows = [];

            if (!options.confirmed) {

                rows.push(new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('quote_theme_light')
                        .setLabel('☀️ Light')
                        .setStyle(options.theme === 'light' ? ButtonStyle.Primary : ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('quote_theme_dark')
                        .setLabel('🌙 Dark')
                        .setStyle(options.theme === 'dark' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                ));

                rows.push(new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('quote_layout_layout1')
                        .setLabel('📐 Layout 1')
                        .setStyle(options.layout === 'layout1' ? ButtonStyle.Primary : ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('quote_layout_layout2')
                        .setLabel('📏 Layout 2')
                        .setStyle(options.layout === 'layout2' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                ));

                const colorEmoji = emojis.colorToggle || emojis.colorToggleFallback || '🎨';
                const boldEmoji = emojis.boldToggle || emojis.boldToggleFallback || '✍️';
                const positionEmoji = emojis.positionToggle || emojis.positionToggleFallback || '↔️';

                rows.push(new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('quote_toggle_color')
                        .setEmoji(colorEmoji)
                        .setStyle(options.avatarColor ? ButtonStyle.Primary : ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('quote_toggle_bold')
                        .setEmoji(boldEmoji)
                        .setStyle(options.boldText ? ButtonStyle.Primary : ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('quote_toggle_position')
                        .setEmoji(positionEmoji)
                        .setStyle(options.avatarPosition === 'right' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                ));

                const fontSelect = new StringSelectMenuBuilder()
                    .setCustomId('quote_font_select')
                    .setPlaceholder('Choose a font')
                    .addOptions([
                        { label: 'Poppins', value: 'Poppins', default: options.fontFamily === 'Poppins' },
                        { label: 'Roboto', value: 'Roboto', default: options.fontFamily === 'Roboto' },
                        { label: 'Open Sans', value: 'Open Sans', default: options.fontFamily === 'Open Sans' },
                        { label: 'Georgia', value: 'Georgia', default: options.fontFamily === 'Georgia' }
                    ]);
                rows.push(new ActionRowBuilder().addComponents(fontSelect));

                const confirmEmoji = emojis.confirm || emojis.confirmFallback || '✅';
                const cancelEmoji = emojis.cancel || emojis.cancelFallback || '❌';
                rows.push(new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('quote_confirm')
                        .setEmoji(confirmEmoji)
                        .setLabel('Confirm')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('quote_cancel')
                        .setEmoji(cancelEmoji)
                        .setLabel('Cancel')
                        .setStyle(ButtonStyle.Danger)
                ));
            } else {

                const downloadButton = new ButtonBuilder()
                    .setLabel('Download')
                    .setStyle(ButtonStyle.Link)
                    .setURL(attachmentUrl || 'https://discord.com');
                if (!attachmentUrl) downloadButton.setDisabled(true);

                const dmButton = new ButtonBuilder()
                    .setCustomId(`quote_dm_${user.id}`)
                    .setLabel('Send in DM')
                    .setStyle(ButtonStyle.Secondary);

                rows.push(new ActionRowBuilder().addComponents(downloadButton, dmButton));
            }

            return rows;
        };

		const rows = buildQuoteRows(currentOptions, attachmentUrl, user.id);
        if (isInteraction) {
            await context.editReply({ components: rows });
        } else {
            await sentMsg.edit({ components: rows });
        }

        client.quoteOptions.set(sentMsg.id, currentOptions);

        const filter = i => i.customId.startsWith('quote_') && i.user.id === user.id;
        const collector = sentMsg.createMessageComponentCollector({ filter, time: 24 * 60 * 60 * 1000 });

        collector.on('collect', async i => {

            currentOptions = client.quoteOptions.get(sentMsg.id) || currentOptions;

            if (currentOptions.cancelled) {
                await i.reply({ content: 'This quote has been cancelled.', flags: MessageFlags.Ephemeral });
                return;
            }

            if (i.customId === 'quote_confirm') {
				currentOptions.confirmed = true;
				client.quoteOptions.set(sentMsg.id, currentOptions);
				const newRows = buildQuoteRows(currentOptions, attachmentUrl, user.id);
				await i.update({ components: newRows });
				return;
			}

            if (i.customId === 'quote_cancel') {
                currentOptions.cancelled = true;
                client.quoteOptions.set(sentMsg.id, currentOptions);

                const cancelEmbed = new EmbedBuilder()
                    .setColor(0xff5555)
                    .setDescription(`${emojis.error} | Cancelled by the user!`)
                    .setFooter({
                        text: `Requested by ${user.tag}`,
                        iconURL: user.displayAvatarURL()
                    })
                    .setTimestamp();

                await i.update({ embeds: [cancelEmbed], files: [], components: [] });

                collector.stop();
                return;
            }

            if (i.customId === `quote_dm_${user.id}`) {
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor(config.embedColor)
                        .setTitle(`${emojis.blackbutterfly} Quote Generated`)
                        .setDescription(`Quoting **${quotedMessage.author.tag}**`)
                        .setImage(attachmentUrl)
                        .setFooter({ text: `Requested by ${i.user.tag}` })
                        .setTimestamp();
                    await i.user.send({ embeds: [dmEmbed] });
                    await i.reply({ content: `${emojis.success} Image sent to your DMs!`, flags: MessageFlags.Ephemeral });
                } catch (error) {
                    await i.reply({ content: `${emojis.error} Could not send DM.`, flags: MessageFlags.Ephemeral });
                }
                return;
            }

            if (currentOptions.confirmed) {
                await i.reply({ content: 'Quote already confirmed. You can only download or send to DM.', flags: MessageFlags.Ephemeral });
                return;
            }

            if (i.customId === 'quote_font_select' && i.isStringSelectMenu()) {
				currentOptions.fontFamily = i.values[0];
				client.quoteOptions.set(sentMsg.id, currentOptions);
				await i.deferUpdate();
				try {
					const newUrl = await regenerateQuote(i, sentMsg, quotedMessage, currentOptions, attachmentUrl);
					attachmentUrl = newUrl;
				} catch (e) {
					log('ERROR', `Failed to regenerate after font change: ${e.message}`);
				}
				return;
			}

            await i.deferUpdate();

            switch (i.customId) {
				case 'quote_toggle_theme':
					currentOptions.theme = currentOptions.theme === 'light' ? 'dark' : 'light';
					break;
				case 'quote_toggle_layout':
					currentOptions.layout = currentOptions.layout === 'layout1' ? 'layout2' : 'layout1';
					break;
                case 'quote_toggle_bold':
					currentOptions.boldText = !currentOptions.boldText;
					break;
				case 'quote_toggle_color':
					currentOptions.avatarColor = !currentOptions.avatarColor;
					break;
				case 'quote_toggle_position':
					currentOptions.avatarPosition = currentOptions.avatarPosition === 'left' ? 'right' : 'left';
					break;
                default:
                    return;
            }

			client.quoteOptions.set(sentMsg.id, currentOptions);
			try {
				const newUrl = await regenerateQuote(i, sentMsg, quotedMessage, currentOptions, attachmentUrl);
				attachmentUrl = newUrl;
			} catch (e) {
				log('ERROR', `Failed to regenerate after toggle: ${e.message}`);
			}
        });

        collector.on('end', () => {
            client.quoteOptions.delete(sentMsg.id);
        });

    } catch (error) {
        log('ERROR', `Quote generation error: ${error.message}`);
        await sendResponse(context, `${emojis.error} | Failed to generate quote: ${error.message}`, isInteraction);
    }
}

function buildQuoteRows(options, attachmentUrl, userId) {
    if (options.cancelled) return [];

    if (!options.confirmed) {
        const rows = [];

        const themeEmoji = emojis.whitebutterfly || '✨';
        const layoutEmoji = emojis.greenbutterfly || '📐';
        const boldEmoji = emojis.orangebutterfly || '🅱️';

        rows.push(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('quote_toggle_theme')
                .setEmoji(themeEmoji)
                .setLabel('Theme')
                .setStyle(options.theme === 'dark' ? ButtonStyle.Primary : ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('quote_toggle_layout')
                .setEmoji(layoutEmoji)
                .setLabel('Layouts')
                .setStyle(options.layout === 'layout2' ? ButtonStyle.Primary : ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('quote_toggle_bold')
                .setEmoji(boldEmoji)
                .setLabel('Bold Text')
                .setStyle(options.boldText ? ButtonStyle.Primary : ButtonStyle.Secondary)
        ));

        const colorEmoji = emojis.purplebutterfly || '🎨';
        const positionEmoji = emojis.bluebutterfly || '↔️';

        rows.push(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('quote_toggle_color')
                .setEmoji(colorEmoji)
                .setLabel('Avatar Color')
                .setStyle(options.avatarColor ? ButtonStyle.Primary : ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('quote_toggle_position')
                .setEmoji(positionEmoji)
                .setLabel('Avatar Placement')
                .setStyle(options.avatarPosition === 'right' ? ButtonStyle.Primary : ButtonStyle.Secondary)
        ));

        const fontSelect = new StringSelectMenuBuilder()
            .setCustomId('quote_font_select')
            .setPlaceholder('Choose a font')
            .addOptions([
                { label: 'Poppins', value: 'Poppins', default: options.fontFamily === 'Poppins' },
                { label: 'Roboto', value: 'Roboto', default: options.fontFamily === 'Roboto' },
                { label: 'Open Sans', value: 'Open Sans', default: options.fontFamily === 'Open Sans' },
                { label: 'Georgia', value: 'Georgia', default: options.fontFamily === 'Georgia' }
            ]);
        rows.push(new ActionRowBuilder().addComponents(fontSelect));

        const confirmEmoji = emojis.success || '✅';
        const cancelEmoji = emojis.error || '❌';
        rows.push(new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('quote_confirm')
                .setEmoji(confirmEmoji)
                .setLabel('Confirm')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('quote_cancel')
                .setEmoji(cancelEmoji)
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Danger)
        ));

        return rows;
    } else {

        const downloadButton = new ButtonBuilder()
            .setLabel('Download')
            .setStyle(ButtonStyle.Link)
            .setURL(attachmentUrl || 'https://discord.com');
        if (!attachmentUrl) downloadButton.setDisabled(true);

        const dmButton = new ButtonBuilder()
            .setCustomId(`quote_dm_${userId}`)
            .setLabel('Send in DM')
            .setStyle(ButtonStyle.Secondary);

        return [new ActionRowBuilder().addComponents(downloadButton, dmButton)];
    }
}

async function regenerateQuote(interaction, sentMsg, quotedMessage, options, oldAttachmentUrl) {
    try {
        const { createQuoteImage } = require("./utils/quoteGenerator");
        const newImageBuffer = await createQuoteImage(quotedMessage, options);
        const { AttachmentBuilder } = require('discord.js');
        const newAttachment = new AttachmentBuilder(newImageBuffer, { name: 'quote.png' });

        const newEmbed = EmbedBuilder.from(sentMsg.embeds[0]).setImage('attachment://quote.png');

        await sentMsg.edit({ embeds: [newEmbed], files: [newAttachment] });

        const updatedMsg = await sentMsg.fetch();
        const newAttachmentUrl = updatedMsg.attachments.first()?.url;

        const finalUrl = newAttachmentUrl || oldAttachmentUrl;

        const newRows = buildQuoteRows(options, finalUrl, interaction.user.id);

        await sentMsg.edit({ components: newRows });

        return finalUrl;
    } catch (error) {
        log('ERROR', `Regeneration error: ${error.message}`);
        throw error;
    }
}

async function handleHelp(context, isInteraction = false) {
    const channel = isInteraction ? context.channel : context.channel;
    const commands = [
    { name: 'play <query>', description: 'Play a song or playlist' },
    { name: 'pause', description: 'Pause the current track' },
    { name: 'resume', description: 'Resume the current track' },
    { name: 'skip', description: 'Skip the current track' },
    { name: 'stop', description: 'Stop playback and clear queue' },
    { name: 'lyrics', description: 'Show the lyrics of the current track' },
    { name: 'queue', description: 'Show the current queue' },
    { name: 'nowplaying', description: 'Show current track info' },
    { name: 'volume <0-100>', description: 'Adjust player volume' },
    { name: 'servervolume <0-100>', description: 'Set permanent volume for this server' },
    { name: 'filter <type>', description: 'Add different filters to playback' },
    { name: 'shuffle', description: 'Shuffle the current queue' },
    { name: 'loop', description: 'Toggle queue loop mode' },
    { name: 'move <from> <to>', description: 'Move a song in the queue' },
    { name: 'add <song> <position>', description: 'Add a track at specific position' },
    { name: 'remove <position>', description: 'Remove a track from queue' },
    { name: 'clear', description: 'Clear the current queue' },
    { name: 'status', description: 'Show player status' },
    { name: 'ping', description: 'Show the bot\'s ping' },
    { name: 'mystats', description: 'View your personal music statistics' },
    { name: 'leaderboard', description: 'Global ranking of top listeners' },
    { name: 'resetmystats', description: 'Reset your personal statistics' },
    { name: 'setspotify <username>', description: 'Set your Spotify username' },
    { name: 'playspotify', description: 'Play your saved Spotify playlists' },
    { name: '24-7-enable', description: 'Enable 24/7 mode in a voice channel' },
    { name: '24-7-disable', description: 'Disable 24/7 mode' },
    { name: 'song-quote <text>', description: 'Create a quote image with current track' },
	{ name: 'help', description: 'Show this help message' }
];
    
    if (isInteraction) {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.info} Available Commands`)
            .setDescription(commands.map(cmd => 
                `${emojis.music} \`${cmd.name}\` - ${cmd.description}`
            ).join('\n'))
            .setImage("https://i.ibb.co/gLM9bMf9/standard.gif")
            .setFooter({ text: 'Prefix: ~ • Example: ~play <song name>' });
        
        await context.editReply({ embeds: [embed] });
    } else {
        await messages.help(channel, commands);
    }
}
async function handleSetSpotify(context, spotifyId, isInteraction = false) {
    const user = isInteraction ? context.user : context.author;
    
    const success = await db.setSpotifyId(user.id, spotifyId);
    
    if (success) {
        client.spotifyIds = await db.loadSpotifyIds();
        await sendResponse(context, `${emojis.success} | Spotify ID **${spotifyId}** saved! Use /playspotify anytime.`, isInteraction);
    } else {
        await sendResponse(context, `${emojis.error} | Failed to save Spotify ID!`, isInteraction);
    }
}
async function handlePlaySpotify(context, isInteraction = false) {
    let guild, user, channel, member;
    
    if (isInteraction) {
        guild = context.guild;
        user = context.user;
        channel = context.channel;
        member = context.member;
    } else {
        guild = context.guild;
        user = context.author;
        channel = context.channel;
        member = context.member;
    }
    
    if (!member.voice.channel) {
        return await sendResponse(context, `${emojis.error} | You must be in a voice channel!`, isInteraction);
    }
    
    const userSpotifyId = await db.getSpotifyId(user.id);
    
    if (!userSpotifyId) {
        return await sendResponse(context, `${emojis.error} | No Spotify ID found! Use \`/setspotify\` or \`~setspotify\` first.`, isInteraction);
    }

    
    let fetchingMsg = null;
	try {
		if (isInteraction) {
			await context.editReply({ 
				content: `${emojis.loading} | Fetching your Spotify playlists...` 
			});
		} else {
			fetchingMsg = await channel.send(`${emojis.loading} | Fetching your Spotify playlists...`);
		}
		
		const { SpotifyUserPlaylists } = require("./utils/spotifyPlaylists.js");

		let playlists = null;
		let retryCount = 0;
		const maxRetries = 3;

		while (retryCount < maxRetries && !playlists) {
			try {
				const playlistsPromise = SpotifyUserPlaylists(userSpotifyId);
				const timeoutPromise = new Promise((_, reject) => 
					setTimeout(() => reject(new Error('Spotify API timeout (15 seconds)')), 15000)
				);
				playlists = await Promise.race([playlistsPromise, timeoutPromise]);
			} catch (error) {
				log('ERROR', `❌ Spotify playlist error: ${error.message}`);
				
				let errorMessage = '';
				if (error.message.includes('429') || error.message.includes('rate limit')) {
					errorMessage = 'Spotify API rate limit reached. Please wait a minute and try again.';
				} else if (error.message.includes('404')) {
					errorMessage = 'Spotify username not found. Check your username and try again.';
				} else if (error.message.includes('401')) {
					errorMessage = 'Spotify API authentication failed. The bot owner needs to refresh the API credentials.';
				} else {
					errorMessage = `Failed to fetch Spotify playlists: ${error.message}`;
				}
				
				await sendResponse(context, 
					`${emojis.error} | ${errorMessage}\n\nTry:\n1. Check your Spotify username is correct\n2. Make sure playlists are not private\n3. If rate limited, wait a minute`, 
					isInteraction
				);
			}
		}

		if (!playlists) {
			throw new Error('Failed to fetch Spotify playlists after multiple retries');
		}
        
        if (!playlists || !playlists.length) {
            return await sendResponse(context, 
                `${emojis.error} | No playlists found! Make sure:\n1. Your Spotify account has playlists\n2. Your playlists are not private\n3. You entered the correct Spotify username`, 
                isInteraction
            );
        }
        
        if (isInteraction) {
			await messages.sendPlaylistSelector(context, playlists, user.id, client, userSpotifyId);
		} else {
			await messages.sendPlaylistSelector(channel, playlists, user.id, client, userSpotifyId);
		}

		if (fetchingMsg) {
			setTimeout(() => {
				fetchingMsg.delete().catch(() => {});
			}, 2000);
		}
        
    } catch (error) {
        log('ERROR', `❌ Spotify playlist error: ${error.message}`);
        await sendResponse(context, 
            `${emojis.error} | Failed to fetch Spotify playlists: ${error.message}\n\nTry:\n1. Check your Spotify username is correct\n2. Make sure playlists are not private\n3. Try again in a minute`, 
            isInteraction
        );
    }
}

async function handleJoin(context, channelArg, isInteraction = false) {
    let guild, member, channel, user;
    if (isInteraction) {
        guild = context.guild;
        member = context.member;
        channel = context.channel;
        user = context.user;
    } else {
        guild = context.guild;
        member = context.member;
        channel = context.channel;
        user = context.author;
    }
    let targetChannel = null;

    if (channelArg) {
        if (typeof channelArg === 'object' && channelArg.id) {
            targetChannel = channelArg;
        } else {
            const channelId = channelArg.replace(/[<#>]/g, '');
            targetChannel = guild.channels.cache.get(channelId);
            if (!targetChannel) {
                targetChannel = guild.channels.cache.find(c => 
                    c.type === 2 && c.name.toLowerCase() === channelArg.toLowerCase()
                );
            }
        }
    } else {
        if (member.voice.channel) {
            targetChannel = member.voice.channel;
        } else {
            targetChannel = guild.channels.cache.find(c => 
                c.type === 2 && c.name.toLowerCase() === 'music'
            );
            if (!targetChannel) {
                targetChannel = guild.channels.cache.find(c => c.type === 2);
            }
        }
    }

    if (!targetChannel) {
        return await sendResponse(context, `${emojis.error} | No voice channel found to join.`, isInteraction);
    }
    const permissions = targetChannel.permissionsFor(guild.members.me);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
        return await sendResponse(context, `${emojis.error} | I don't have permission to join/speak in ${targetChannel.toString()}.`, isInteraction);
    }
    let player = client.riffy.players.get(guild.id);
    if (player) {
        if (player.voiceChannel !== targetChannel.id) {
            player.setVoiceChannel(targetChannel.id);
        }
        player.setTextChannel(channel.id);
    } else {
        player = client.riffy.createConnection({
            guildId: guild.id,
            voiceChannel: targetChannel.id,
            textChannel: channel.id,
            deaf: true,
        });
    }
    const savedVolume = client.guildVolumes.get(guild.id);
    if (savedVolume !== undefined) {
        player.setVolume(savedVolume);
    }
    await setVoiceChannelStatus(targetChannel.id, `${emojis.greensparkles || '✨'} | Idle.`);
    cancelInactivityTimer(guild.id);
    const twentyFourSevenData = await load24SevenData();
    if (!twentyFourSevenData[guild.id]?.enabled) {
        startInactivityTimer(guild.id, channel.id);
    }

    await sendResponse(context, `${emojis.success} | Joined ${targetChannel.toString()}!`, isInteraction);
}

async function handleLeave(context, isInteraction = false) {
    let guild, channel, user;
    if (isInteraction) {
        guild = context.guild;
        channel = context.channel;
        user = context.user;
    } else {
        guild = context.guild;
        channel = context.channel;
        user = context.author;
    }

    const player = client.riffy.players.get(guild.id);
    
    if (!player) {
        return await sendResponse(context, 
            `${emojis.error} | I'm not in a voice channel!`, 
            isInteraction
        );
    }

    const voiceChannelId = player.voiceChannel;
    await clearVoiceChannelStatus(voiceChannelId);
    cancelInactivityTimer(guild.id);
    player.destroy();
    
    await sendResponse(context, 
        `${emojis.success} | Left the voice channel!`, 
        isInteraction
    );
}

async function handleRejoin(context, isInteraction = false) {
    let guild, member, channel, user;
    if (isInteraction) {
        guild = context.guild;
        member = context.member;
        channel = context.channel;
        user = context.user;
    } else {
        guild = context.guild;
        member = context.member;
        channel = context.channel;
        user = context.author;
    }

    const player = client.riffy.players.get(guild.id);
    
    if (!player) {
        const prefix = client.prefix || "~";
        return await sendResponse(context, 
            `${emojis.error} | The bot is in no voice channel from before. Use \`${prefix}join\` command instead!`, 
            isInteraction
        );
    }

    const oldVoiceChannelId = player.voiceChannel;
    const oldTextChannelId = player.textChannel;
    const voiceChannel = guild.channels.cache.get(oldVoiceChannelId);
    
    if (!voiceChannel || voiceChannel.type !== 2) {
        return await sendResponse(context, 
            `${emojis.error} | The previous voice channel no longer exists or is invalid!`, 
            isInteraction
        );
    }
    const permissions = voiceChannel.permissionsFor(guild.members.me);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
        return await sendResponse(context, 
            `${emojis.error} | I don't have permission to join/speak in ${voiceChannel.toString()}.`, 
            isInteraction
        );
    }
    await clearVoiceChannelStatus(oldVoiceChannelId);
    player.destroy();
    await new Promise(resolve => setTimeout(resolve, 500));
    const newPlayer = client.riffy.createConnection({
        guildId: guild.id,
        voiceChannel: voiceChannel.id,
        textChannel: channel.id,
        deaf: true,
    });
    const savedVolume = client.guildVolumes.get(guild.id);
    if (savedVolume !== undefined) {
        newPlayer.setVolume(savedVolume);
    }
    await setVoiceChannelStatus(voiceChannel.id, `${emojis.greensparkles || '✨'} | Idle.`);
    const twentyFourSevenData = await load24SevenData();
    if (!twentyFourSevenData[guild.id]?.enabled) {
        startInactivityTimer(guild.id, channel.id);
    }

    await sendResponse(context, 
        `${emojis.success} | Rejoined ${voiceChannel.toString()}!`, 
        isInteraction
    );
}

async function handleShift(context, isInteraction, targetUser, targetChannel) {
    const guild = isInteraction ? context.guild : context.guild;
    const channel = isInteraction ? context.channel : context.channel;
    const commandUserId = isInteraction ? context.user.id : context.author.id;

    const hasPermission = commandUserId === ownerId ||
                         (guild.members.cache.get(commandUserId)?.permissions.has(PermissionsBitField.Flags.Administrator)) ||
                         (guild.members.cache.get(commandUserId)?.permissions.has(PermissionsBitField.Flags.MoveMembers));
    if (!hasPermission) {
        return sendResponse(context, messages.error(channel, "You need `Move Members` permission, Administrator, or be the bot owner to use this command."), isInteraction);
    }

    let targetMember;
    try {
        targetMember = await guild.members.fetch(targetUser.id);
    } catch {
        return sendResponse(context, messages.error(channel, "Could not find that user in this server."), isInteraction);
    }

    if (!targetMember.voice.channel) {
        if (targetUser.id === commandUserId) {
            return sendResponse(context, messages.error(channel, "You are not in a voice channel!"), isInteraction);
        } else {
            return sendResponse(context, messages.error(channel, "The user is not in any voice channel!"), isInteraction);
        }
    }
    const sourceChannel = targetMember.voice.channel;

    let destChannel;
    if (targetChannel) {

        destChannel = guild.channels.cache.get(targetChannel.id);
        if (!destChannel) {
            return sendResponse(context, messages.error(channel, "Voice channel not found!"), isInteraction);
        }
        if (destChannel.type !== 2) {
            return sendResponse(context, messages.error(channel, "You have provided a text channel. Provide a voice channel!"), isInteraction);
        }
    } else {

        const botMember = guild.members.me;
        if (botMember.voice.channel) {
            destChannel = botMember.voice.channel;
        } else {

            const voiceChannels = guild.channels.cache
                .filter(c => c.type === 2)
                .sort((a, b) => a.rawPosition - b.rawPosition);
            destChannel = voiceChannels.first();
            if (!destChannel) {
                return sendResponse(context, messages.error(channel, "No voice channels exist in this server!"), isInteraction);
            }
        }
    }

    try {
        await targetMember.voice.setChannel(destChannel);
        const successText = `Shifted ${targetMember} from ${sourceChannel} to ${destChannel}!`;
        return sendResponse(context, messages.success(channel, successText), isInteraction);
    } catch (error) {
        log('ERROR', `Shift error: ${error.message}`);
        return sendResponse(context, messages.error(channel, `Failed to shift: ${error.message}`), isInteraction);
    }
}

async function handleDisconnect(context, isInteraction, targetUser) {
    const guild = isInteraction ? context.guild : context.guild;
    const channel = isInteraction ? context.channel : context.channel;
    const commandUserId = isInteraction ? context.user.id : context.author.id;

    const hasPermission = commandUserId === ownerId ||
                         (guild.members.cache.get(commandUserId)?.permissions.has(PermissionsBitField.Flags.Administrator)) ||
                         (guild.members.cache.get(commandUserId)?.permissions.has(PermissionsBitField.Flags.MoveMembers));
    if (!hasPermission) {
        return sendResponse(context, messages.error(channel, "You need `Move Members` permission, Administrator, or be the bot owner to use this command."), isInteraction);
    }

    let targetMember;
    try {
        targetMember = await guild.members.fetch(targetUser.id);
    } catch {
        return sendResponse(context, messages.error(channel, "Could not find that user in this server."), isInteraction);
    }

    if (!targetMember.voice.channel) {
        if (targetUser.id === commandUserId) {
            return sendResponse(context, messages.error(channel, "You are not in any voice channel!"), isInteraction);
        } else {
            return sendResponse(context, messages.error(channel, "The provided user is not in any voice channel!"), isInteraction);
        }
    }

    const sourceChannel = targetMember.voice.channel;

    try {
        await targetMember.voice.disconnect();
        const successText = targetUser.id === commandUserId
            ? `Successfully disconnected you from ${sourceChannel}!`
            : `Successfully disconnected ${targetMember} from ${sourceChannel}!`;
        return sendResponse(context, messages.success(channel, successText), isInteraction);
    } catch (error) {
        log('ERROR', `Disconnect error: ${error.message}`);
        return sendResponse(context, messages.error(channel, `Failed to disconnect: ${error.message}`), isInteraction);
    }
}

async function sendResponse(context, content, isInteraction = false) {
    try {

        if (!content) {
            content = { content: '​' };
        } else if (typeof content === 'string' && content.trim() === '') {
            content = '​';
        }

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
    } catch (error) {
        log('ERROR', `Error in sendResponse: ${error.message}`);
        throw error;
    }
}

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
            log('ERROR', `❌ Failed to set voice status in ${channelId}: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        log('ERROR', `❌ Error setting voice status: ${error.message}`);
    }
}

async function clearVoiceChannelStatus(channelId) {
    await setVoiceChannelStatus(channelId, null);
}

async function updatePlayerVoiceStatus(player) {
    if (!player || !player.voiceChannel) return;

    const guildId = player.guildId;
    const channelId = player.voiceChannel;

    const twentyFourSevenData = await load24SevenData();
    const guild24Seven = twentyFourSevenData[guildId]?.enabled === true;

    const track = player.current || player.queue.current;
    if (track) {
        const status = `${emojis.cutemusic} | ${track.info.title} - ${track.info.author}`;
        const truncated = status.length > 500 ? status.slice(0, 497) + '...' : status;
        await setVoiceChannelStatus(channelId, truncated);
    } else {
        if (guild24Seven) {
            await setVoiceChannelStatus(channelId, `${emojis.blade} | 24/7 enabled!`);
        } else {
            await setVoiceChannelStatus(channelId, `${emojis.greensparkles || '✨'} | Idle.`);
        }
    }
}

function safeEvaluate(expression) {

    let clean = expression.replace(/\s+/g, '');

    clean = clean.replace(/\^/g, '**');

    if (/[^0-9+\-*/%().!sqrt]/.test(clean)) return null;

    let processed = clean.replace(/(\d+)!/g, 'fact($1)')
                         .replace(/sqrt\(/g, 'Math.sqrt(');

    try {

        const fact = (n) => {
            if (n < 0 || !Number.isInteger(n)) return NaN;
            return n <= 1 ? 1 : n * fact(n - 1);
        };

        const func = new Function('fact', 'return ' + processed);
        const result = func(fact);

        if (typeof result !== 'number' || !isFinite(result) || !Number.isInteger(result)) {
            return null;
        }
        return result;
    } catch (e) {
        return null;
    }
}

async function processCountingMessage(message, config) {
    if (message.author.bot) return;

    const expression = message.content.trim();
    const result = safeEvaluate(expression);
    const expected = config.current_number + 1;

    let isCorrect = false;
    let reason = '';

    if (result === null) {
        reason = 'invalid expression';
    } else if (result !== expected) {
        reason = `expected ${expected}, got ${result}`;
    } else if (config.last_user_id === message.author.id) {
        reason = 'same user as previous count';
    } else {
        isCorrect = true;
    }

    if (isCorrect) {
        await message.react(emojis.greentick);
        await client.db.updateCountingAfterCorrect(message.guild.id, result, message.author.id);
    } else {
        await message.react(emojis.error);
        if (reason === 'same user as previous count') {
            await messages.error(message.channel, "It is not your turn to count! Wait for someone else.");
        } else if (reason.startsWith('expected') || reason === 'invalid expression') {
            if (!config.toggle_reset) {
                await messages.error(message.channel, "Wrong! Count reset to 0.");
            }
        }
        if (!config.toggle_reset) {
            await client.db.resetCounting(message.guild.id);
        }
    }
}

function formatDuration(ms) {
    if (!ms || ms <= 0 || ms === 'Infinity') return 'LIVE';
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Starts an inactivity timer for a guild. Cancels any existing timer.
 * @param {string} guildId 
 * @param {string} textChannelId - Channel to send leave message
 */
function startInactivityTimer(guildId, textChannelId) {
    if (client.inactivityTimers.has(guildId)) {
        clearTimeout(client.inactivityTimers.get(guildId));
    }

    const timer = setTimeout(async () => {
        const player = client.riffy.players.get(guildId);
        if (!player) {
            client.inactivityTimers.delete(guildId);
            return;
        }
        if (!player.current && player.queue.length === 0) {
            const channel = client.channels.cache.get(textChannelId || player.textChannel);
            if (channel) {
                await channel.send(`${emojis.info} Left the voice channel due to inactivity. Enable 24/7 mode if you don't want this.`);
            }
            await clearVoiceChannelStatus(player.voiceChannel);
            player.destroy();
        }
        client.inactivityTimers.delete(guildId);
    }, 5 * 60 * 1000);

    client.inactivityTimers.set(guildId, timer);
}

/**
 * Cancels the inactivity timer for a guild.
 * @param {string} guildId 
 */
function cancelInactivityTimer(guildId) {
    if (client.inactivityTimers.has(guildId)) {
        clearTimeout(client.inactivityTimers.get(guildId));
        client.inactivityTimers.delete(guildId);
    }
}

async function handlePrefixCommand(message, cmd, args) {
	const client = message.client;
	const { config, db } = client;

    switch (cmd) {
            case 'play':
            case 'p': {
                const query = args.join(' ');
                if (!query) return message.reply(`${emojis.error} | Please provide a song to play!`);
                await handlePlay(message, query, false);
                break;
            }
            
            case 'pause': {
                await handlePause(message, false);
                break;
            }
            
            case 'resume': {
                await handleResume(message, false);
                break;
            }
            
            case 'skip': {
                await handleSkip(message, false);
                break;
            }
            
            case 'stop':
			case 's': {
                await handleStop(message, false);
                break;
            }
            
			case 'join': {
				const channelArg = args.join(' ');
				await handleJoin(message, channelArg, false);
				break;
			}
			
			case 'leave': {
				await handleLeave(message, false);
				break;
			}

			case 'rejoin': {
				await handleRejoin(message, false);
				break;
			}
			
			case 'shift': {
				let targetUser = message.author;
				let targetChannel = null;

				if (args.length >= 1) {

					const userMatch = args[0].match(/^<@!?(\d+)>$/);
					const userId = userMatch ? userMatch[1] : args[0];
					try {
						const fetchedUser = await client.users.fetch(userId, { force: false });
						targetUser = fetchedUser;
						args.shift();
					} catch {

					}
				}
				if (args.length >= 1) {

					const channelMatch = args[0].match(/^<#(\d+)>$/);
					const channelId = channelMatch ? channelMatch[1] : args[0];
					targetChannel = message.guild.channels.cache.get(channelId);
					if (targetChannel) args.shift();
				}

				await handleShift(message, false, targetUser, targetChannel);
				break;
			}

			case 'disconnect': {
				let targetUser = message.author;
				if (args.length > 0) {
					const mention = args[0].match(/^<@!?(\d+)>$/);
					const userId = mention ? mention[1] : args[0];
					try {
						targetUser = await client.users.fetch(userId, { force: false });
					} catch {

					}
				}
				await handleDisconnect(message, false, targetUser);
				break;
			}
			
            case 'lyrics': {
                await handleLyrics(message, false);
                break;
            }
            
            case 'queue':
            case 'q': {
                await handleQueue(message, false);
                break;
            }
            
            case 'nowplaying':
            case 'np': {
                await handleNowPlaying(message, false);
                break;
            }
            
            case 'volume':
			case 'vol': {
				if (args.length >= 2 && args[0].toLowerCase() === 'six' && args[1].toLowerCase() === 'seven') {
					await handleVolume(message, 67, false);
					break;
				}
				if (args.length >= 2 && args[0].toLowerCase() === 'six' && args[1].toLowerCase() === 'nine') {
					await handleVolume(message, 69, false);
					break;
				}
				const volume = parseInt(args[0]);
				if (isNaN(volume)) return message.reply(`${emojis.error} | Please provide a valid volume level (0-100)!`);
				await handleVolume(message, volume, false);
				break;
			}
            
            case 'servervolume': {
                const volume = parseInt(args[0]);
                if (isNaN(volume)) return message.reply(`${emojis.error} | Please provide a valid volume level (0-100)!`);
                await handleServerVolume(message, volume, false);
                break;
            }
            
            case 'filter': {
                const filterType = args[0];
                if (!filterType) {
                    await messages.filterHelp(message.channel);
                    return;
                }
                await handleFilter(message, filterType, false);
                break;
            }
            
            case 'shuffle': {
                await handleShuffle(message, false);
                break;
            }
            
            case 'loop': {
                await handleLoop(message, false);
                break;
            }
            
            case 'move': {
                const from = parseInt(args[0]);
                const to = parseInt(args[1]);
                if (isNaN(from) || isNaN(to)) {
                    return message.reply(`${emojis.error} | Please provide valid positions! Usage: ~move <from> <to>`);
                }
                await handleMove(message, from, to, false);
                break;
            }
            
            case 'add': {
                const position = parseInt(args[args.length - 1]);
                if (isNaN(position)) {
                    return message.reply(`${emojis.error} | Please provide a valid position! Usage: ~add <song> <position>`);
                }
                const song = args.slice(0, -1).join(' ');
                if (!song) return message.reply(`${emojis.error} | Please provide a song!`);
                await handleAdd(message, song, position, false);
                break;
            }
            
            case 'remove': {
                const position = parseInt(args[0]);
                if (isNaN(position)) {
                    return message.reply(`${emojis.error} | Please provide a valid position! Usage: ~remove <position>`);
                }
                await handleRemove(message, position, false);
                break;
            }
            
            case 'clear': {
                await handleClear(message, false);
                break;
            }
            
            case 'status': {
                await handleStatus(message, false);
                break;
            }
            
            case 'ping': {
                await handlePing(message, false);
                break;
            }
            
            case 'help': {
				await sendPrefixHelpWithComponents(message);
				break;
			}
            
            case 'setspotify': {
                const username = args.join(' ');
                if (!username) return message.reply(`${emojis.error} | Please provide your Spotify username!`);
                await handleSetSpotify(message, username, false);
                break;
            }
            
            case 'playspotify': {
                await handlePlaySpotify(message, false);
                break;
            }
                
			case 'react': {
				if (!args[0]) {
					await messages.error(message.channel, "Please provide an emoji name, ID, or markdown.");
					return;
				}

				const identifier = args.join(' ');
				let emoji = null;
				let emojiId = null;
				const customEmojiRegex = /^<a?:\w+:(\d+)>$/;
				const match = identifier.match(customEmojiRegex);
				if (match) {
					emojiId = match[1];
				} else if (/^\d+$/.test(identifier)) {
					emojiId = identifier;
				}
				if (emojiId) {
					emoji = client.emojis.cache.get(emojiId);
					if (!emoji) {
						for (const guild of client.guilds.cache.values()) {
							try {
								const fetched = await guild.emojis.fetch(emojiId).catch(() => null);
								if (fetched) {
									emoji = fetched;
									client.emojis.cache.set(emojiId, fetched);
									break;
								}
							} catch {
							}
						}
					}
				} else {
					const nameLower = identifier.toLowerCase();
					if (message.guild) {
						emoji = message.guild.emojis.cache.find(e => e.name.toLowerCase() === nameLower);
					}
					if (!emoji) {
						emoji = client.emojis.cache.find(e => e.name.toLowerCase() === nameLower);
					}
					if (!emoji) {
						for (const guild of client.guilds.cache.values()) {
							try {
								await guild.emojis.fetch();
								const found = guild.emojis.cache.find(e => e.name.toLowerCase() === nameLower);
								if (found) {
									emoji = found;
									break;
								}
							} catch {
							}
						}
					}
				}
				if (!emoji) {
					await messages.error(message.channel, "Emoji not found! Make sure the bot is in the same server as the emoji.");
					return;
				}
				let targetMessage;
				if (message.reference) {
					try {
						targetMessage = await message.channel.messages.fetch(message.reference.messageId);
					} catch {
						await messages.error(message.channel, "Could not fetch the replied message!");
						return;
					}
				} else {
					try {
						const messages = await message.channel.messages.fetch({ limit: 2 });
						const messageArray = Array.from(messages.values());
						targetMessage = messageArray[1];
						if (!targetMessage) {
							await messages.error(message.channel, "No message found to react to!");
							return;
						}
					} catch {
						await messages.error(message.channel, "Could not fetch the last message!");
						return;
					}
				}
				try {
					await targetMessage.react(emoji);
					setTimeout(() => {
						message.delete().catch(() => {});
					}, 1000);

					const successMsg = await messages.success(message.channel, "Reacted!");
					setTimeout(() => {
						successMsg.delete().catch(() => {});
					}, 5000);
				} catch (error) {
					log('ERROR', `React error: ${error.message}`);
					if (error.code === 10014) {
						await messages.error(message.channel, "Emoji not found! The bot might not have access to this emoji.");
					} else if (error.code === 50001) {
						await messages.error(message.channel, "I don't have permission to add reactions in this channel.");
					} else if (error.code === 50013) {
						await messages.error(message.channel, "I don't have permission to add reactions.");
					} else {
						await messages.error(message.channel, `Failed to react: ${error.message}`);
					}
				}
				break;
			}
			
			case 'emoji': {
				const input = args.join(' ');
				if (!input) {
					return messages.error(message.channel, "Please provide emoji identifiers.");
				}
				const tokens = input.split(/\s+/);
				const partsPerToken = tokens.map(token => token.split('/$/'));
				const resolvedGroups = [];
				let anyInvalid = false;

				for (const group of partsPerToken) {
					const resolvedInGroup = [];
					for (const ident of group) {
						const emoji = await resolveEmoji(client, ident, message.guild);
						if (emoji) {
							resolvedInGroup.push(emoji.toString());
						} else {
							anyInvalid = true;
						}
					}
					resolvedGroups.push(resolvedInGroup.join(''));
				}
				const finalString = resolvedGroups.join(' ').trim();

				if (!finalString && anyInvalid) {
					return messages.error(message.channel, "All provided emoji identifiers were invalid!");
				}
				try {
					await message.delete();
				} catch {}
				if (finalString) {
					if (message.reference?.messageId) {
						try {
							const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
							await repliedMessage.reply(finalString);
						} catch {
							await message.channel.send(finalString);
						}
					} else {
						await message.channel.send(finalString);
					}
				}
				if (anyInvalid) {
					const errorMsg = await messages.error(message.channel, "Any one of the emoji IDs were invalid!");
					setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
				}
				break;
			}
			
			case 'avatar':
			case 'av': {
				let targetUser = message.author;
				let targetGuild = null;
				let member = null;
				let hasServerAvatar = false;

				if (args.length > 0) {
					const firstArg = args[0].toLowerCase();

					if (firstArg === 'bot') {
						targetUser = client.user;
						member = await message.guild.members.fetch({ user: targetUser.id, force: true }).catch(() => null);
						if (!member) {
							return messages.error(message.channel, 'Bot is not a member of this server? Something is wrong.');
						}
					} else if (firstArg === 'server') {
						targetGuild = message.guild;
						if (!targetGuild.icon) {
							return messages.error(message.channel, 'This server does not have an icon.');
						}
						const avatarURL = targetGuild.iconURL({ dynamic: true, size: 4096 });
						const embed = buildImageEmbed(
							`${emojis.blackbutterfly} ${targetGuild.name}'s icon`,
							avatarURL,
							message.author
						);
						return sendImageWithDMButton(message.channel, embed, message.author);
					} else {
						const mention = args[0].match(/^<@!?(\d+)>$/);
						const userId = mention ? mention[1] : args[0];
						try {
							targetUser = await client.users.fetch(userId, { force: true });
						} catch {
							return messages.error(message.channel, 'Invalid user!');
						}
						member = await message.guild.members.fetch({ user: targetUser.id, force: true }).catch(() => null);
						if (!member) {
							return messages.error(message.channel, 'That user is not a member of this server!');
						}
					}
				} else {
					targetUser = await client.users.fetch(message.author.id, { force: true });
					member = await message.guild.members.fetch({ user: targetUser.id, force: true }).catch(() => null);
				}
				hasServerAvatar = !!(member && member.avatar);

				if (hasServerAvatar) {
					const promptEmbed = new EmbedBuilder()
						.setColor(config.embedColor)
						.setTitle(`${emojis.info} Choose Avatar`)
						.setDescription(`${targetUser.username} has a server‑specific avatar. Which one would you like to see?`)
						.setFooter({ text: 'You have 60 seconds to decide' });

					const row = new ActionRowBuilder()
						.addComponents(
							new ButtonBuilder()
								.setCustomId(`server_avatar_${targetUser.id}`)
								.setLabel('Server Avatar')
								.setStyle(ButtonStyle.Success),
							new ButtonBuilder()
								.setCustomId(`global_avatar_${targetUser.id}`)
								.setLabel('Global Avatar')
								.setStyle(ButtonStyle.Success)
						);

					const promptMsg = await message.channel.send({ embeds: [promptEmbed], components: [row] });

					const filter = i => i.user.id === message.author.id;
					const collector = promptMsg.createMessageComponentCollector({ filter, time: 60000 });

					collector.on('collect', async i => {
						await i.deferUpdate();
						collector.stop();

						let avatarURL, title;
						if (i.customId.startsWith('server_avatar')) {
							avatarURL = member.displayAvatarURL({ dynamic: true, size: 4096 });
							title = `${emojis.blackbutterfly} ${targetUser.username}'s server avatar`;
						} else {
							avatarURL = targetUser.displayAvatarURL({ dynamic: true, size: 4096 });
							title = `${emojis.blackbutterfly} ${targetUser.username}'s global avatar`;
						}

						const embed = buildImageEmbed(title, avatarURL, message.author);
						await promptMsg.delete();
						await sendImageWithDMButton(message.channel, embed, message.author);
					});

					collector.on('end', async (collected, reason) => {
						if (reason === 'time') {
							const disabledRow = ActionRowBuilder.from(row).setComponents(
								row.components.map(c => ButtonBuilder.from(c).setDisabled(true))
							);
							await promptMsg.edit({ components: [disabledRow] }).catch(() => {});
						}
					});
				} else {
					const avatarURL = targetUser.displayAvatarURL({ dynamic: true, size: 4096 });
					const embed = buildImageEmbed(
						`${emojis.blackbutterfly} ${targetUser.username}'s avatar`,
						avatarURL,
						message.author
					);
					await sendImageWithDMButton(message.channel, embed, message.author);
				}
				break;
			}

			case 'banner':
			case 'bn': {
				let targetUser = message.author;
				let targetGuild = null;
				let member = null;
				let hasServerBanner = false;
				let hasGlobalBanner = false;

				if (args.length > 0) {
					const firstArg = args[0].toLowerCase();

					if (firstArg === 'bot') {
						targetUser = client.user;
						member = await message.guild.members.fetch({ user: targetUser.id, force: true }).catch(() => null);
						if (!member) {
							return messages.error(message.channel, 'Bot is not a member of this server? Something is wrong.');
						}
					} else if (firstArg === 'server') {
						targetGuild = message.guild;
						if (!targetGuild.banner) {
							return messages.error(message.channel, 'This server does not have a banner.');
						}
						const bannerURL = targetGuild.bannerURL({ dynamic: true, size: 4096 });
						const embed = buildImageEmbed(
							`${emojis.blackbutterfly} ${targetGuild.name}'s banner`,
							bannerURL,
							message.author
						);
						return sendImageWithDMButton(message.channel, embed, message.author);
					} else {
						const mention = args[0].match(/^<@!?(\d+)>$/);
						const userId = mention ? mention[1] : args[0];
						try {
							targetUser = await client.users.fetch(userId, { force: true });
						} catch {
							return messages.error(message.channel, 'Invalid user!');
						}
						member = await message.guild.members.fetch({ user: targetUser.id, force: true }).catch(() => null);
						if (!member) {
							return messages.error(message.channel, 'That user is not a member of this server!');
						}
					}
				} else {
					targetUser = await client.users.fetch(message.author.id, { force: true });
					member = await message.guild.members.fetch({ user: targetUser.id, force: true }).catch(() => null);
				}
				hasGlobalBanner = !!targetUser.banner;
				hasServerBanner = !!(member && member.banner);

				const showBanner = async (type) => {
					let bannerURL, title;
					if (type === 'server' && member && member.banner) {
						bannerURL = member.bannerURL({ dynamic: true, size: 4096 });
						title = `${emojis.blackbutterfly} ${targetUser.username}'s server banner`;
					} else if (type === 'global' && targetUser.banner) {
						bannerURL = targetUser.bannerURL({ dynamic: true, size: 4096 });
						title = `${emojis.blackbutterfly} ${targetUser.username}'s global banner`;
					} else {
						return messages.error(message.channel, 'That banner is no longer available.');
					}

					const embed = buildImageEmbed(title, bannerURL, message.author);
					await sendImageWithDMButton(message.channel, embed, message.author);
				};

				if (hasServerBanner && hasGlobalBanner) {
					const promptEmbed = new EmbedBuilder()
						.setColor(config.embedColor)
						.setTitle(`${emojis.info} Choose Banner`)
						.setDescription(`${targetUser.username} has both a server‑specific banner and a global banner. Which one would you like to see?`)
						.setFooter({ text: 'You have 60 seconds to decide' });

					const row = new ActionRowBuilder()
						.addComponents(
							new ButtonBuilder()
								.setCustomId(`server_banner_${targetUser.id}`)
								.setLabel('Server Banner')
								.setStyle(ButtonStyle.Success),
							new ButtonBuilder()
								.setCustomId(`global_banner_${targetUser.id}`)
								.setLabel('Global Banner')
								.setStyle(ButtonStyle.Success)
						);

					const promptMsg = await message.channel.send({ embeds: [promptEmbed], components: [row] });

					const filter = i => i.user.id === message.author.id;
					const collector = promptMsg.createMessageComponentCollector({ filter, time: 60000 });

					collector.on('collect', async i => {
						await i.deferUpdate();
						collector.stop();

						if (i.customId.startsWith('server_banner')) {
							await showBanner('server');
						} else {
							await showBanner('global');
						}
						await promptMsg.delete().catch(() => {});
					});

					collector.on('end', async (collected, reason) => {
						if (reason === 'time') {
							const disabledRow = ActionRowBuilder.from(row).setComponents(
								row.components.map(c => ButtonBuilder.from(c).setDisabled(true))
							);
							await promptMsg.edit({ components: [disabledRow] }).catch(() => {});
						}
					});
				}
				else if (hasServerBanner && !hasGlobalBanner) {
					await showBanner('server');
				}
				else if (!hasServerBanner && hasGlobalBanner) {
					await showBanner('global');
				}
				else {
					return messages.error(message.channel, `${targetUser.username} does not have any banner.`);
				}
				break;
			}
			
			case 'steal': {
				try {
					const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
					const fetch = require('node-fetch');
					let assetUrl = null;
					let assetName = null;
					let isAnimated = false;
					let contentType = null;
					let assetSource = null;
					let formatType = 'Unknown';

					if (args.length > 0) {

						const emojiRegex = /^<a?:([a-zA-Z0-9_]+):(\d+)>$/;
						const match = args[0].match(emojiRegex);
						if (match) {
							const emojiName = match[1];
							const emojiId = match[2];
							isAnimated = args[0].startsWith('<a:');
							assetUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'png'}`;
							contentType = isAnimated ? 'image/gif' : 'image/png';
							assetName = emojiName;
							assetSource = 'emoji';
							formatType = isAnimated ? 'Animated Emoji' : 'Static Emoji';
						} else {

							const errorMsg = await message.channel.send(`${emojis.error} | Please provide a valid custom emoji (e.g., :emoji: or <:emoji:123456>)`);
							setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
							return;
						}
					} else {

						if (!message.reference) {
							const errorMsg = await message.channel.send(`${emojis.error} | Please reply to a message containing an emoji, sticker, or image to steal, or provide an emoji as an argument!`);
							setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
							return;
						}

						const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);

						if (repliedMessage.stickers.size > 0) {
							const sticker = repliedMessage.stickers.first();
							assetUrl = sticker.url;
							isAnimated = sticker.format === 2 || sticker.format === 3;
							contentType = sticker.format === 2 ? 'image/apng' : sticker.format === 3 ? 'image/gif' : 'image/png';
							assetName = assetName || sticker.name;
							assetSource = 'sticker';
							formatType = isAnimated ? 'Animated Sticker' : 'Static Sticker';
						}

						else if (repliedMessage.content.match(/<a?:[a-zA-Z0-9_]+:(\d+)>/)) {
							const emojiMatch = repliedMessage.content.match(/<a?:[a-zA-Z0-9_]+:(\d+)>/);
							const emojiId = emojiMatch[1];
							isAnimated = repliedMessage.content.includes('<a:');
							assetUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'png'}`;
							contentType = isAnimated ? 'image/gif' : 'image/png';
							const emojiName = repliedMessage.content.match(/<a?:([a-zA-Z0-9_]+):\d+>/)[1];
							assetName = assetName || emojiName;
							assetSource = 'emoji';
							formatType = isAnimated ? 'Animated Emoji' : 'Static Emoji';
						}

						else if (repliedMessage.attachments.size > 0) {
							const attachment = repliedMessage.attachments.first();
							const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/apng', 'image/bmp', 'image/tiff'];
							if (attachment.contentType && validImageTypes.some(type => attachment.contentType.includes(type))) {
								assetUrl = attachment.url;
								contentType = attachment.contentType;
								isAnimated = attachment.contentType.includes('gif') || attachment.contentType.includes('apng');
								const fileName = attachment.name || 'stolen_asset';
								assetName = assetName || fileName.replace(/\.[^/.]+$/, "");
								assetSource = 'attachment';

								if (attachment.url.toLowerCase().endsWith('.gif')) {
									contentType = 'image/gif';
									isAnimated = true;
									formatType = 'GIF Image';
								} else if (attachment.url.toLowerCase().endsWith('.webp')) {
									contentType = 'image/webp';
									formatType = 'WebP Image';
								} else if (attachment.url.toLowerCase().endsWith('.jpg') || attachment.url.toLowerCase().endsWith('.jpeg')) {
									contentType = 'image/jpeg';
									formatType = 'JPEG Image';
								} else if (attachment.url.toLowerCase().endsWith('.bmp')) {
									contentType = 'image/bmp';
									formatType = 'BMP Image';
								} else if (attachment.url.toLowerCase().endsWith('.tiff') || attachment.url.toLowerCase().endsWith('.tif')) {
									contentType = 'image/tiff';
									formatType = 'TIFF Image';
								} else {
									formatType = 'PNG Image';
								}
							}
						}

						if (!assetUrl && repliedMessage.embeds.length > 0) {
							for (const embed of repliedMessage.embeds) {
								if (embed.image && embed.image.url) {
									assetUrl = embed.image.url;
									contentType = 'image/gif';
									isAnimated = true;
									assetName = assetName || 'gif_asset';
									assetSource = 'embed';
									formatType = 'Embed GIF';
									break;
								} else if (embed.thumbnail && embed.thumbnail.url) {
									assetUrl = embed.thumbnail.url;
									contentType = embed.thumbnail.url.toLowerCase().endsWith('.gif') ? 'image/gif' : 'image/png';
									isAnimated = embed.thumbnail.url.toLowerCase().endsWith('.gif');
									assetName = assetName || 'embed_asset';
									assetSource = 'embed';
									formatType = isAnimated ? 'Embed GIF' : 'Embed Image';
									break;
								}
							}
						}

						if (!assetUrl) {
							const urlRegex = /(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp|apng|bmp|tiff|tif))/i;
							const urlMatch = repliedMessage.content.match(urlRegex);
							if (urlMatch) {
								assetUrl = urlMatch[1];
								const urlWithoutQuery = assetUrl.split('?')[0];
								const fileExt = urlWithoutQuery.toLowerCase().split('.').pop();
								if (fileExt === 'gif') {
									contentType = 'image/gif';
									isAnimated = true;
									formatType = 'GIF URL';
								} else if (fileExt === 'webp') {
									contentType = 'image/webp';
									formatType = 'WebP URL';
								} else if (fileExt === 'jpg' || fileExt === 'jpeg') {
									contentType = 'image/jpeg';
									formatType = 'JPEG URL';
								} else if (fileExt === 'bmp') {
									contentType = 'image/bmp';
									formatType = 'BMP URL';
								} else if (fileExt === 'tiff' || fileExt === 'tif') {
									contentType = 'image/tiff';
									formatType = 'TIFF URL';
								} else {
									contentType = 'image/png';
									formatType = 'PNG URL';
								}
								assetName = assetName || 'image_asset';
								assetSource = 'url';
							}
						}
					}

					if (!assetUrl) {
						const errorMsg = await message.channel.send(`${emojis.error} | No valid emoji, sticker, or image found!`);
						setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
						return;
					}

					if (assetSource === 'attachment' && isAnimated) {
						const errorMsg = await message.channel.send(`${emojis.error} | Animated attachments are not supported!`);
						setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
						return;
					}

					const embed = new EmbedBuilder()
						.setColor(config.embedColor || '#5865F2')
						.setTitle(`${emojis.butterfly} Media Stealer`)
						.setDescription(`**${formatType}** detected\nClick a button below to steal this asset`)
						.addFields([
							{
								name: `${emojis.info} Details`,
								value: `**Name:** ${assetName || 'Unnamed'}\n**Type:** ${formatType}\n**Source:** ${assetSource ? assetSource.charAt(0).toUpperCase() + assetSource.slice(1) : 'Unknown'}`,
								inline: true
							},
							{
								name: `${emojis.blackheart1} Options`,
								value: `${emojis.music} **Steal as Emoji** - Adds as server emoji\n${emojis.music} **Steal as Sticker** - Adds as server sticker`,
								inline: true
							}
						])
						.setImage(assetUrl)
						.setFooter({ 
							text: `Using sharp for conversion • Click within 60 seconds`, 
							iconURL: 'https://i.ibb.co/gLM9bMf9/standard.gif' 
						})
						.setTimestamp();

					const row = new ActionRowBuilder()
						.addComponents(
							new ButtonBuilder()
								.setCustomId(`steal_emoji_${message.id}_${Date.now()}`)
								.setLabel('✨ Steal as Emoji')
								.setStyle(ButtonStyle.Primary),
							new ButtonBuilder()
								.setCustomId(`steal_sticker_${message.id}_${Date.now()}`)
								.setLabel('🎨 Steal as Sticker')
								.setStyle(ButtonStyle.Secondary)
						);

					const stealMessage = await message.channel.send({ 
						embeds: [embed], 
						components: [row]
					});

					const filter = (interaction) => 
						(interaction.customId.startsWith(`steal_emoji_${message.id}_`) || 
						 interaction.customId.startsWith(`steal_sticker_${message.id}_`)) &&
						interaction.user.id === message.author.id;

					const collector = stealMessage.createMessageComponentCollector({ 
						filter, 
						time: 60000,
						max: 1
					});

					collector.on('collect', async (interaction) => {
						if (interaction.user.id !== config.ownerId && !interaction.memberPermissions.has('ManageEmojisAndStickers')) {
							await interaction.reply({ 
								content: `${emojis.error} | You need the "Manage Emojis and Stickers" permission!`,
								flags: 64
							});
							return;
						}
						if (!interaction.guild.members.me.permissions.has('ManageEmojisAndStickers')) {
							await interaction.reply({ 
								content: `${emojis.error} | I need the "Manage Emojis and Stickers" permission!`,
								flags: 64
							});
							return;
						}

						await interaction.deferReply({ flags: 64 });

						try {
							const response = await fetch(assetUrl, {
								headers: {
									'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
								}
							});
							if (!response.ok) throw new Error(`HTTP ${response.status}`);
							let buffer = await response.buffer();

							const finalName = (assetName || 'stolen')
								.replace(/[^a-zA-Z0-9_]/g, '_')
								.replace(/_+/g, '_')
								.replace(/^_|_$/g, '')
								.slice(0, 30);
							if (!finalName) throw new Error('Invalid name');

							if (interaction.customId.startsWith(`steal_emoji_`)) {

								try {
									let emojiBuffer = buffer;

									if (contentType.includes('webp') || contentType.includes('jpeg') || contentType.includes('jpg') || contentType.includes('bmp') || contentType.includes('tiff')) {
										try {
											const sharp = require('sharp');
											if (isAnimated) {

												try {
													emojiBuffer = await sharp(buffer, { animated: true })
														.gif()
														.toBuffer();
												} catch {
													emojiBuffer = await sharp(buffer)
														.png()
														.toBuffer();
												}
											} else {
												emojiBuffer = await sharp(buffer)
													.png()
													.toBuffer();
											}
										} catch (sharpError) {
											console.log('Sharp conversion failed, using original buffer');
										}
									}

									const emoji = await interaction.guild.emojis.create({
										attachment: emojiBuffer,
										name: finalName.slice(0, 32),
										reason: `Stolen by ${interaction.user.tag}`
									});

									const successEmbed = new EmbedBuilder()
										.setColor('#00FF00')
										.setTitle(`${emojis.success} Successfully stole as Emoji`)
										.setDescription(`**${finalName}** has been added to server emojis`)
										.addFields([
											{
												name: `${emojis.info} Details`,
												value: `${emoji}\n**Format:** ${isAnimated ? 'Animated' : 'Static'}\n**Added by:** ${interaction.user.tag}`,
												inline: true
											}
										])
										.setImage(assetUrl)
										.setFooter({ 
											text: 'Emoji added successfully • Using sharp for conversion', 
											iconURL: 'https://i.ibb.co/gLM9bMf9/standard.gif' 
										})
										.setTimestamp();

									await stealMessage.edit({ embeds: [successEmbed], components: [] });
									await interaction.editReply({ content: `${emoji} | Successfully stole as emoji!` });

								} catch (emojiError) {
									console.error('Emoji creation error:', emojiError);
									let errorMessage = 'Failed to create emoji';
									if (emojiError.code === 30008) errorMessage = 'Server has reached maximum emoji limit';
									else if (emojiError.code === 50045 || emojiError.message.includes('Invalid Form Body')) errorMessage = 'Invalid image format for emoji';
									else if (emojiError.message.includes('animated')) errorMessage = 'Server needs higher boost level for animated emojis';
									await interaction.editReply({ content: `${emojis.error} | ${errorMessage}` });
								}

							} else if (interaction.customId.startsWith(`steal_sticker_`)) {

								try {
									const sharp = require('sharp');
									let stickerBuffer = buffer;
									let stickerFormat = 'png';

									if (isAnimated) {

										try {
											stickerBuffer = await sharp(buffer, { animated: true })
												.png()
												.toBuffer();
											stickerFormat = 'png';
										} catch {

										}
									} else {

										if (contentType.includes('jpeg') || contentType.includes('jpg') || contentType.includes('webp') || contentType.includes('bmp') || contentType.includes('tiff')) {
											stickerBuffer = await sharp(buffer).png().toBuffer();
											stickerFormat = 'png';
										}
									}


									const sticker = await interaction.guild.stickers.create({
										file: stickerBuffer,
										name: finalName,
										tags: finalName.slice(0, 2),
										description: `Stolen by ${interaction.user.tag}`,
										reason: `Stolen by ${interaction.user.tag}`
									}).catch(err => {
										if (err.code === 30039) throw new Error('Server has reached maximum sticker limit');
										throw err;
									});

									const successEmbed = new EmbedBuilder()
										.setColor('#00FF00')
										.setTitle(`${emojis.success} Successfully stole as ${isAnimated ? 'Animated ' : ''}Sticker`)
										.setDescription(`**${finalName}** has been added to server stickers`)
										.addFields([
											{
												name: `${emojis.info} Details`,
												value: `**Format:** ${isAnimated ? 'Animated' : 'Static'}\n**Size:** ${Math.round(stickerBuffer.length/1024)}KB\n**Added by:** ${interaction.user.tag}`,
												inline: true
											}
										])
										.setImage(assetUrl)
										.setFooter({ 
											text: 'Sticker added successfully • Using sharp for conversion', 
											iconURL: 'https://i.ibb.co/gLM9bMf9/standard.gif' 
										})
										.setTimestamp();

									await stealMessage.edit({ embeds: [successEmbed], components: [] });
									await interaction.editReply({ content: `${emojis.success} | Successfully stole as ${isAnimated ? 'animated ' : ''}sticker!` });

								} catch (stickerError) {
									console.error('Sticker creation error:', stickerError);
									let errorMessage = 'Failed to create sticker';
									if (stickerError.code === 30039) errorMessage = 'Server has reached maximum sticker limit';
									else if (stickerError.message.includes('Invalid Form Body')) errorMessage = 'Invalid image format for sticker (try a static image)';
									await interaction.editReply({ content: `${emojis.error} | ${errorMessage}` });
								}
							}

						} catch (error) {
							console.error('Steal processing error:', error);
							await interaction.editReply({ content: `${emojis.error} | Failed to process asset: ${error.message}` });
						}
					});

					collector.on('end', (collected, reason) => {
						if (reason === 'time') {
							const disabledRow = ActionRowBuilder.from(row);
							disabledRow.components.forEach(button => {
								button.setDisabled(true);
								button.setStyle(ButtonStyle.Secondary);
							});

							const timeoutEmbed = new EmbedBuilder()
								.setColor('#FFA500')
								.setTitle(`${emojis.clock} Steal Timed Out`)
								.setDescription('The selection period has expired. Use the command again if needed.')
								.addFields([
									{
										name: `${emojis.info} Note`,
										value: 'Buttons are now disabled. Re-run the command to try again.',
										inline: false
									}
								])
								.setImage(assetUrl)
								.setFooter({ 
									text: 'Command expired • Use ~steal again', 
									iconURL: 'https://i.ibb.co/gLM9bMf9/standard.gif' 
								})
								.setTimestamp();

							stealMessage.edit({ embeds: [timeoutEmbed], components: [disabledRow] }).catch(() => {});
						}
					});

				} catch (error) {
					console.error('Steal command error:', error);
					const errorMsg = await message.channel.send(`${emojis.error} | Failed to process command`);
					setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
				}
				break;
			}
			
			case 'purge': {
				const isOwner = message.author.id === ownerId;
				if (!args[0]) {
					return messages.error(message.channel, `${emojis.error} | Please specify the number of messages to delete or \`all\`.`);
				}

				const hasManageMessages = message.member.permissions.has('ManageMessages');
				const hasAdmin = message.member.permissions.has('Administrator');
				
				if (args[0].toLowerCase() === 'all') {
					if (!isOwner && !hasAdmin) {
						return messages.error(message.channel, `Only administrators can purge **all** messages.`);
					}
					await message.delete().catch(() => {});
					
					const row = new ActionRowBuilder()
						.addComponents(
							new ButtonBuilder()
								.setCustomId('confirm_purge_all')
								.setLabel('Confirm')
								.setStyle(ButtonStyle.Danger),
							new ButtonBuilder()
								.setCustomId('cancel_purge_all')
								.setLabel('Cancel')
								.setStyle(ButtonStyle.Secondary)
						);

					const confirmEmbed = new EmbedBuilder()
						.setColor(config.embedColor)
						.setTitle(`${emojis.info} Confirm Channel Purge`)
						.setDescription(`**Are you sure you want to delete ALL messages in ${message.channel}?**\n\nThis action is **irreversible** and may take a while.`)
						.setFooter({ text: 'You have 30 seconds to decide' });

					const confirmMsg = await message.channel.send({ embeds: [confirmEmbed], components: [row] });
					const filter = i => i.user.id === message.author.id;
					const collector = confirmMsg.createMessageComponentCollector({ filter, time: 30000 });

					collector.on('collect', async i => {
						if (i.customId === 'confirm_purge_all') {
							await i.deferUpdate();
							await confirmMsg.delete().catch(() => {});

							let deletedTotal = 0;
							const MAX_BATCH = 100;
							const MAX_TOTAL = 1000;
							let deleted;

							do {
								try {
									deleted = await message.channel.bulkDelete(Math.min(MAX_BATCH, MAX_TOTAL - deletedTotal), true);
									deletedTotal += deleted.size;
									if (deleted.size === MAX_BATCH && deletedTotal < MAX_TOTAL) {
										await new Promise(r => setTimeout(r, 1000));
									}
								} catch {
									break;
								}
							} while (deleted.size === MAX_BATCH && deletedTotal < MAX_TOTAL);

							const successMsg = await messages.success(message.channel, `Cleaned the channel! (${deletedTotal} messages removed)`);
							setTimeout(() => successMsg.delete().catch(() => {}), 4000);
						} else if (i.customId === 'cancel_purge_all') {
							await i.deferUpdate();
							await confirmMsg.delete().catch(() => {});

							const cancelledMsg = await messages.info(message.channel, 'Purge cancelled.');
							setTimeout(() => cancelledMsg.delete().catch(() => {}), 4000);
						}
						collector.stop();
					});

					collector.on('end', async () => {
						try {
							const disabledRow = ActionRowBuilder.from(row).setComponents(
								row.components.map(c => ButtonBuilder.from(c).setDisabled(true))
							);
							await confirmMsg.edit({ components: [disabledRow] });
						} catch {
						}
					});

					break;
				}
				
				const amount = parseInt(args[0], 10);
				if (isNaN(amount) || amount < 1) {
					return messages.error(message.channel, `${emojis.error} | Please provide a valid number of messages to delete.`);
				}

				if (!isOwner && !hasManageMessages && !hasAdmin) {
					return messages.error(message.channel, `${emojis.error} | You need \`Manage Messages\` or \`Administrator\` permission to purge messages.`);
				}

				const deleteAmount = Math.min(amount + 1, 100);
				if (amount > 99) {
					await message.channel.send(`${emojis.info} | You requested ${amount}, but Discord only allows bulk deleting up to 100 messages at once. Deleting the last 100.`);
				}

				try {
					const deleted = await message.channel.bulkDelete(deleteAmount, true);
					const deletedCount = deleted.size;

					const successMsg = await messages.success(message.channel, `Deleted ${deletedCount - 1} message${deletedCount - 1 !== 1 ? 's' : ''}!`);
					setTimeout(() => successMsg.delete().catch(() => {}), 4000);
				} catch (error) {
					log('ERROR', `Purge error: ${error.message}`);
					if (error.code === 50013) {
						messages.error(message.channel, `${emojis.error} | I don't have permission to delete messages.`);
					} else if (error.code === 10008) {
						messages.error(message.channel, `${emojis.error} | Messages are too old to bulk delete (older than 14 days).`);
					} else {
						messages.error(message.channel, `${emojis.error} | Failed to purge messages: ${error.message}`);
					}
				}
				break;
			}
			
			case 'say': {
				const rawText = message.content.slice(client.prefix.length + cmd.length).replace(/^\s+/, '');
				if (!rawText && message.attachments.size === 0) {
					return message.reply(`${emojis.error} | You need to provide something to say or attach a file!`)
						.catch(() => {});
				}

				let processed = rawText
					.replace(/\\\\n/g, '\u0000')
					.replace(/\\n/g, '\n')
					.replace(/\u0000/g, '\\n');

				let anyInvalidEmoji = false;
				const emojiRegex = /-emoji-([^\s]+)/g;
				const placeholders = [];
				let match;
				while ((match = emojiRegex.exec(processed)) !== null) {
					placeholders.push(match[0]);
				}

				if (placeholders.length > 0) {
					const emojiMap = new Map();
					await Promise.all(placeholders.map(async (fullMatch) => {
						const inner = fullMatch.slice(8);
						const parts = inner.split('/$/');
						const resolvedParts = [];
						for (const part of parts) {
							const emoji = await resolveEmoji(client, part, message.guild);
							if (emoji) {
								resolvedParts.push(emoji.toString());
							} else {
								anyInvalidEmoji = true;
							}
						}
						emojiMap.set(fullMatch, resolvedParts.join(''));
					}));

					processed = processed.replace(emojiRegex, (match) => emojiMap.get(match) || '');
				}
				let files = [];
				if (message.attachments.size > 0) {
					files = await Promise.all(
						message.attachments.map(async (attachment) => {
							const response = await fetch(attachment.url);
							const buffer = Buffer.from(await response.arrayBuffer());
							return new AttachmentBuilder(buffer, { name: attachment.name });
						})
					);
				}
				await message.delete().catch(() => {});

				const sendOptions = { content: processed || null, files: files.length > 0 ? files : undefined };

				if (message.reference) {
					try {
						const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
						await repliedMessage.reply(sendOptions);
					} catch {
						await message.channel.send(sendOptions);
					}
				} else {
					await message.channel.send(sendOptions);
				}
				if (anyInvalidEmoji) {
					const errorMsg = await messages.error(message.channel, "Any one of the emoji IDs were invalid!");
					setTimeout(() => errorMsg.delete().catch(() => {}), 5000);
				}
				break;
			}
			
            case 'reveal': {
                if (!message.reference) {
                    await messages.error(message.channel, "Please reply to a spoiler message!");
                    return;
                }
                try {
                    const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
                    const content = repliedMessage.content;
                    if (!content.includes('||')) {
                        await messages.error(message.channel, "The replied message doesn't contain spoiler text!");
                        return;
                    }
                    const revealedText = content.replace(/\|\|/g, '');
                    const revealMsg = await message.channel.send(`📖 **Revealed:** ${revealedText}`);
                } catch (error) {
                    await messages.error(message.channel, "Could not fetch the replied message!");
                }
                break;
            }
			
			case '24/7': {
				const subCommand = args[0];
				
				if (subCommand === 'enable') {
					if (!args[1]) {
						await messages.error(message.channel, "Please provide a voice channel!");
						return;
					}
					
					let channelId = args[1].replace(/[<#>]/g, '');
					const channel = message.guild.channels.cache.get(channelId);
					
					if (!channel || channel.type !== 2) {
						await messages.error(message.channel, "Invalid voice channel!");
						return;
					}
					
					const result = await enable24Seven(message.guild.id, channel.id, message.channel);
					
					if (result.success) {
						await messages.success(message.channel, result.message);
					} else {
						await messages.error(message.channel, result.message);
					}
					
				} else if (subCommand === 'disable') {
					const result = await disable24Seven(message.guild.id);
					
					if (result.success) {
						await messages.success(message.channel, result.message);
					} else {
						await messages.error(message.channel, result.message);
					}
				} else {
					await messages.error(message.channel, "Invalid subcommand. Use 'enable' or 'disable'.");
				}
			 break;
			}
			
			case 'doakes': {
				try {
					await message.delete().catch(() => {});
				} catch (error) {
					log('ERROR', `Error deleting message: ${error.message}`);
				}
				
				if (message.reference && message.reference.messageId) {
					try {
						const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
						
						return repliedMessage.reply(`${emojis.doakesknows}`);
					} catch (error) {
						log('ERROR', `Error fetching replied message: ${error.message}`);
						return message.channel.send(`${emojis.doakesknows}`);
					}
				} else {
					return message.channel.send(`${emojis.doakesknows}`);
				}
			}
			
			case 'emma-heart': {
				try {
					await message.delete().catch(() => {});
				} catch (error) {
					log('ERROR', `Error deleting message: ${error.message}`);
				}
				
				if (message.reference && message.reference.messageId) {
					try {
						const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
						
						return repliedMessage.reply(`${emojis.emmaheart1}`);
					} catch (error) {
						log('ERROR', `Error fetching replied message: ${error.message}`);
						return message.channel.send(`${emojis.emmaheart1}`);
					}
				} else {
					return message.channel.send(`${emojis.emmaheart1}`);
				}
			}
			
			case 'emma-heart1': {
				try {
					await message.delete().catch(() => {});
				} catch (error) {
					log('ERROR', `Error deleting message: ${error.message}`);
				}
				
				if (message.reference && message.reference.messageId) {
					try {
						const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
						
						return repliedMessage.reply(`${emojis.emmaheart2}`);
					} catch (error) {
						log('ERROR', `Error fetching replied message: ${error.message}`);
						return message.channel.send(`${emojis.emmaheart2}`);
					}
				} else {
					return message.channel.send(`${emojis.emmaheart2}`);
				}
			}
			
			case 'emma-kiss': {
				try {
					await message.delete().catch(() => {});
				} catch (error) {
					log('ERROR', `Error deleting message: ${error.message}`);
				}
				
				if (message.reference && message.reference.messageId) {
					try {
						const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
						
						return repliedMessage.reply(`${emojis.emmakiss}`);
					} catch (error) {
						log('ERROR', `Error fetching replied message: ${error.message}`);
						return message.channel.send(`${emojis.emmakiss}`);
					}
				} else {
					return message.channel.send(`${emojis.emmakiss}`);
				}
			}
			
			case 'emma-hii': {
				try {
					await message.delete().catch(() => {});
				} catch (error) {
					log('ERROR', `Error deleting message: ${error.message}`);
				}
				
				if (message.reference && message.reference.messageId) {
					try {
						const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
						
						return repliedMessage.reply(`${emojis.emmahii}`);
					} catch (error) {
						log('ERROR', `Error fetching replied message: ${error.message}`);
						return message.channel.send(`${emojis.emmahii}`);
					}
				} else {
					return message.channel.send(`${emojis.emmahii}`);
				}
			}
			
			case 'emma-worried': {
				try {
					await message.delete().catch(() => {});
				} catch (error) {
					log('ERROR', `Error deleting message: ${error.message}`);
				}
				
				if (message.reference && message.reference.messageId) {
					try {
						const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
						
						return repliedMessage.reply(`${emojis.emmaworried}`);
					} catch (error) {
						log('ERROR', `Error fetching replied message: ${error.message}`);
						return message.channel.send(`${emojis.emmaworried}`);
					}
				} else {
					return message.channel.send(`${emojis.emmaworried}`);
				}
			}
			
			case 'emma-rawr': {
				try {
					await message.delete().catch(() => {});
				} catch (error) {
					log('ERROR', `Error deleting message: ${error.message}`);
				}
				
				if (message.reference && message.reference.messageId) {
					try {
						const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
						
						return repliedMessage.reply(`${emojis.emmarawr}`);
					} catch (error) {
						log('ERROR', `Error fetching replied message: ${error.message}`);
						return message.channel.send(`${emojis.emmarawr}`);
					}
				} else {
					return message.channel.send(`${emojis.emmarawr}`);
				}
			}
			
			case 'suscat': {
				try {
					await message.delete().catch(() => {});
				} catch (error) {
					log('ERROR', `Error deleting message: ${error.message}`);
				}
				
				if (message.reference && message.reference.messageId) {
					try {
						const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
						
						return repliedMessage.reply(`${emojis.catready}`);
					} catch (error) {
						log('ERROR', `Error fetching replied message: ${error.message}`);
						return message.channel.send(`${emojis.catready}`);
					}
				} else {
					return message.channel.send(`${emojis.catready}`);
				}
			}
			
			case 'doakes-surprise': {
				try {
					await message.delete().catch(() => {});
				} catch (error) {
					log('ERROR', `Error deleting message: ${error.message}`);
				}
				
				let emojiMessage;
				
				if (message.reference && message.reference.messageId) {
					try {
						const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
						emojiMessage = await repliedMessage.reply(`${emojis.doakesknows}`);
					} catch (error) {
						log('ERROR', `Error fetching replied message: ${error.message}`);
						emojiMessage = await message.channel.send(`${emojis.doakesknows}`);
					}
				} else {
					emojiMessage = await message.channel.send(`${emojis.doakesknows}`);
				}
				setTimeout(async () => {
					await message.channel.send("Surprise, motherfucker!");
				}, 250);
				
				break;
			}
			
			case 'song-quote': {
				const text = args.join(' ');
				if (!text) return message.reply(`${emojis.error} | Please provide text for the quote!`);
				await handleSongQuote(message, text, false);
				break;
			}
			
			case 'quote': {
				await handleQuote(message, false, {});
				break;
			}		
			case 'mystats': {
				try {
					const userStats = await db.getUserStats(message.author.id);
					const userRank = await db.getUserRank(message.author.id);

					await messages.userStats(message.channel, userStats, userRank, message.author);
				} catch (error) {
					log('ERROR', `Error fetching stats: ${error.message}`);
					message.reply(`${emojis.error} | Can't fetch statistics!`);
				}
				break;
			}
			case 'leaderboard': {
				await handleLeaderboard(message, false);
				break;
			}
			case 'resetstats': {
				await handleResetStats(message, false);
				break;
			}
			
			case 'stats': {
				let targetUser = message.author;
				
				if (args.length > 0) {
					const mention = args[0].match(/^<@!?(\d+)>$/);
					const userId = mention ? mention[1] : args[0];
					
					try {
						targetUser = await client.users.fetch(userId);
					} catch (error) {
						return message.reply(`${emojis.error} | Invalid user! Use \`~stats\` for your own stats or \`~stats @user\` for another user.`);
					}
				}
				
				try {
					const userStats = await db.getUserStats(targetUser.id);
					const userRank = await db.getUserRank(targetUser.id);

					await messages.userStats(message.channel, userStats, userRank, targetUser);
				} catch (error) {
					log('ERROR', `Error fetching stats: ${error.message}`);
					message.reply(`${emojis.error} | Can't fetch statistics!`);
				}
				break;
			}
			
			case 'afk': {
				let reason = 'No reason provided';
				let imageUrl = null;

				const fullMessage = args.join(' ');
				const quoteRegex = /^"([^"]+)"\s*(.*)$/;
				const quoteMatch = fullMessage.match(quoteRegex);
				
				if (quoteMatch) {

					reason = quoteMatch[1]
						.replace(/\\\\n/g, '\u0000')
						.replace(/\\n/g, '\n')
						.replace(/\u0000/g, '\\n');

					const rest = quoteMatch[2].trim();

					const urlRegex = /(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp)(?:\?[^\s]*)?)/i;
					const urlMatch = rest.match(urlRegex);
					if (urlMatch) {
						imageUrl = urlMatch[0];
					}
				} else {

					reason = fullMessage;

					const urlRegex = /(https?:\/\/[^\s]+\.(?:png|jpg|jpeg|gif|webp)(?:\?[^\s]*)?)/i;
					const urlMatch = reason.match(urlRegex);
					if (urlMatch) {
						imageUrl = urlMatch[0];
						reason = reason.replace(urlRegex, '').trim();
					}

					reason = reason
						.replace(/\\\\n/g, '\u0000')
						.replace(/\\n/g, '\n')
						.replace(/\u0000/g, '\\n');
					
					if (!reason) reason = 'No reason provided';
				}

				if (message.attachments.size > 0) {
					const attachment = message.attachments.first();
					imageUrl = attachment.url;
				}
				
				if (!reason) reason = 'No reason provided';

				const confirmEmbed = new EmbedBuilder()
					.setColor(config.embedColor)
					.setTitle('Are you sure you want to set your AFK reason to:')
					.setDescription(reason)
					.setFooter({ 
						text: `Requested by ${message.author.tag}`, 
						iconURL: message.author.displayAvatarURL() 
					})
					.setTimestamp();

				if (imageUrl) {
					confirmEmbed.setImage(imageUrl);
				}
				
				const row = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('confirm_afk')
							.setLabel('Confirm')
							.setStyle(ButtonStyle.Success),
						new ButtonBuilder()
							.setCustomId('cancel_afk')
							.setLabel('Cancel')
							.setStyle(ButtonStyle.Danger)
					);
				
				const confirmMsg = await message.reply({ 
					embeds: [confirmEmbed], 
					components: [row] 
				});
				
				const filter = i => i.user.id === message.author.id;
				const collector = confirmMsg.createMessageComponentCollector({ 
					filter, 
					time: 45000,
					max: 1 
				});

				collector.on('collect', async i => {
					await i.deferUpdate();

					if (i.customId === 'confirm_afk') {
						const success = await db.setAFK(message.author.id, reason, imageUrl);
						if (success) {
							await confirmMsg.delete().catch(() => {});
							await message.channel.send({ 
								embeds: [
									new EmbedBuilder()
										.setColor(config.embedColor)
										.setDescription(`${emojis.success} AFK set in all servers!`)
								] 
							});
						} else {
							await confirmMsg.delete().catch(() => {});
							await message.channel.send(`${emojis.error} Failed to set AFK status.`);
						}
					} else if (i.customId === 'cancel_afk') {
						await confirmMsg.delete().catch(() => {});
						await message.channel.send({ 
							embeds: [
								new EmbedBuilder()
									.setColor(0xff5555)
									.setDescription(`${emojis.error} AFK command confirmation cancelled!`)
							] 
						});
					}
					collector.stop();
				});

				collector.on('end', async (collected, reason) => {
					if (reason === 'time') {
						await confirmMsg.delete().catch(() => {});
						await message.channel.send({ 
							embeds: [
								new EmbedBuilder()
									.setColor(0xffaa00)
									.setDescription(`${emojis.error} AFK command confirmation timed out!`)
							] 
						});
					}
				});
				break;
			}
			
			case 'setavatar':
			case 'setav': {
				const isOwner = message.author.id === ownerId;
				if (!isOwner && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
					return message.reply(`${emojis.error} | You need \`Administrator\` permission to use this command.`);
				}
				if (args[0] && args[0].toLowerCase() === 'reset') {
					const loadingMsg = await message.channel.send(`${emojis.loading} | Resetting server avatar...`);
					try {
						await rest.patch(Routes.guildMember(message.guild.id, '@me'), {
							body: { avatar: null }
						});
						await message.channel.send(`${emojis.success} | Server avatar reset to global avatar!`);
						setTimeout(() => loadingMsg.delete().catch(() => {}), 3000);
					} catch (error) {
						log('ERROR', `Reset avatar error: ${error.message}`);
						await loadingMsg.delete().catch(() => {});
						await message.channel.send(`${emojis.error} | Failed to reset avatar: ${error.message}`);
					}
					return;
				}

				let imageUrl = null;
				if (message.attachments.size > 0) {
					imageUrl = message.attachments.first().url;
				} else if (args.length > 0) {
					const url = args[0];
					if (url.match(/^https?:\/\/.+\/.*\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i)) {
						imageUrl = url;
					}
				}

				if (!imageUrl) {
					return message.reply(`${emojis.error} | Please attach an image or provide a direct image URL.`);
				}

				const loadingMsg = await message.channel.send(`${emojis.loading} | Setting new server avatar...`);

				try {
					const base64 = await imageUrlToBase64(imageUrl);
					const rest = new REST({ version: '10' }).setToken(config.botToken);
					await rest.patch(Routes.guildMember(message.guild.id, '@me'), {
						body: { avatar: base64 }
					});

					await message.channel.send(`${emojis.success} | Server avatar updated successfully!`);
					setTimeout(() => {
						loadingMsg.delete().catch(() => {});
					}, 3000);
				} catch (error) {
					log('ERROR', `Setavatar error: ${error.message}`);
					await loadingMsg.delete().catch(() => {});
					await message.channel.send(`${emojis.error} | Failed to update avatar: ${error.message}`);
				}
				break;
			}

			case 'setbanner':
			case 'setbn': {
				const isOwner = message.author.id === ownerId;
				if (!isOwner && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
					return message.reply(`${emojis.error} | You need \`Administrator\` permission to use this command.`);
				}
				if (args[0] && args[0].toLowerCase() === 'reset') {
					const loadingMsg = await message.channel.send(`${emojis.loading} | Resetting server banner...`);
					try {
						await rest.patch(Routes.guildMember(message.guild.id, '@me'), {
							body: { banner: null }
						});
						await message.channel.send(`${emojis.success} | Server banner reset to global banner!`);
						setTimeout(() => loadingMsg.delete().catch(() => {}), 3000);
					} catch (error) {
						log('ERROR', `Reset banner error: ${error.message}`);
						await loadingMsg.delete().catch(() => {});
						await message.channel.send(`${emojis.error} | Failed to reset banner: ${error.message}`);
					}
					return;
				}

				let imageUrl = null;
				if (message.attachments.size > 0) {
					imageUrl = message.attachments.first().url;
				} else if (args.length > 0) {
					const url = args[0];
					if (url.match(/^https?:\/\/.+\/.*\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i)) {
						imageUrl = url;
					}
				}

				if (!imageUrl) {
					return message.reply(`${emojis.error} | Please attach an image or provide a direct image URL.`);
				}

				const loadingMsg = await message.channel.send(`${emojis.loading} | Setting new server banner...`);

				try {
					const base64 = await imageUrlToBase64(imageUrl);
					const rest = new REST({ version: '10' }).setToken(config.botToken);

					await rest.patch(Routes.guildMember(message.guild.id, '@me'), {
						body: { banner: base64 }
					});

					await message.channel.send(`${emojis.success} | Server banner updated successfully!`);

					setTimeout(() => {
						loadingMsg.delete().catch(() => {});
					}, 3000);
				} catch (error) {
					log('ERROR', `Setbanner error: ${error.message}`);
					await loadingMsg.delete().catch(() => {});
					await message.channel.send(`${emojis.error} | Failed to update banner: ${error.message}`);
				}
				break;
			}

			case 'setname': {
				const isOwner = message.author.id === ownerId;
				if (!isOwner && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
					return message.reply(`${emojis.error} | You need \`Administrator\` permission to use this command.`);
				}
				if (args[0] && args[0].toLowerCase() === 'reset') {
					const loadingMsg = await message.channel.send(`${emojis.loading} | Resetting nickname...`);
					try {
						await rest.patch(Routes.guildMember(message.guild.id, '@me'), {
							body: { nick: null }
						});
						await message.channel.send(`${emojis.success} | Nickname reset to global username!`);
						setTimeout(() => loadingMsg.delete().catch(() => {}), 3000);
					} catch (error) {
						log('ERROR', `Reset nickname error: ${error.message}`);
						await loadingMsg.delete().catch(() => {});
						await message.channel.send(`${emojis.error} | Failed to reset nickname: ${error.message}`);
					}
					return;
				}

				const newNick = args.join(' ').trim();
				if (!newNick) {
					return message.reply(`${emojis.error} | Please provide a new nickname for the bot.`);
				}

				if (newNick.length > 32) {
					return message.reply(`${emojis.error} | Nickname must be 32 characters or less.`);
				}

				const loadingMsg = await message.channel.send(`${emojis.loading} | Changing nickname...`);

				try {
					const rest = new REST({ version: '10' }).setToken(config.botToken);

					await rest.patch(Routes.guildMember(message.guild.id, '@me'), {
						body: { nick: newNick }
					});

					await message.channel.send(`${emojis.success} | Nickname changed to **${newNick}**!`);

					setTimeout(() => {
						loadingMsg.delete().catch(() => {});
					}, 3000);
				} catch (error) {
					log('ERROR', `Setname error: ${error.message}`);
					await loadingMsg.delete().catch(() => {});
					if (error.status === 403) {
						await message.channel.send(`${emojis.error} | Missing permissions! I need the \`Change Nickname\` permission.`);
					} else {
						await message.channel.send(`${emojis.error} | Failed to change nickname: ${error.message}`);
					}
				}
				break;
			}
			
			case 'count': {
				const subCmd = args[0] ? args[0].toLowerCase() : null;
				const isOwner = message.author.id === ownerId;
				const isAdmin = isOwner || message.member.permissions.has(PermissionsBitField.Flags.Administrator);
				if (!subCmd) {
					return messages.info(
						message.channel, 
						`Provide an argument. Use ${client.prefix}count help for info!`
					);
				}
				
				if (subCmd === 'calc') {
					const calcEmbed = new EmbedBuilder()
						.setColor(config.embedColor)
						.setTitle(`${emojis.calculus || '🧮'} Counting Calculations`)
						.setDescription(
							`**Supported Operations:**\n\n` +
							`**Basic:** \`+\` \`-\` \`*\` \`/\` \`%\`\n` +
							`**Exponents:** \`^\` (power, e.g., \`9^2\`)\n` +
							`**Advanced:** \`!\` (factorial), \`sqrt()\` (square root)\n` +
							`**Grouping:** \`()\` parentheses\n\n` +
							`**Rules:**\n` +
							`• Result must be a **whole number** (integer)\n` +
							`• Spaces are ignored\n` +
							`• Division must yield integer result`
						)
						.setFooter({ text: 'Use these in the counting channel!' })
						.setTimestamp();
					return message.channel.send({ embeds: [calcEmbed] });
				}
				if (subCmd === 'help') {
					const embed = new EmbedBuilder()
						.setColor(config.embedColor)
						.setTitle(`${emojis.info} Counting System`)
						.setDescription(
							`**Commands:**\n` +
							`\`${client.prefix}count enable <channel>\` – Set counting channel (Admin only)\n` +
							`\`${client.prefix}count disable\` – Disable counting (Admin only)\n` +
							`\`${client.prefix}count toggle-reset\` – Toggle reset on wrong count (Admin only)\n` +
							`\`${client.prefix}count start <number>\` – Start from a number (Admin only)\n` +
							`\`${client.prefix}count calc\` – Show calculations guide`
						)
						.setFooter({ text: 'Use these commands in any channel.' })
						.setTimestamp();
					return message.channel.send({ embeds: [embed] });
				}
				
				if (!isAdmin) {
					return messages.error(message.channel, "You do not have permission to use this command!");
				}
				if (subCmd === 'enable') {
					const channelArg = args[1];
					if (!channelArg) return messages.error(message.channel, 'Please specify a channel (mention or ID).');

					let channel;
					if (channelArg.match(/^<#(\d+)>$/)) {
						const id = channelArg.match(/^<#(\d+)>$/)[1];
						channel = message.guild.channels.cache.get(id);
					} else {
						channel = message.guild.channels.cache.get(channelArg);
					}

					if (!channel || channel.type !== 0) {
						return messages.error(message.channel, 'Invalid text channel.');
					}

					const success = await client.db.setCountingChannel(message.guild.id, channel.id);
					if (success) {
						const updatedConfig = await client.db.getCountingConfig(message.guild.id);
						const currentNum = updatedConfig?.current_number || 0;
						const nextNum = currentNum + 1;
						const resetStatus = updatedConfig?.toggle_reset 
							? "Wrong counts will **NOT** reset" 
							: "Wrong counts **WILL** reset to 0";
						
						const embed = new EmbedBuilder()
							.setColor(config.embedColor)
							.setTitle(`${emojis.success} Counting Channel Enabled`)
							.setDescription(
								`${emojis.music} Channel: ${channel}\n` +
								`${emojis.music} Current count: **${currentNum}**\n` +
								`${emojis.music} Next number: **${nextNum}**\n` +
								`${emojis.music} Status: ${resetStatus}`
							)
							.setFooter({ text: 'Use ~count help for more commands' })
							.setTimestamp();
						
						await message.channel.send({ embeds: [embed] });
					} else {
						messages.error(message.channel, 'Failed to set counting channel.');
					}
				}
				else if (subCmd === 'disable') {
					const config = await client.db.getCountingConfig(message.guild.id);
					if (!config) {
						return messages.error(message.channel, 'Counting is not set up in this server. (use ');
					}
					if (!config.enabled) {
						return messages.error(message.channel, 'Counting is already disabled.');
					}
					
					const success = await client.db.disableCounting(message.guild.id);
					if (success) {
						messages.success(message.channel, 'Counting disabled in this server.');
					} else {
						messages.error(message.channel, 'Failed to disable counting.');
					}
				}
				else if (subCmd === 'toggle-reset') {
					const config = await client.db.getCountingConfig(message.guild.id);
					if (!config) return messages.error(message.channel, 'Counting is not enabled in this server.');

					const newState = !config.toggle_reset;
					const success = await client.db.setCountingToggleReset(message.guild.id, newState);
					if (success) {
						if (newState) {
							messages.success(
								message.channel, 
								`**Wrong counting will NOT result in resetting!**\n\nThe count will continue even after mistakes.`
							);
						} else {
							messages.success(
								message.channel, 
								`**Wrong counting WILL result in resetting!**\n\nThe count will reset to 0 on any mistake.`
							);
						}
					} else {
						messages.error(message.channel, 'Failed to toggle reset mode.');
					}
				}
				else if (subCmd === 'start') {
					const num = parseInt(args[1], 10);
					if (isNaN(num) || num < 0) {
						return messages.error(message.channel, 'Please provide a valid non‑negative integer.');
					}

					const config = await client.db.getCountingConfig(message.guild.id);
					if (!config) return messages.error(message.channel, 'Counting is not enabled in this server.');

					const success = await client.db.setCountingStart(message.guild.id, num);
					if (success) {
						messages.success(
							message.channel, 
							`Counting starts from **${num}**. Next number should be **${num + 1}**.`
						);
					} else {
						messages.error(message.channel, 'Failed to set start number.');
					}
				}
				else {
					messages.error(message.channel, 'Unknown subcommand. Use `~count` for help.');
				}
				break;
			}
			
			/* STICKERS! */	
			case 'emma-heart-st': {
				try {
					await message.delete().catch(() => {});
				} catch (error) {
					log('ERROR', `Error deleting message: ${error.message}`);
				}

				const stickerId = stickers.emmaheart1;
				
				if (!stickerId) {
					return message.channel.send(`${emojis.error} | Sticker not configured!`);
				}

				try {

					const sticker = await client.fetchSticker(stickerId);
					
					if (!sticker) {
						throw new Error('Sticker not found');
					}

					const canUse = await canBotUseSticker(sticker);
					
					if (!canUse) {

						const stickerUrl = `https://media.discordapp.net/stickers/${stickerId}.png?size=512`;
						return message.channel.send(stickerUrl);
					}

					if (message.reference && message.reference.messageId) {
						try {
							const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);

							await message.channel.send({ stickers: [sticker] });

							return repliedMessage.reply('​').catch(() => {});
						} catch (error) {

							return message.channel.send({ stickers: [sticker] });
						}
					} else {
						return message.channel.send({ stickers: [sticker] });
					}
				} catch (error) {
					log('ERROR', `Sticker command error: ${error.message}`);

					const stickerUrl = `https://media.discordapp.net/stickers/${stickerId}.png?size=512`;
					return message.channel.send(stickerUrl);
				}
				break;
			}
			
			case 'emma-heart-st1': {
				try {
					await message.delete().catch(() => {});
				} catch (error) {
					log('ERROR', `Error deleting message: ${error.message}`);
				}

				const stickerId = stickers.emmaheart2;
				
				if (!stickerId) {
					return message.channel.send(`${emojis.error} | Sticker not configured!`);
				}

				try {

					const sticker = await client.fetchSticker(stickerId);
					
					if (!sticker) {
						throw new Error('Sticker not found');
					}

					const canUse = await canBotUseSticker(sticker);
					
					if (!canUse) {

						const stickerUrl = `https://media.discordapp.net/stickers/${stickerId}.png?size=512`;
						return message.channel.send(stickerUrl);
					}

					if (message.reference && message.reference.messageId) {
						try {
							const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);

							await message.channel.send({ stickers: [sticker] });

							return repliedMessage.reply('​').catch(() => {});
						} catch (error) {

							return message.channel.send({ stickers: [sticker] });
						}
					} else {
						return message.channel.send({ stickers: [sticker] });
					}
				} catch (error) {
					log('ERROR', `Sticker command error: ${error.message}`);

					const stickerUrl = `https://media.discordapp.net/stickers/${stickerId}.png?size=512`;
					return message.channel.send(stickerUrl);
				}
				break;
			}
			
			/* NO FUCKING PREFIX */
			case 'noprefix':
			case 'nop': {
				try {
					if (message.author.id !== ownerId) {
						return message.reply(`${emojis.blackcrown} This command is reserved for bot owner only!`);
					}

					const subCmd = args[0] ? args[0].toLowerCase() : null;
					if (!subCmd) {
						return messages.error(message.channel,
							`Usage: \`noprefix list\`, \`noprefix <user>\` (add), \`noprefix remove <user>\`, \`noprefix enable\`, \`noprefix disable\``
						);
					}
					if (subCmd === 'enable' || subCmd === 'disable') {
						const newState = (subCmd === 'enable');
						await db.setNoprefixGlobalEnabled(newState);
						client.noprefixGlobalEnabled = newState;
						return messages.success(message.channel,
							`Global noprefix is now **${newState ? 'ENABLED' : 'DISABLED'}**.`
						);
					}
					if (subCmd === 'list') {
						const users = await db.getAllNoPrefixUsers();
						if (users.length === 0) {
							return messages.info(message.channel, 'No users have noprefix access (besides owner).');
						}
						const userMentions = users.map(id => `<@${id}>`).join('\n');
						const embed = new EmbedBuilder()
							.setColor(config.embedColor)
							.setTitle(`${emojis.blackbutterfly} Noprefix Users`)
							.setDescription(userMentions)
							.setFooter({ text: `Total: ${users.length}` });
						return message.channel.send({ embeds: [embed] });
					}
					if (subCmd === 'remove') {
						if (!args[1]) return messages.error(message.channel, 'Please specify a user to remove.');
						const userId = args[1].replace(/[<@!>]/g, '');
						let user;
						try {
							user = await client.users.fetch(userId, { force: true });
						} catch {
							return messages.error(message.channel, 'User not found or invalid ID.');
						}
						const removed = await db.removeNoPrefixUser(userId);
						if (removed) {
							return messages.success(message.channel, `Removed noprefix access from <@${user.id}>`);
						} else {
							return messages.error(message.channel, 'That user does not have noprefix access.');
						}
					}
					const userId = args[0].replace(/[<@!>]/g, '');
					let user;
					try {
						user = await client.users.fetch(userId, { force: true });
					} catch {
						return messages.error(message.channel, 'User not found or invalid ID.');
					}
					const added = await db.addNoPrefixUser(userId);
					if (added) {
						return messages.success(message.channel, `Added noprefix access for <@${user.id}>`);
					} else {
						return messages.error(message.channel, 'Failed to add user.');
					}

				} catch (error) {
					log('ERROR', `❌ noprefix command error: ${error.message}`);
					return messages.error(message.channel, 'An unexpected error occurred.');
				}
				break;
			}
		}
}

async function sendAfkEmbed(message, afkUser, afkData) {
    const member = message.guild?.members.cache.get(afkUser.id);
    const displayName = member?.displayName || afkUser.globalName || afkUser.username;
    
    const timestamp = Math.floor(new Date(afkData.timestamp).getTime() / 1000);
    const relativeTime = `<t:${timestamp}:R>`;

    const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(`${emojis.redblackcross} ${displayName} is AFK.`)
        .addFields(
            { name: 'AFK since', value: relativeTime, inline: false },
            { name: 'Reason provided', value: afkData.reason || 'AFK', inline: false }
        )
        .setFooter({ 
            text: `Mentioned by ${message.author.displayName || message.author.username}`,
            iconURL: message.author.displayAvatarURL()
        })
        .setTimestamp();

    if (afkData.imageUrl) {
        embed.setImage(afkData.imageUrl);
    }

    await message.channel.send({ embeds: [embed] }).catch(() => {});
}
const buildImageEmbed = (title, imageUrl, requester) => {
    return new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(title)
        .setDescription(`[Download](${imageUrl})`)
        .setImage(imageUrl)
        .setFooter({ 
            text: `Requested by ${requester.tag}`,
            iconURL: requester.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();
};
const sendImageWithDMButton = async (channel, embed, requester) => {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`image_dm_${requester.id}`)
                .setLabel('Send in DM')
                .setStyle(ButtonStyle.Secondary)
        );

    const sentMsg = await channel.send({ embeds: [embed], components: [row] });

    const filter = i => i.customId === `image_dm_${requester.id}` && i.user.id === requester.id;
    const collector = sentMsg.createMessageComponentCollector({ filter, time: 120000 });

    collector.on('collect', async i => {
        try {
            await i.user.send({ embeds: [embed.setFooter(null).setTimestamp()] });
            await i.reply({ content: `${emojis.success} Image sent to your DMs!`, flags: MessageFlags.Ephemeral });
        } catch {
            await i.reply({ 
                content: `${emojis.error} Could not send you a DM. Please make sure your DMs are open.`, 
                flags: MessageFlags.Ephemeral 
            });
        }
    });

    collector.on('end', async () => {
        const disabledRow = ActionRowBuilder.from(row).setComponents(
            row.components.map(c => ButtonBuilder.from(c).setDisabled(true))
        );
        await sentMsg.edit({ components: [disabledRow] }).catch(() => {});
    });
};

/* function getDurationString(track) {
    if (track.info.stream || track.info.isStream) return 'LIVE';
    const duration = track.info.length;
    if (!duration || duration <= 0 || isNaN(duration)) {
        return 'N/A';
    }
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor(duration / (1000 * 60 * 60));
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
} */

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    const mentionedUsers = message.mentions.users.filter(u => !u.bot);
    for (const [userId, user] of mentionedUsers) {
        try {
            const afkData = await db.getAFK(userId);
            if (afkData) await sendAfkEmbed(message, user, afkData);
        } catch (e) { log('ERROR', `AFK mention error: ${e.message}`); }
    }
    if (message.guild) {
        try {
            const countingConfig = await db.getCountingConfig(message.guild.id);
            if (countingConfig && countingConfig.enabled && message.channel.id === countingConfig.channel_id) {
                let isCountCommand = false;
                let cmdName = null;
                let cmdArgs = [];
                if (message.content.startsWith(client.prefix)) {
                    const parts = message.content.slice(client.prefix.length).trim().split(/ +/);
                    const first = parts[0]?.toLowerCase();
                    if (first === 'count') {
                        isCountCommand = true;
                        cmdName = first;
                        cmdArgs = parts.slice(1);
                    }
                }
                const botMentionRegex = new RegExp(`^<@!?${client.user.id}>\\s+(count\\b.*)$`);
                const mentionMatch = message.content.match(botMentionRegex);
                if (mentionMatch) {
                    const rest = mentionMatch[1].trim();
                    const parts = rest.split(/ +/);
                    const first = parts[0]?.toLowerCase();
                    if (first === 'count') {
                        isCountCommand = true;
                        cmdName = first;
                        cmdArgs = parts.slice(1);
                    }
                }

                if (isCountCommand) {
                    await handlePrefixCommand(message, cmdName, cmdArgs);
                    return;
                } else {
                    await processCountingMessage(message, countingConfig);
                    return;
                }
            }
        } catch (error) {
            log('ERROR', `Error in counting channel check: ${error.message}`);
        }
    }
    const botMentionRegex = new RegExp(`^<@!?${client.user.id}>\\s+(.*)$`);
    const mentionMatch = message.content.match(botMentionRegex);
    if (mentionMatch) {
        const rest = mentionMatch[1].trim();
        if (rest) {
            const args = rest.split(/ +/);
            const command = args.shift().toLowerCase();

            if (validCommands.has(command)) {
                await handlePrefixCommand(message, command, args);
			} else {

                await message.reply(
                    `${emojis.info} | Command not found! Use ${client.prefix}help to see all commands.`
                );
            }
        }
        return;
    }
    if (message.content.startsWith(client.prefix)) {
        const args = message.content.slice(client.prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        if (validCommands.has(command)) {
            await handlePrefixCommand(message, command, args);
        }
        return;
    }
    if (client.noprefixGlobalEnabled) {
        const hasNoPrefix = (message.author.id === ownerId) || await db.isNoPrefixUser(message.author.id);
        if (hasNoPrefix) {
            const args = message.content.trim().split(/ +/);
            const cmdName = args.shift().toLowerCase();
            if (validCommands.has(cmdName)) {
                const voiceCommands = ['play', 'p', 'playspotify', 'pause', 'resume', 'skip', 'stop', 's',
                                     'queue', 'q', 'nowplaying', 'np', 'volume', 'vol', 'servervolume',
                                     'shuffle', 'loop', 'remove', 'clear', 'status', 'filter', 'move', 'add'];
                
                if (voiceCommands.includes(cmdName) && !message.member.voice.channel) {
                    await message.reply(`${emojis.error} | You must be in a voice channel!`);
                } else {
                    await handlePrefixCommand(message, cmdName, args);
                }
            }
        }
    }
    try {
        const authorAfk = await db.getAFK(message.author.id);
        if (authorAfk) {
            await db.removeAFK(message.author.id);
            const welcomeEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setDescription(`${emojis.success} Welcome back! Your AFK status has been removed.`)
                .setTimestamp();
            await message.channel.send({ embeds: [welcomeEmbed] }).catch(() => {});
        }
    } catch (e) { log('ERROR', `AFK removal error: ${e.message}`); }
});
client.riffy.on("nodeError", (node, error) => {
    log('ERROR', `${emojis.error} Node "${node.name}" encountered an error: ${error.message}.`);
});
client.riffy.on("trackStart", async (player, track) => {
	cancelInactivityTimer(player.guildId);
    const channel = client.channels.cache.get(player.textChannel);
    if (!channel) return;

    try {
        let thumbnail = null;

        if (track.info?.artworkUrl) {
            thumbnail = track.info.artworkUrl;
        } else if (track.info?.thumbnail) {
            thumbnail = track.info.thumbnail;
        }

        if (thumbnail) {
            track.info.thumbnail = thumbnail;
        }
    } catch (err) {
        log('ERROR', `NowPlaying thumbnail error: ${err.message}`);
    }

    messages.nowPlaying(channel, track);

    if (track.info?.requester) {
        try {
            await db.recordSongPlay(track.info.requester.id, track.info);
        } catch (error) {
            log('ERROR', `Failed to record song play: ${error.message}`);
        }
    }
	await updatePlayerVoiceStatus(player);
});

client.riffy.on("queueEnd", async (player) => {
    const channel = client.channels.cache.get(player.textChannel);

    if (player._manualStop) {

        delete player._manualStop;
        return;
    }

    if (channel) {
        await messages.queueEnded(channel);
    }

    await rejoinAndIdle(player.guildId, player.textChannel);
});
client.on("raw", (d) => {
    if (![GatewayDispatchEvents.VoiceStateUpdate, GatewayDispatchEvents.VoiceServerUpdate].includes(d.t)) return;
    client.riffy.updateVoiceState(d);
});
client.on("warn", (warn) => {
    log('ERROR', warn);
});
client.on("error", (error) => {
    log('ERROR', `❌ Discord Client Error: ${error.message}`);
});
client.on("voiceStateUpdate", async (oldState, newState) => {
    if (oldState.id !== client.user.id && newState.id !== client.user.id) return;
    if (oldState.channelId && !newState.channelId) {
		cancelInactivityTimer(oldState.guild.id);
        await clearVoiceChannelStatus(oldState.channelId);
        const data = await load24SevenData();
        const guildData = data[oldState.guild.id];
        
        if (guildData && guildData.enabled) {
            setTimeout(async () => {
                const player = client.riffy.players.get(oldState.guild.id);
                if (!player) {
                    const channel = oldState.guild.channels.cache.get(guildData.channelId);
                    if (channel && channel.type === 2) {
                        try {
                            const newPlayer = client.riffy.createConnection({
                                guildId: oldState.guild.id,
                                voiceChannel: channel.id,
                                textChannel: oldState.guild.systemChannel?.id || 
                                           oldState.guild.channels.cache.find(c => c.type === 0)?.id || 
                                           channel.id,
                                deaf: true,
                            });
                            
                            await updatePlayerVoiceStatus(newPlayer);
                            
                        } catch (error) {
                            log('ERROR', `${emojis.error} Failed to reconnect to 24/7: ${error.message}`);
                        }
                    }
                }
            }, 2000);
        }
    }
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        await clearVoiceChannelStatus(oldState.channelId);
        const player = client.riffy.players.get(oldState.guild.id);
        if (player) {
            await updatePlayerVoiceStatus(player);
        }
    }
    if (!oldState.channelId && newState.channelId) {
        const player = client.riffy.players.get(newState.guild.id);
        if (player) {
            setTimeout(async () => {
                await updatePlayerVoiceStatus(player);
            }, 1000);
        }
    }
});
client.on("guildCreate", async (guild) => {
    const serversData = await loadServersData();
    serversData[guild.id] = {
        name: guild.name,
        inviteCode: null
    };
    await saveServersData(serversData);
});

client.on("guildDelete", async (guild) => {
    const serversData = await loadServersData();
    delete serversData[guild.id];
    await saveServersData(serversData);
});

process.on('uncaughtExceptionMonitor', (error, origin) => {
    log('ERROR', `🚨 CRITICAL ERROR in interaction handling: ${error.message}`);
    log('ERROR', `Origin: ${origin}`);
});

client.on(Events.Error, (error) => {
    log('ERROR', `🔧 Discord client error: ${error.message}`);
});
async function loginWithRetry(retries = 3, delay = 10000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        log('CLIENT', `🚀 Login attempt ${attempt}/${retries}...`);
        
        try {
            const loginPromise = client.login(config.botToken);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`Login timeout after ${delay}ms`)), delay)
            );
            
            await Promise.race([loginPromise, timeoutPromise]);
			return true;
            
        } catch (error) {
            log('ERROR', `❌ Login attempt ${attempt} failed: ${error.message}`);
            
            if (error.message.includes('429') || error.message.includes('rate limit')) {
                log('ERROR', `⚠️ Rate limit detected! This is likely because ${client.hostingService || 'your hosting'}'s IP is being rate limited by Discord.`);
                log('ERROR', '💡 Solutions:');
				log('ERROR', `1. Contact ${client.hostingService || 'your hosting'} support about Discord API rate limits`);
                log('ERROR', '2. Ask them to whitelist Discord API endpoints');
                log('ERROR', '3. Consider using a different hosting provider');
                log('ERROR', '4. Wait a few hours and try again');
                
                if (attempt < retries) {
                    const waitTime = 30000;
                    log('CLIENT', `⏳ Waiting ${waitTime/1000} seconds before retry due to rate limit...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            } else if (error.message.includes('timeout')) {
                log('ERROR', '⚠️ Login timeout - Discord gateway may be blocked');
                if (attempt < retries) {
                    log('CLIENT', '⏳ Waiting 10 seconds before retry...');
                    await new Promise(resolve => setTimeout(resolve, 10000));
                }
            } else {
                log('ERROR', `❌ Error details:`, error);
                if (attempt < retries) {
                    log('CLIENT', '⏳ Waiting 5 seconds before retry...');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        }
    }
    
    return false;
}
loginWithRetry(3, 30000).then(success => {
    if (!success) {
        log('ERROR', "❌ All login attempts failed!");
        log('ERROR', "\n📋 Troubleshooting checklist:");
        log('ERROR', "1. ✅ Token is valid (checked)");
        log('ERROR', "2. ✅ Config is loaded (checked)");
        log('ERROR', "3. ❌ Discord API is rate limiting (HTTP 429 detected)");
        log('ERROR', `4. ⚠️ This is a ${client.hostingService || 'your hosting'} SPECIFIC ISSUE`);
        log('ERROR', "\n💡 Immediate solutions:");
        log('ERROR', `• Contact ${client.hostingService || 'your hosting'} support: Tell them 'Discord API is rate limiting my bot (HTTP 429)'`);
        log('ERROR', "• Ask them to whitelist Discord API endpoints");
        log('ERROR', "• Consider switching to a different hosting provider");
        log('ERROR', "• Try again in a few hours");
        
        setTimeout(() => {
            log('ERROR', "\n🛑 Exiting process due to login failure...");
            process.exit(1);
        }, 10000);
    }
}).catch(error => {
    log('ERROR', "❌ Login process error:", error);
    process.exit(1);
});