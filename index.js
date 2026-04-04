require("dotenv").config();
const config = require("./config.js");
const { displayAsciiArt } = require('./console/ascii.js');
const { log, line, setBotReady } = require('./utils/logger.js');

// Display ASCII art
displayAsciiArt();

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
    Events,
    InteractionType,
    EmbedBuilder,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
    AttachmentBuilder,
    StringSelectMenuBuilder
} = require("discord.js");
const { Riffy } = require("riffy");
const { Spotify } = require("riffy-spotify");
const messages = require("./utils/messages.js");
const { hasMoveMembersPermission, hasMuteMembersPermission, hasDeafenMembersPermission } = require('./utils/permissions.js');
const { formatDuration, getDurationString, extractThumbnail } = require('./utils/formatting.js');
const emojis = require("./emojis.js");
const db = require('./database/database.js');
const StatusManager = require('./utils/statusManager.js');
const { validate } = require('./handlers/commandValidator');
const { registerSlashCommands } = require('./handlers/commandRegister');
const { createQuoteImage } = require("./utils/quoteGenerator");

let commandTimeouts = new Map();

process.on('unhandledRejection', (reason, promise) => {
    log('ERROR', `⚠️ Unhandled Rejection at: ${promise} reason: ${reason}`);
    for (const [interactionId, timeout] of commandTimeouts.entries()) {
        clearTimeout(timeout);
        commandTimeouts.delete(interactionId);
    }
});

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
    partials: [Partials.Channel],
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
client.prefix = config.prefix || "~";
client.original24SevenChannels = new Map();
client.inactivityTimers = new Map();
client.quoteOptions = new Map();
client.guildPrefixes = new Map();

client.getGuildPrefix = (guildId) => {
    return guildId && client.guildPrefixes.has(guildId)
        ? client.guildPrefixes.get(guildId)
        : config.prefix;
};

client.emojis = emojis;
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

async function save24SevenData(data) {
    await db.save24SevenData(data);
}
async function loadServersData() {
    return await db.loadServersData();
}
async function saveServersData(data) {
    await db.saveServersData(data);
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
    rest: {
        timeout: 30000,
        retries: 3
    },
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
            }).on('error', () => tryNextService())
              .on('timeout', () => tryNextService());
        }
        tryNextService();
    });
}

async function handleInteractionTimeout(interaction, timeout = 15000) {
    return new Promise((resolve) => {
        const timeoutId = setTimeout(async() => {
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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function isInviteValid(code) {
    if (!code || ['N/A', 'PERMISSION_DENIED', 'NO_CHANNEL', 'ERROR'].includes(code)) return false;
    try {
        await client.fetchInvite(code);
        return true;
    } catch (error) {
        if (error.status === 404) return false;
        return false;
    }
}

function findInviteChannel(guild) {
    let channel = guild.channels.cache.find(ch =>
        (ch.type === 0 || ch.type === 2) &&
        ch.permissionsFor(guild.members.me).has('CreateInstantInvite') &&
        ch.viewable
    );
    if (!channel) {
        channel = guild.channels.cache.find(ch => ch.type === 0 && ch.viewable);
    }
    return channel;
}

async function updateServerInvites() {
    const serversData = await loadServersData();
    const guilds = client.guilds.cache;

    for (const guild of guilds.values()) {
        let updated = false;
        let newCode = null;

        if (!serversData[guild.id]) {
            serversData[guild.id] = { name: guild.name, inviteCode: null };
        }

        if (serversData[guild.id].name !== guild.name) {
            serversData[guild.id].name = guild.name;
            updated = true;
        }

        const storedCode = serversData[guild.id].inviteCode;
        const isValid = await isInviteValid(storedCode);

        if (!isValid) {
            const channel = findInviteChannel(guild);
            if (channel) {
                try {
                    const invite = await channel.createInvite({
                        maxAge: 0,
                        maxUses: 0,
                        reason: storedCode ? 'Previous invite deleted – creating new one' : 'Server list invite'
                    });
                    newCode = invite.code;
                    serversData[guild.id].inviteCode = newCode;
                    updated = true;
                    const message = storedCode
                        ? `Previous invite code deleted in server ${guild.name}. New invite: https://discord.gg/${newCode}`
                        : `Created invite for ${guild.name}: ${newCode}`;
                    log('SERVER LIST', message);
                } catch (error) {
                    log('ERROR', `Failed to create invite for ${guild.name}: ${error.message}`);
                    serversData[guild.id].inviteCode = 'ERROR';
                    updated = true;
                }
            } else {
                serversData[guild.id].inviteCode = 'NO_CHANNEL';
                updated = true;
            }
        }
        if (updated) await sleep(500);
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

client.once("clientReady", async() => {
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
            await db.ensureLyricsIndex();
            log('DATABASE', '✅ Database connected');
            client.db = db;
        }
        line();
        client.noprefixGlobalEnabled = await db.getNoprefixGlobalEnabled();
        await loadGuildVolumes();
        client.spotifyIds = await db.loadSpotifyIds();

        log('NODE', 'Initializing Riffy...');
        client.riffy.init(client.user.id);

        client.riffy.once("nodeConnect", async(node) => {
            log('NODE', `✅ Node "${node.name}" connected.`);
            line();
            log('LOADING DATA', `✨ Global noprefix is ${client.noprefixGlobalEnabled ? 'ENABLED' : 'DISABLED'}`);
            log('LOADING DATA', '✨ Guild volumes loaded');
            log('LOADING DATA', '✨ Spotify IDs loaded');

            client.guildPrefixes = new Map();
            async function loadGuildPrefixes() {
                client.guildPrefixes = await db.getAllGuildPrefixes();
                log('LOADING DATA', `✨ Loaded ${client.guildPrefixes.size} guild prefixes`);
            }
            await loadGuildPrefixes();
            line();
            const { loadCommands } = require('./handlers/commandLoader');
            await loadCommands(client);

            await new Promise(resolve => setTimeout(resolve, 3000));
            const data = await client.load24SevenData();
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
                                if (i > 0) await new Promise(resolve => setTimeout(resolve, 500));
                                client.riffy.createConnection({
                                    guildId: guild.id,
                                    voiceChannel: channel.id,
                                    textChannel: channel.id,
                                    deaf: true,
                                });
                                console.log(`[${i + 1}/${guildIds.length}] Auto-connected to 24/7 in ${guild.name}`);
                            } catch (error) {
                                log('ERROR', `❌ Failed to auto-connect to 24/7 in ${guild.name}: ${error.message}`);
                            }
                        }
                    }
                }
            }

            console.log('✨ 24/7 auto-connect completed');
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

            await registerSlashCommands(client);
            log('LOADER', `🎃 Loaded ${client.commands.size} command implementations (slash) and ${client.prefixCommands.size} prefix commands.`);

            client.statusManager = new StatusManager(client, config);
            await client.statusManager.setPresence();

            setInterval(async () => {
                try {
                    await updateServerInvites();
                } catch (error) {
                    log('ERROR', `❌ Periodic invite check failed: ${error.message}`);
                }
            }, 5 * 60 * 1000);

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
                const resolve = await client.riffy.resolve({ query: focusedValue, requester: interaction.user });
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

        if (interaction.commandName === 'help') {
            await interaction.respond([]);
            return;
        }
        return;
    }

    if (!interaction.isCommand()) return;

    // ------------------- DEFER THE INTERACTION -------------------
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
    // ------------------------------------------------------------

    const { commandName, member } = interaction;
    const command = client.commands.get(commandName);
    if (!command) {
        return interaction.editReply({ content: `${emojis.error} | Unknown command!` });
    }

    // Validate the command (owner, perms, voice, player, etc.)
    const error = validate(command, interaction, client, ownerId);
    if (error) return interaction.editReply(error);

    // Execute the command
    await command.execute(interaction, client);
});

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
        .setFooter({ text: `Mentioned by ${message.author.displayName || message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
    if (afkData.imageUrl) embed.setImage(afkData.imageUrl);
    await message.channel.send({ embeds: [embed] }).catch(() => {});
}

const buildImageEmbed = (title, imageUrl, requester) => {
    return new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(title)
        .setDescription(`[Download](${imageUrl})`)
        .setImage(imageUrl)
        .setFooter({ text: `Requested by ${requester.tag}`, iconURL: requester.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();
};

const sendImageWithDMButton = async (channel, embed, requester) => {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`image_dm_${requester.id}`).setLabel('Send in DM').setStyle(ButtonStyle.Secondary)
    );
    const sentMsg = await channel.send({ embeds: [embed], components: [row] });
    const filter = i => i.customId === `image_dm_${requester.id}` && i.user.id === requester.id;
    const collector = sentMsg.createMessageComponentCollector({ filter, time: 120000 });
    collector.on('collect', async i => {
        try {
            await i.user.send({ embeds: [embed.setFooter(null).setTimestamp()] });
            await i.reply({ content: `${emojis.success} Image sent to your DMs!`, flags: MessageFlags.Ephemeral });
        } catch {
            await i.reply({ content: `${emojis.error} Could not send you a DM. Please make sure your DMs are open.`, flags: MessageFlags.Ephemeral });
        }
    });
    collector.on('end', async () => {
        const disabledRow = ActionRowBuilder.from(row).setComponents(row.components.map(c => ButtonBuilder.from(c).setDisabled(true)));
        await sentMsg.edit({ components: [disabledRow] }).catch(() => {});
    });
};

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    // AFK mentions
    const mentionedUsers = message.mentions.users.filter(u => !u.bot);
    for (const [userId, user] of mentionedUsers) {
        try {
            const afkData = await db.getAFK(userId);
            if (afkData) await sendAfkEmbed(message, user, afkData);
        } catch (e) {
            log('ERROR', `AFK mention error: ${e.message}`);
        }
    }

    // Counting game
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
                    const command = client.prefixCommands.get(cmdName);
                    if (command && command.prefixExecute) {
                        await command.prefixExecute(message, cmdArgs, client);
                    }
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

    // Bot mention
    const botMentionRegex = new RegExp(`^<@!?${client.user.id}>\\s+(.*)$`);
    const mentionMatch = message.content.match(botMentionRegex);
    if (mentionMatch) {
        if (message.author.id !== ownerId) {
            const blacklisted = await db.isBlacklisted(message.author.id);
            if (blacklisted) {
                return message.reply(`${emojis.SabrinaFU || emojis.error} | You are restricted from using any commands of the bot by the bot owner. Kindly fuck off.`);
            }
        }
        const rest = mentionMatch[1].trim();
        if (rest) {
            const args = rest.split(/ +/);
            const commandName = args.shift().toLowerCase();
            const command = client.prefixCommands.get(commandName);
            if (command && command.prefixExecute) {
                // Voice channel check for music commands
                const voiceCommands = ['play', 'playspotify', 'pause', 'resume', 'skip', 'stop', 'queue',
                    'nowplaying', 'volume', 'servervolume', 'shuffle', 'loop', 'remove',
                    'clear', 'status', 'filter', 'move', 'add', 'mute', 'unmute', 'deafen', 'undeafen'];
                if (voiceCommands.includes(command.name) && !message.member.voice.channel) {
                    return message.reply(`${emojis.error} | You must be in a voice channel!`);
                }
                await command.prefixExecute(message, args, client);
            } else {
                const guildPrefix = client.getGuildPrefix(message.guild?.id);
                await message.reply(`${emojis.info} | Command not found! Use ${guildPrefix}help to see all commands.`);
            }
        }
        return;
    }

    // Guild prefix
    const guildPrefix = client.getGuildPrefix(message.guild?.id);
    if (message.content.startsWith(guildPrefix)) {
        if (message.author.id !== ownerId) {
            const blacklisted = await db.isBlacklisted(message.author.id);
            if (blacklisted) {
                return message.reply(`${emojis.SabrinaFU || emojis.error} | You are restricted from using any commands of the bot by the bot owner. Kindly fuck off.`);
            }
        }
        const args = message.content.slice(guildPrefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = client.prefixCommands.get(commandName);
        if (command && command.prefixExecute) {
            const voiceCommands = ['play', 'playspotify', 'pause', 'resume', 'skip', 'stop', 'queue',
                'nowplaying', 'volume', 'servervolume', 'shuffle', 'loop', 'remove',
                'clear', 'status', 'filter', 'move', 'add', 'mute', 'unmute', 'deafen', 'undeafen'];
            if (voiceCommands.includes(command.name) && !message.member.voice.channel) {
                return message.reply(`${emojis.error} | You must be in a voice channel!`);
            }
            await command.prefixExecute(message, args, client);
        }
        return;
    }

    // No‑prefix mode
    if (client.noprefixGlobalEnabled) {
        const hasNoPrefix = (message.author.id === ownerId) || await db.isNoPrefixUser(message.author.id);
        if (hasNoPrefix) {
            if (message.author.id !== ownerId) {
                const blacklisted = await db.isBlacklisted(message.author.id);
                if (blacklisted) {
                    return message.reply(`${emojis.SabrinaFU || emojis.error} | You are restricted from using any commands of the bot by the bot owner. Kindly fuck off.`);
                }
            }
            const args = message.content.trim().split(/ +/);
            const cmdName = args.shift().toLowerCase();
            const command = client.prefixCommands.get(cmdName);
            if (command && command.prefixExecute) {
                const voiceCommands = ['play', 'playspotify', 'pause', 'resume', 'skip', 'stop', 'queue',
                    'nowplaying', 'volume', 'servervolume', 'shuffle', 'loop', 'remove',
                    'clear', 'status', 'filter', 'move', 'add', 'mute', 'unmute', 'deafen', 'undeafen'];
                if (voiceCommands.includes(command.name) && !message.member.voice.channel) {
                    await message.reply(`${emojis.error} | You must be in a voice channel!`);
                } else {
                    await command.prefixExecute(message, args, client);
                }
            }
        }
    }

    // Remove AFK if the user sent a message
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
    } catch (e) {
        log('ERROR', `AFK removal error: ${e.message}`);
    }
});

client.riffy.on("trackStart", async (player, track) => {
    client.cancelInactivityTimer(player.guildId);
    const channel = client.channels.cache.get(player.textChannel);
    if (!channel) return;

    try {
        let thumbnail = null;
        if (track.info?.artworkUrl) {
            thumbnail = track.info.artworkUrl;
        } else if (track.info?.thumbnail) {
            thumbnail = track.info.thumbnail;
        }
        if (thumbnail) track.info.thumbnail = thumbnail;
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
    await client.updatePlayerVoiceStatus(player);
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
    await client.rejoinAndIdle(player.guildId, player.textChannel);
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
        client.cancelInactivityTimer(oldState.guild.id);
        await client.clearVoiceChannelStatus(oldState.channelId);
        const data = await client.load24SevenData();
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
                            await client.updatePlayerVoiceStatus(newPlayer);
                        } catch (error) {
                            log('ERROR', `${emojis.error} Failed to reconnect to 24/7: ${error.message}`);
                        }
                    }
                }
            }, 2000);
        }
    }
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        await client.clearVoiceChannelStatus(oldState.channelId);
        const player = client.riffy.players.get(oldState.guild.id);
        if (player) await client.updatePlayerVoiceStatus(player);
    }
    if (!oldState.channelId && newState.channelId) {
        const player = client.riffy.players.get(newState.guild.id);
        if (player) {
            setTimeout(async () => {
                await client.updatePlayerVoiceStatus(player);
            }, 1000);
        }
    }
});

client.on("guildCreate", async (guild) => {
    const serversData = await loadServersData();
    serversData[guild.id] = { name: guild.name, inviteCode: null };
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

const clientHelpers = require('./helpers/clientHelpers');
Object.assign(client, clientHelpers);
client.saveGuildVolumes = saveGuildVolumes;
client.loadGuildVolumes = loadGuildVolumes;
client.loadServersData = loadServersData;
client.saveServersData = saveServersData;
client.save24SevenData = save24SevenData;

async function loginWithRetry(retries = 3, delay = 10000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        log('CLIENT', `🚀 Login attempt ${attempt}/${retries}...`);
        try {
            const loginPromise = client.login(config.botToken);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Login timeout after ${delay}ms`)), delay));
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
                    log('CLIENT', `⏳ Waiting ${waitTime / 1000} seconds before retry due to rate limit...`);
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