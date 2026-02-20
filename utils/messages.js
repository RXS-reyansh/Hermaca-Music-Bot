const emojis = require('../emojis.js');
const config = require('../config.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

const categories = {
  music: ['play', 'pause', 'resume', 'skip', 'stop', 'lyrics', 'queue', 'clear', 'filter', 'shuffle', 'loop', 'move', 'add', 'remove', 'volume', 'servervolume', 'nowplaying', 'status', '24/7', 'song-quote'],
  stats: ['stats', 'mystats', 'leaderboard', 'resetmystats'],
  spotify: ['setspotify', 'playspotify'],
  vc: ['join', 'leave', 'rejoin', 'shift', 'disconnect'],
  utility: ['afk', 'avatar', 'banner', 'react', 'emoji', 'steal', 'say', 'purge', 'count'],
  customisation: ['setavatar', 'setbanner', 'setname', 'setbio']
};

function buildMainHelpEmbed(guild, user) {
  const totalCommands = Object.values(categories).flat().length;
  const description = [
    `Hey ${user} ${emojis.hearts1}`,
    `Prefix: ${config.prefix}`,
    `Total commands: **${totalCommands}**`,
	'─── ⋆⋅☆⋅⋆ ─── ⋆⋅☆⋅⋆ ───',
    ...Object.entries(categories).map(([key, cmds]) => {
      const categoryName = key.charAt(0).toUpperCase() + key.slice(1);
      return `${emojis.whitebutterfly} | **${categoryName}**`;
    }),
    '─── ⋆⋅☆⋅⋆ ─── ⋆⋅☆⋅⋆ ───',
    `[Invite Hermaca](https://discord.com/oauth2/authorize?client_id=${config.clientId}&permissions=8&integration_type=0&scope=applications.commands+bot)`,
    `[Support Server](https://discord.gg/nVfAGH9G67)`,
	'─── ⋆⋅☆⋅⋆ ─── ⋆⋅☆⋅⋆ ───'
  ].join('\n');

  const embed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setAuthor({ 
      name: guild.name, 
      iconURL: guild.iconURL() || undefined 
    })
    .setTitle(`${emojis.info} Help Menu`)
    .setDescription(description)
    .setImage("https://i.ibb.co/gLM9bMf9/standard.gif")
    .setFooter({ text: `Select a category from the dropdown below!` });

  return embed;
}

function buildCategoryEmbed(guild, categoryKey, categoryName, commands, user) {
  const embed = new EmbedBuilder()
    .setColor(config.embedColor)
    .setAuthor({ 
      name: `${guild.name}`, 
      iconURL: guild.iconURL() || undefined 
    })
    .setTitle(`${emojis.blackcross} ${categoryName} Commands`)
    .setDescription(commands.map(cmd => `\`${cmd}\``).join(', '))
    .setImage("https://i.ibb.co/gLM9bMf9/standard.gif")
    .setFooter({ text: `Use ${config.prefix}help <command-name> to know more about the command!` });
  return embed;
}

function getHelpActionRows(currentCategory = null) {
  const homeButton = new ButtonBuilder()
    .setCustomId('help_home')
    .setLabel('Home')
	.setEmoji(emojis.chemtrails_grey)
    .setStyle(ButtonStyle.Secondary);

  const row1 = new ActionRowBuilder().addComponents(homeButton);

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('help_category')
    .setPlaceholder('> Choose a category')
    .addOptions([
      { 
        label: 'Music', 
        value: 'music', 
        emoji: emojis.greensparkles
      },
      { 
        label: 'Stats', 
        value: 'stats', 
        emoji: emojis.greensparkles 
      },
      { 
        label: 'Spotify', 
        value: 'spotify', 
        emoji: emojis.greensparkles 
      },
      { 
        label: 'VC Controls', 
        value: 'vc', 
        emoji: emojis.greensparkles 
      },
      { 
        label: 'Utility', 
        value: 'utility', 
        emoji: emojis.greensparkles 
      },
      { 
        label: 'Customisation', 
        value: 'customisation', 
        emoji: emojis.greensparkles 
      }
    ]);

  if (currentCategory) {
    const options = selectMenu.options;
    for (let i = 0; i < options.length; i++) {
      if (options[i].data.value === currentCategory) {
        options[i].data.default = true;
        break;
      }
    }
  }

  const row2 = new ActionRowBuilder().addComponents(selectMenu);
  return [row1, row2];
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

function getDurationString(track) {
    if (track.info.stream || track.info.isStream) return 'LIVE';
    const duration = track.info.length;
    if (!duration || duration <= 0 || isNaN(duration)) {
        return 'N/A';
    }
    return formatDuration(duration);
}

module.exports = {
    success: (channel, message) => {
        return channel.send(`${emojis.success} | ${message}`);
    },

    error: (channel, message) => {
        return channel.send(`${emojis.error} | ${message}`);
    },
    
    filterHelp: (channel) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.info} Filters Help`)
            .setDescription([
                `${emojis.music} Use "~filter <filter-name>" to apply a filter`,
                `${emojis.music} Available Filters: nightcore, vaporwave, 8d, 16d, chipmunk, deepbass`
            ].join("\n"))
            .setFooter({ text: "Use ~filter reset to clear filters" });
        return channel.send({ embeds: [embed] });
    },

    nowPlaying: (channel, track) => {
		if (!track || !track.info) {
			return channel.send("No track is currently playing.");
		}

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

		const embed = new EmbedBuilder()
			.setColor(config.embedColor)
			.setTitle(`${emojis.blacksparkles} Now Playing`)
			.setDescription(`[${track.info.title}](${track.info.uri})`);

		const thumb = extractThumbnail(track.info);
		if (thumb) {
			embed.setThumbnail(thumb);
		}

		embed.addFields([
			{ name: 'Artist', value: `${emojis.blackbutterfly} ${track.info.author || "Unknown"}`, inline: true },
			{ name: 'Duration', value: `${emojis.blackbutterfly} ${formatDuration(track.info.length)}`, inline: true },
			{ name: 'Requested By', value: `${emojis.blackbutterfly} ${(track.info.requester && track.info.requester.tag) || "Unknown"}`, inline: true }
		])
		.setFooter({ text: 'Use ~help to see all commands' });
		
		return channel.send({ embeds: [embed] });
	},

    filterApplied: (channel, appliedFilters) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.blacksparkles} Filters Updated`)
            .setDescription(
                appliedFilters.length > 0
                    ? `Currently active filters:\n${appliedFilters.map(f => `${emojis.music} ${f}`).join("\n")}`
                    : `${emojis.music} No filters are currently applied.`
            )
            .setFooter({ text: "Use ~filter reset to clear filters" });
        return channel.send({ embeds: [embed] });
    },
    
    lyrics: async (channel, trackTitle, lyricsData, trackArtist) => {
        try {
            if (!lyricsData?.lyrics) {
                return module.exports.error(channel, "Lyrics not found!");
            }
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${emojis.blacksparkles} Lyrics of **${trackArtist} - ${trackTitle}**`)
                .setDescription(lyricsData.lyrics.slice(0, 4000))
                .setFooter({ 
                    text: 'Lyrics powered by Genius.com • NOTE: Too long tracks will not be provided full lyrics due to Discord Limits.',
                    iconURL: 'https://i.ibb.co/GfHpz0fQ/image.gif'
                });
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error("Lyrics embed error:", error);
            await channel.send(`**${trackTitle}**\n\n${lyricsData?.lyrics?.slice(0, 1900)}`);
        }
    },

    addedToQueue: (channel, track, position) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setDescription(`${emojis.success} Added to queue: [${track.info.title}](${track.info.uri})`);
        if (track.info.thumbnail && typeof track.info.thumbnail === 'string') {
            embed.setThumbnail(track.info.thumbnail);
        }
        embed.addFields([
            { name: 'Artist', value: `${emojis.hearts} ${track.info.author}`, inline: true },
            { name: 'Duration', value: `${emojis.hearts} ${getDurationString(track)}`, inline: true },
            { name: 'Position', value: `${emojis.hearts} #${position}`, inline: true }
        ]);
        return channel.send({ embeds: [embed] });
    },
	
    addedPlaylist: (channel, playlistInfo, tracks) => {
        return module.exports.playingPlaylist(channel, playlistInfo, tracks, false);
    },

	playingPlaylist: (channel, playlistInfo, tracks, fromSpotify = false) => {
		const embed = new EmbedBuilder()
			.setColor(config.embedColor)
			.setTitle(`${emojis.success} Playing ${playlistInfo.name}`)
			.setDescription(`[${playlistInfo.name}](${playlistInfo.uri || playlistInfo.url})`);
		
		if (playlistInfo.thumbnail && typeof playlistInfo.thumbnail === 'string' && playlistInfo.thumbnail.trim() !== '') {
			embed.setThumbnail(playlistInfo.thumbnail);
		} else if (playlistInfo.image && typeof playlistInfo.image === 'string' && playlistInfo.image.trim() !== '') {
			embed.setThumbnail(playlistInfo.image);
		} else if (tracks && tracks.length > 0 && tracks[0].info) {
			const track = tracks[0];
			if (track.info.thumbnail && typeof track.info.thumbnail === 'string' && track.info.thumbnail.trim() !== '') {
				embed.setThumbnail(track.info.thumbnail);
			} else if (track.info.artwork && Array.isArray(track.info.artwork) && track.info.artwork[0]?.url) {
				embed.setThumbnail(track.info.artwork[0].url);
			}
		}
		
		embed.addFields({
			name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
			value: "",
			inline: false
		});
		
		let creationDate = 'Unknown';
		if (playlistInfo.created_at) {
			try {
				creationDate = new Date(playlistInfo.created_at).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				});
			} catch (error) {
				console.error('Error parsing date:', error);
				creationDate = 'Unknown';
			}
		} else if (fromSpotify) {
			creationDate = 'Unknown';
		}
		
		const trackCount = playlistInfo.tracksCount || (tracks && tracks.length) || 0;
		
		embed.addFields(
			{
				name: `${emojis.music} Playlist created on: ${creationDate}`,
				value: "",
				inline: false
			},
			{
				name: `${emojis.music} Number of tracks: ${trackCount} tracks`,
				value: "",
				inline: false
			}
		)
		.setFooter({ 
			text: 'Enjoy your music!',
			iconURL: 'https://i.ibb.co/GfHpz0fQ/image.gif'
		});
		
		return channel.send({ embeds: [embed] });
	},
	
	info(channel, content) {
		return channel.send(`${emojis.info} | ${content}`);
	},

    queueEnded: (channel) => {
        return channel.send(`${emojis.info} | Queue has ended.`);
    },

    queueList: async (channel, queue, currentTrack, authorId) => {
        const TRACKS_PER_PAGE = 8;
        const totalPages = Math.ceil(queue.length / TRACKS_PER_PAGE);
        
        if (totalPages === 0 && !currentTrack) {
            return module.exports.error(channel, "Queue is empty!");
        }

        const allTracks = currentTrack ? [currentTrack, ...queue] : queue;
        const totalDuration = allTracks.reduce((acc, track) => {
            const duration = track?.info?.length;
            if (duration && duration > 0 && !track?.info?.stream && !track?.info?.isStream) {
                return acc + duration;
            }
            return acc;
        }, 0);
        const streamCount = queue.filter(t => t.info.isStream).length;
        const durationText = streamCount > 0 
            ? `${formatDuration(totalDuration)} (${streamCount} streams)`
            : formatDuration(totalDuration);

        const pages = [];
        for (let page = 1; page <= totalPages; page++) {
            const start = (page - 1) * TRACKS_PER_PAGE;
            const end = start + TRACKS_PER_PAGE;
            const pageTracks = queue.slice(start, end);

            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${emojis.star} Queue List (${queue.length} tracks)`);

            if (currentTrack && page === 1) {
                embed.setDescription(
                    `**Now Playing:**\n${emojis.play} **${currentTrack.info.title}** - ${currentTrack.info.author || 'Unknown'}\n\n**Upcoming:**`
                );
                if (currentTrack.info.thumbnail) {
                    embed.setThumbnail(currentTrack.info.thumbnail);
                }
            }

            if (pageTracks.length > 0) {
                const tracksText = pageTracks.map((track, i) => {
                    const title = track.info.title || 'Unknown Title';
                    const artist = track.info.author || 'Unknown Artist';
                    const songInfo = title.length > 28 ? title.substring(0, 25) + '...' : title;
                    const artistInfo = artist.length > 15 ? artist.substring(0, 12) + '...' : artist;
                    return `\`${(start + i + 1).toString().padStart(2, '0')}\` ${emojis.music} **${songInfo} - ${artistInfo}** - ${getDurationString(track)}`;
                }).join('\n');
                
                embed.addFields({ 
                    name: '\u200b', 
                    value: tracksText.length > 1020 ? tracksText.substring(0, 1017) + '...' : tracksText 
                });
            } else {
                embed.addFields({ name: '\u200b', value: 'No more tracks' });
            }

            embed.setFooter({ 
                text: `Total Duration: ${durationText} • Page ${page}/${totalPages || 1}` 
            });

            pages.push(embed);
        }

        if (pages.length === 1) {
            return channel.send({ embeds: [pages[0]] });
        }

        const getRow = (page = 0) => {
            const row = new ActionRowBuilder();
            if (page > 0) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId('queue_prev')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                );
            }
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('queue_page')
                    .setLabel(`${page + 1}/${pages.length}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );
            if (page < pages.length - 1) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId('queue_next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                );
            }
            return row;
        };

        const msg = await channel.send({ 
            embeds: [pages[0]], 
            components: [getRow(0)] 
        });

        const collector = msg.createMessageComponentCollector({ time: 60000 });
        let currentPage = 0;

        collector.on('collect', async (i) => {
            if (i.user.id !== authorId) {
                return i.reply({ content: 'Only the command author can use these buttons!', ephemeral: true });
            }
            await i.deferUpdate();

            switch (i.customId) {
                case 'queue_prev': currentPage--; break;
                case 'queue_next': currentPage++; break;
            }
            currentPage = Math.max(0, Math.min(currentPage, pages.length - 1));
            
            try {
				await i.editReply({ 
					embeds: [pages[currentPage]], 
					components: [getRow(currentPage)] 
				});
			} catch (error) {
				if (error.code === 10062 || error.code === 50027) {

					if (i.channel) {
						await i.channel.send({ 
							embeds: [pages[currentPage]]
						}).catch(() => {});
					}
				} else {
					throw error;
				}
			}
        });

        collector.on('end', () => {
			try {
				msg.edit({ components: [] }).catch(() => {});
			} catch (error) {
			}
		});
    },

    playerStatus: (channel, player) => {
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
        return channel.send({ embeds: [embed] });
    },

    help: (channel, commands) => {
        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle(`${emojis.info} Available Commands`)
            .setDescription(commands.map(cmd => 
                `${emojis.music} \`${cmd.name}\` - ${cmd.description}`
            ).join('\n'))
       	    .setImage("https://i.ibb.co/gLM9bMf9/standard.gif")
            .setFooter({ text: 'Prefix: ~ • Example: ~play <song name>' });
        return channel.send({ embeds: [embed] });
    },
	ping: async function(channel, client, context, hostingService) {
		try {
			const startTime = Date.now();
			const tempMsg = await channel.send('🏓 Pinging...');
			const restLatency = tempMsg.createdTimestamp - context.createdTimestamp;
			const wsLatency = Math.round(
				client.actualWsPing > 0 ? client.actualWsPing : (client.ws.ping > 0 ? client.ws.ping : 0)
			);
			const clusterId = client.clusterId || "45";
			let shardId = 667;
			if (client.shard) {
				try {
					shardId = client.shard.ids[0] || 0;
				} catch (error) {
				}
			}
			const { EmbedBuilder } = require('discord.js');
			const config = require("../config.js");
			const emojis = require("../emojis.js");
			
			const hostingText = `Powered by ${hostingService}`;
			
			const embed = new EmbedBuilder()
				.setColor(config.embedColor)
				.setTitle(`${emojis.redblackcross} Cluster ${clusterId}`)
				.addFields({
					name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
					value: `• Discord REST latency: \`${restLatency}ms\`\n• Discord Gateway (WS) latency: \`${wsLatency}ms\` (Shard ${shardId})`,
					inline: false
				})
				.setFooter({ text: `Database on MongoDB • ${hostingText}` })
				.setTimestamp();
			await tempMsg.delete().catch(() => {});
			await channel.send({ embeds: [embed] });
			
		} catch (error) {
			console.error("Ping command error (messages.js):", error);
			await channel.send(`${emojis.error} | Failed to calculate ping!`);
		}
	},

	queueListInteraction: async (interaction, queue, currentTrack, authorId) => {
		const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
		
		const TRACKS_PER_PAGE = 8;
		const totalPages = Math.ceil(queue.length / TRACKS_PER_PAGE);
		
		if (totalPages === 0 && !currentTrack) {
			return await interaction.editReply({ content: `${emojis.error} | Queue is empty!` });
		}

		const allTracks = currentTrack ? [currentTrack, ...queue] : queue;
		const totalDuration = allTracks.reduce((acc, track) => {
			const duration = track?.info?.length;
			if (duration && duration > 0 && !track?.info?.stream && !track?.info?.isStream) {
				return acc + duration;
			}
			return acc;
		}, 0);
		const streamCount = queue.filter(t => t.info.isStream).length;
		const durationText = streamCount > 0 
			? `${formatDuration(totalDuration)} (${streamCount} streams)`
			: formatDuration(totalDuration);

		const pages = [];
		for (let page = 1; page <= totalPages; page++) {
			const start = (page - 1) * TRACKS_PER_PAGE;
			const end = start + TRACKS_PER_PAGE;
			const pageTracks = queue.slice(start, end);

			const embed = new EmbedBuilder()
				.setColor(config.embedColor)
				.setTitle(`${emojis.star} Queue List (${queue.length} tracks)`);

			if (currentTrack && page === 1) {
				embed.setDescription(
					`**Now Playing:**\n${emojis.play} **${currentTrack.info.title}** - ${currentTrack.info.author || 'Unknown'}\n\n**Upcoming:**`
				);
				if (currentTrack.info.thumbnail) {
					embed.setThumbnail(currentTrack.info.thumbnail);
				}
			}

			if (pageTracks.length > 0) {
				const tracksText = pageTracks.map((track, i) => {
					const title = track.info.title || 'Unknown Title';
					const artist = track.info.author || 'Unknown Artist';
					const songInfo = title.length > 28 ? title.substring(0, 25) + '...' : title;
					const artistInfo = artist.length > 15 ? artist.substring(0, 12) + '...' : artist;
					return `\`${(start + i + 1).toString().padStart(2, '0')}\` ${emojis.music} **${songInfo} - ${artistInfo}** - ${getDurationString(track)}`;
				}).join('\n');
				
				embed.addFields({ 
					name: '\u200b', 
					value: tracksText.length > 1020 ? tracksText.substring(0, 1017) + '...' : tracksText 
				});
			} else {
				embed.addFields({ name: '\u200b', value: 'No more tracks' });
			}

			embed.setFooter({ 
				text: `Total Duration: ${durationText} • Page ${page}/${totalPages || 1}` 
			});

			pages.push(embed);
		}

		if (pages.length === 1) {
			return await interaction.editReply({ embeds: [pages[0]] });
		}

		const getRow = (page = 0) => {
			const row = new ActionRowBuilder();
			if (page > 0) {
				row.addComponents(
					new ButtonBuilder()
						.setCustomId('queue_prev')
						.setLabel('Previous')
						.setStyle(ButtonStyle.Primary)
				);
			}
			row.addComponents(
				new ButtonBuilder()
					.setCustomId('queue_page')
					.setLabel(`${page + 1}/${pages.length}`)
					.setStyle(ButtonStyle.Secondary)
					.setDisabled(true)
			);
			if (page < pages.length - 1) {
				row.addComponents(
					new ButtonBuilder()
						.setCustomId('queue_next')
						.setLabel('Next')
						.setStyle(ButtonStyle.Primary)
				);
			}
			return row;
		};

		let msg;
		try {
			msg = await interaction.editReply({ 
				embeds: [pages[0]], 
				components: [getRow(0)] 
			});
		} catch (error) {
			if (error.code === 10062 || error.code === 50027) {

				msg = await interaction.channel.send({ 
					embeds: [pages[0]], 
					components: [getRow(0)] 
				});
			} else {
				throw error;
			}
		}

		const collector = msg.createMessageComponentCollector({ time: 60000 });
		let currentPage = 0;

		collector.on('collect', async (i) => {
			if (i.user.id !== authorId) {
				return i.reply({ content: 'Only the command author can use these buttons!', ephemeral: true });
			}
			await i.deferUpdate();

			switch (i.customId) {
				case 'queue_prev': currentPage--; break;
				case 'queue_next': currentPage++; break;
			}
			currentPage = Math.max(0, Math.min(currentPage, pages.length - 1));
			
			try {
				await i.editReply({ 
					embeds: [pages[currentPage]], 
					components: [getRow(currentPage)] 
				});
			} catch (error) {
				if (error.code === 10062 || error.code === 50027) {

					if (i.channel) {
						await i.channel.send({ 
							embeds: [pages[currentPage]]
						}).catch(() => {});
					}
				} else {
					throw error;
				}
			}
		});

		collector.on('end', () => {
			try {
				msg.edit({ components: [] }).catch(() => {});
			} catch (error) {
			}
		});
	},

	sendInteractionReply: async (interaction, content, ephemeral = false) => {
		if (interaction.deferred || interaction.replied) {
			return await interaction.followUp(content);
		} else {
			return await interaction.reply({ ...content, ephemeral });
		}
	},

sendPlaylistSelector: async (context, playlists, authorId, client, spotifyUsername) => {
		const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
		const isInteraction = context.isCommand !== undefined || context.deferred !== undefined || context.replied !== undefined;
		
		let channel, user, guild;
		
		if (isInteraction) {
			channel = context.channel;
			user = context.user;
			guild = context.guild;
		} else {
			if (context.channel) {
				channel = context.channel;
				user = context.author;
				guild = context.guild;
			} else {
				channel = context;
				user = { id: authorId, tag: 'User' };
				guild = channel.guild;
			}
		}
		
		if (playlists.length === 0) {
			if (isInteraction) {
				return await context.editReply({ 
					content: `${emojis.error} | No playlists found! Make sure your Spotify account has public playlists.` 
				});
			} else {
				return channel.send(`${emojis.error} | No playlists found! Make sure your Spotify account has public playlists.`);
			}
		}
		
		const PLAYLISTS_PER_PAGE = 10;
		const totalPages = Math.ceil(playlists.length / PLAYLISTS_PER_PAGE);
		
		const createPageComponents = (page = 0) => {
			const start = page * PLAYLISTS_PER_PAGE;
			const end = start + PLAYLISTS_PER_PAGE;
			const pagePlaylists = playlists.slice(start, end);
			
			const profileLink = `[Spotify profile](https://open.spotify.com/user/${spotifyUsername})`;
			const embed = new EmbedBuilder()
				.setTitle(`${emojis.blacksparkles} Your Spotify Playlists - ${playlists.length} Playlists`)
				.setDescription(`${profileLink}\n${'─'.repeat(45)}`)
				.setColor(config.embedColor)
				.setFooter({ 
					text: `Page ${page + 1}/${totalPages}`,
					iconURL: 'https://i.ibb.co/GfHpz0fQ/image.gif'
				});
			
			let playlistList = '';
			pagePlaylists.forEach((playlist, index) => {
				const playlistNum = start + index + 1;
				const name = playlist.name.length > 40 ? playlist.name.substring(0, 37) + '...' : playlist.name;
				playlistList += `**${playlistNum}.** ${name} • ${playlist.tracksCount} tracks\n`;
			});
			
			if (playlistList) {
				embed.setDescription(`${embed.data.description}\n\n${playlistList}`);
			}
			
			const selectMenu = new StringSelectMenuBuilder()
				.setCustomId('playlist_select')
				.setPlaceholder('Select a playlist to play...')
				.addOptions(
					pagePlaylists.map((playlist, index) => {
						const playlistNum = start + index + 1;
						const name = playlist.name.length > 80 ? playlist.name.substring(0, 77) + '...' : playlist.name;
						return new StringSelectMenuOptionBuilder()
							.setLabel(`${playlistNum}. ${name}`)
							.setDescription(`${playlist.tracksCount} tracks`)
							.setValue(`play_${page}_${index}`)
							.setEmoji('🎵');
					})
				);
			
			const selectRow = new ActionRowBuilder().addComponents(selectMenu);
			const components = [selectRow];
			
			if (totalPages > 1) {
				const navRow = new ActionRowBuilder();
				
				if (page > 0) {
					navRow.addComponents(
						new ButtonBuilder()
							.setCustomId(`prev_${page}`)
							.setLabel('⬅️ Previous')
							.setStyle(ButtonStyle.Primary)
					);
				}
				
				navRow.addComponents(
					new ButtonBuilder()
						.setCustomId(`page_info`)
						.setLabel(`Page ${page + 1}/${totalPages}`)
						.setStyle(ButtonStyle.Secondary)
						.setDisabled(true)
				);
				
				if (page < totalPages - 1) {
					navRow.addComponents(
						new ButtonBuilder()
							.setCustomId(`next_${page}`)
							.setLabel('Next ➡️')
							.setStyle(ButtonStyle.Primary)
					);
				}
				
				components.push(navRow);
			}
			
			return { embed, components };
		};
		
		const { embed, components } = createPageComponents(0);
		
		let msg;
		if (isInteraction) {
			try {
				msg = await context.editReply({
					embeds: [embed],
					components: components
				});
			} catch (error) {
				console.error('Error sending playlist selector:', error);
				return;
			}
		} else {
			msg = await channel.send({
				embeds: [embed],
				components: components
			});
		}
		
		const collector = msg.createMessageComponentCollector({ 
			time: 90000,
			filter: i => i.user.id === authorId 
		});
		
		let currentPage = 0;
		
		collector.on('collect', async (i) => {
			await i.deferUpdate();

			if (i.isStringSelectMenu()) {
				const value = i.values[0];
				if (value.startsWith('play_')) {
					const [, pageStr, indexStr] = value.split('_');
					const page = parseInt(pageStr);
					const index = parseInt(indexStr);
					const playlistIndex = (page * PLAYLISTS_PER_PAGE) + index;
					const selectedPlaylist = playlists[playlistIndex];
					
					collector.stop('selected');
					
					try {
						await i.editReply({
							content: '',
							embeds: [msg.embeds[0]],
							components: []
						});
					} catch (error) {
						console.error('Error updating message:', error);
					}
					
					const loadingMsg = await i.channel.send(`${emojis.loading} | Loading playlist: **${selectedPlaylist.name}**...`);

					try {
						if (!i.member.voice.channel) {
							await i.channel.send(`${emojis.error} | You must be in a voice channel to play music!`);
							setTimeout(() => loadingMsg.delete().catch(() => {}), 2000);
							return;
						}
						
						if (client.riffy.nodes.size === 0) {
							await i.channel.send(`${emojis.error} | Music nodes are not ready yet. Please try again in a moment.`);
							setTimeout(() => loadingMsg.delete().catch(() => {}), 2000);
							return;
						}
						let player = client.riffy.players.get(i.guild.id);
						if (!player) {
							player = client.riffy.createConnection({
								guildId: i.guild.id,
								voiceChannel: i.member.voice.channel.id,
								textChannel: i.channel.id,
								deaf: true,
							});
						} else {
							if (player.textChannel !== i.channel.id) {
								player.setTextChannel(i.channel.id);
							}
						}
						
						const savedVolume = client.guildVolumes.get(i.guild.id);
						if (savedVolume !== undefined) {
							player.setVolume(savedVolume);
						}
						const playlistUrl = `https://open.spotify.com/playlist/${selectedPlaylist.id}`;
						
						let result;
						try {
							result = await client.riffy.resolve({
								query: playlistUrl,
								requester: i.user,
							});
						} catch (error) {
							console.error('❌ Spotify plugin resolve error:', error);
							const { getAllPlaylistTracks } = require("./spotifyPlaylists.js");
							const allTracks = await getAllPlaylistTracks(selectedPlaylist.id);
							
							if (!allTracks || allTracks.length === 0) {
								await i.channel.send(`${emojis.error} | No tracks found in playlist!`);
								setTimeout(() => loadingMsg.delete().catch(() => {}), 2000);
								return;
							}
							
							let addedCount = 0;
							const CONCURRENCY_LIMIT = 5;
							for (let idx = 0; idx < allTracks.length; idx += CONCURRENCY_LIMIT) {
								const chunk = allTracks.slice(idx, idx + CONCURRENCY_LIMIT);
								const resolvedTracks = await Promise.all(chunk.map(async (trackData) => {
									try {
										const res = await client.riffy.resolve({ 
											query: trackData.uri, 
											requester: i.user 
										});
										return res.tracks?.[0] || null;
									} catch {
										return null;
									}
								}));
								resolvedTracks.forEach(t => { 
									if (t) { 
										player.queue.add(t); 
										addedCount++; 
									} 
								});
								if (idx + CONCURRENCY_LIMIT < allTracks.length) {
									await new Promise(r => setTimeout(r, 30));
								}
							}
							
							if (addedCount === 0) {
								await i.channel.send(`${emojis.error} | Failed to add any tracks from playlist!`);
								setTimeout(() => loadingMsg.delete().catch(() => {}), 2000);
								return;
							}
							
							if (!player.playing && !player.paused) player.play();
							
							let thumbnail = selectedPlaylist.image || (allTracks[0]?.thumbnail || null);
							const embed = new EmbedBuilder()
								.setColor(config.embedColor)
								.setTitle(`${emojis.success} Playing ${selectedPlaylist.name}`)
								.setDescription(`Added **${addedCount}** tracks to queue`)
								.setFooter({ text: 'Playlist loaded (fallback mode)' });
							if (thumbnail) embed.setThumbnail(thumbnail);
							
							await i.channel.send({ embeds: [embed] });
							setTimeout(() => loadingMsg.delete().catch(() => {}), 2000);
							return;
						}
						if (result.loadType === 'playlist' && result.tracks?.length > 0) {
							const tracks = result.tracks;
							for (const track of tracks) {
								track.info.requester = i.user;
								player.queue.add(track);
							}
					
							if (!player.playing && !player.paused) player.play();
							
							let thumbnail = selectedPlaylist.image || tracks[0]?.info?.thumbnail || null;
							const embed = new EmbedBuilder()
								.setColor(config.embedColor)
								.setTitle(`${emojis.success} Playing ${selectedPlaylist.name}`)
								.setDescription(`Added **${tracks.length}** tracks to queue`)
								.setFooter({ text: 'Loaded via Spotify plugin' });
							if (thumbnail) embed.setThumbnail(thumbnail);
							
							await i.channel.send({ embeds: [embed] });
						} else {
							await i.channel.send(`${emojis.error} | Failed to load playlist (no tracks returned).`);
						}
						
						setTimeout(() => loadingMsg.delete().catch(() => {}), 2000);
						
					} catch (error) {
						console.error("Playlist error:", error);
						await i.channel.send(`${emojis.error} | Failed to load playlist: ${error.message}`);
						setTimeout(() => loadingMsg.delete().catch(() => {}), 2000);
					}
					return;
				}
			} else if (i.isButton()) {
				if (i.customId.startsWith('prev_')) {
					currentPage--;
				} else if (i.customId.startsWith('next_')) {
					currentPage++;
				}
				currentPage = Math.max(0, Math.min(currentPage, totalPages - 1));
				const { embed, components } = createPageComponents(currentPage);
				try {
					await i.editReply({
						embeds: [embed],
						components: components
					});
				} catch (error) {
					console.error('Error updating page:', error);
				}
			}
		});
		collector.on('end', (collected, reason) => {
			if (reason === 'time') {
				msg.edit({ 
					embeds: [msg.embeds[0]],
					components: [] 
				}).catch(() => {});
			}
		});
	},
	userStats: async (channel, userStats, userRank, user) => {
		const { EmbedBuilder } = require('discord.js');
		const emojis = require('../emojis.js');
		const config = require('../config.js');
		
		function formatTime(ms) {
			if (!ms || ms < 0) return '0 min';
			const minutes = Math.floor(ms / 60000);
			const hours = Math.floor(minutes / 60);
			const days = Math.floor(hours / 24);
			
			if (days > 0) {
				return `${days}d ${hours % 24}h`;
			} else if (hours > 0) {
				return `${hours}h ${minutes % 60}m`;
			} else {
				return `${minutes}m`;
			}
		}
		
		const embed = new EmbedBuilder()
			.setColor(14387593)
			.setTitle(`${user.username}'s Music Statistics`)
			.setDescription(`Global listening history across all servers\n**───────────────────────────────────**`)
			.setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
			.setFooter({ 
				text: 'Stats are global • Use /leaderboard to see top users',
				iconURL: 'https://i.ibb.co/GfHpz0fQ/image.gif'
			})
			.setTimestamp();
		
		if (!userStats) {
			embed.setDescription(`${emojis.error} No statistics found for ${user.username}.\nPlay some music first!`);
			return channel.send({ embeds: [embed] });
		}
		const overviewText = [
			`${emojis.music} Total Plays: ${userStats.totalPlays || 0}`,
			`${emojis.music} Listening Time: ${formatTime(userStats.totalListeningTime || 0)}`,
			`${emojis.music} Average Track: ${userStats.averagePlayTime || 0} minutes`,
			`${emojis.music} Global Rank: #${userRank.rank} of ${userRank.totalUsers}`,
			`**───────────────────────────────────**`
		].join('\n');
		
		embed.addFields({
			name: `${emojis.blackbutterfly} Overview`,
			value: overviewText,
			inline: false
		});
		if (userStats.topSongs && userStats.topSongs.length > 0) {
			const songsText = userStats.topSongs.slice(0, 5).map((song, index) => {
				const title = song.title?.length > 30 ? song.title.substring(0, 27) + '...' : song.title || 'Unknown';
				const artist = song.artist || 'Unknown';
				return `${emojis.music} **${title}** by __${artist}__ • ${song.plays || 1} plays`;
			}).join('\n');
			
			embed.addFields({
				name: `${emojis.blackbutterfly} Top Songs`,
				value: songsText + `\n**───────────────────────────────────**`,
				inline: false
			});
		}
		if (userStats.topArtists && userStats.topArtists.length > 0) {
			const artistsText = userStats.topArtists.slice(0, 5).map((artist, index) => {
				const artistName = artist.name?.length > 20 ? artist.name.substring(0, 17) + '...' : artist.name || 'Unknown';
				const emoji = index === 0 ? emojis.blackcrown : emojis.music;
				return `${emoji} ${artistName} • ${artist.plays || 1} plays`;
			}).join('\n');
			
			embed.addFields({
				name: `${emojis.blackbutterfly} Top Artists`,
				value: artistsText + `\n**───────────────────────────────────**`,
				inline: false
			});
		}
		const statsText = [
			`${emojis.music} First Track: ${userStats.createdAt ? new Date(userStats.createdAt).toLocaleDateString() : 'Today'}`,
			`${emojis.music} Last Updated: ${userStats.lastUpdated ? new Date(userStats.lastUpdated).toLocaleDateString() : 'Never'}`,
			`${emojis.music} Favorite Genre: ${userStats.favoriteGenre || 'Various'}`,
			`${emojis.music} Unique Songs Played: ${userStats.songs?.length || 0}`
		].join('\n');
		
		embed.addFields({
			name: `${emojis.blackbutterfly} Statistics`,
			value: statsText,
			inline: false
		});
		
		return channel.send({ embeds: [embed] });
	},

	userStatsInteraction: async (interaction, userStats, userRank, user) => {
		return module.exports.userStatsEmbedInteraction(interaction, userStats, userRank, user, true);
	},
	
	userStatsEmbed: async (channel, userStats, userRank, user, isSelf = true) => {
		const { EmbedBuilder } = require('discord.js');
		const emojis = require('../emojis.js');
		const config = require('../config.js');
		
		function formatTime(ms) {
			if (!ms || ms < 0) return '0 min';
			const minutes = Math.floor(ms / 60000);
			const hours = Math.floor(minutes / 60);
			const days = Math.floor(hours / 24);
			
			if (days > 0) {
				return `${days}d ${hours % 24}h`;
			} else if (hours > 0) {
				return `${hours}h ${minutes % 60}m`;
			} else {
				return `${minutes}m`;
			}
		}
		
		const embed = new EmbedBuilder()
			.setColor(14387593)
			.setTitle(`${user.username}'s Music Statistics`)
			.setDescription(`Global listening history across all servers\n**───────────────────────────────────**`)
			.setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
			.setFooter({ 
				text: 'Stats are global • Use /leaderboard to see top users',
				iconURL: 'https://i.ibb.co/GfHpz0fQ/image.gif'
			})
			.setTimestamp();
		const overviewText = [
			`${emojis.music} Total Plays: ${userStats.totalPlays || 0}`,
			`${emojis.music} Listening Time: ${formatTime(userStats.totalListeningTime || 0)}`,
			`${emojis.music} Average Track: ${userStats.averagePlayTime || 0} minutes`,
			`${emojis.music} Global Rank: #${userRank.rank} of ${userRank.totalUsers}`,
			`**───────────────────────────────────**`
		].join('\n');
		
		embed.addFields({
			name: `${emojis.blackbutterfly} Overview`,
			value: overviewText,
			inline: false
		});
		if (userStats.topSongs && userStats.topSongs.length > 0) {
			const songsText = userStats.topSongs.slice(0, 5).map((song, index) => {
				const title = song.title.length > 30 ? song.title.substring(0, 27) + '...' : song.title;
				const artist = song.artist || 'Unknown';
				return `${emojis.music} **${title}** by __${artist}__ • ${song.plays || 1} plays`;
			}).join('\n');
			
			embed.addFields({
				name: `${emojis.blackbutterfly} Top Songs`,
				value: songsText + `\n**───────────────────────────────────**`,
				inline: false
			});
		}
		if (userStats.topArtists && userStats.topArtists.length > 0) {
			const artistsText = userStats.topArtists.slice(0, 5).map((artist, index) => {
				const artistName = artist.name.length > 20 ? artist.name.substring(0, 17) + '...' : artist.name;
				const emoji = index === 0 ? emojis.blackcrown : emojis.music;
				return `${emoji} ${artistName} • ${artist.plays || 1} plays`;
			}).join('\n');
			
			embed.addFields({
				name: `${emojis.blackbutterfly} Top Artists`,
				value: artistsText + `\n**───────────────────────────────────**`,
				inline: false
			});
		}
		const statsText = [
			`${emojis.music} First Track: ${userStats.createdAt ? new Date(userStats.createdAt).toLocaleDateString() : 'Today'}`,
			`${emojis.music} Last Updated: ${userStats.lastUpdated ? new Date(userStats.lastUpdated).toLocaleDateString() : 'Never'}`,
			`${emojis.music} Favorite Genre: ${userStats.favoriteGenre || 'Various'}`,
			`${emojis.music} Unique Songs Played: ${userStats.songs?.length || 0}`
		].join('\n');
		
		embed.addFields({
			name: `${emojis.blackbutterfly} Statistics`,
			value: statsText,
			inline: false
		});
		
		if (typeof channel.send === 'function') {
			return channel.send({ embeds: [embed] });
		} else {
			return channel.editReply({ embeds: [embed] });
		}
	},

	userStatsEmbedInteraction: async (interaction, userStats, userRank, user, isSelf = true) => {
		const { EmbedBuilder } = require('discord.js');
		const emojis = require('../emojis.js');
		const config = require('../config.js');
		
		function formatTime(ms) {
			if (!ms || ms < 0) return '0 min';
			const minutes = Math.floor(ms / 60000);
			const hours = Math.floor(minutes / 60);
			const days = Math.floor(hours / 24);
			
			if (days > 0) {
				return `${days}d ${hours % 24}h`;
			} else if (hours > 0) {
				return `${hours}h ${minutes % 60}m`;
			} else {
				return `${minutes}m`;
			}
		}
		
		const embed = new EmbedBuilder()
			.setColor(14387593)
			.setTitle(`${user.username}'s Music Statistics`)
			.setDescription(`Global listening history across all servers\n**───────────────────────────────────**`)
			.setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
			.setFooter({ 
				text: 'Stats are global • Use /leaderboard to see top users',
				iconURL: 'https://i.ibb.co/GfHpz0fQ/image.gif'
			})
			.setTimestamp();
		const overviewText = [
			`${emojis.music} Total Plays: ${userStats.totalPlays || 0}`,
			`${emojis.music} Listening Time: ${formatTime(userStats.totalListeningTime || 0)}`,
			`${emojis.music} Average Track: ${userStats.averagePlayTime || 0} minutes`,
			`${emojis.music} Global Rank: #${userRank.rank} of ${userRank.totalUsers}`,
			`**───────────────────────────────────**`
		].join('\n');
		
		embed.addFields({
			name: `${emojis.blackbutterfly} Overview`,
			value: overviewText,
			inline: false
		});
		if (userStats.topSongs && userStats.topSongs.length > 0) {
			const songsText = userStats.topSongs.slice(0, 5).map((song, index) => {
				const title = song.title.length > 30 ? song.title.substring(0, 27) + '...' : song.title;
				const artist = song.artist || 'Unknown';
				return `${emojis.music} **${title}** by __${artist}__ • ${song.plays || 1} plays`;
			}).join('\n');
			
			embed.addFields({
				name: `${emojis.blackbutterfly} Top Songs`,
				value: songsText + `\n**───────────────────────────────────**`,
				inline: false
			});
		}
		if (userStats.topArtists && userStats.topArtists.length > 0) {
			const artistsText = userStats.topArtists.slice(0, 5).map((artist, index) => {
				const artistName = artist.name.length > 20 ? artist.name.substring(0, 17) + '...' : artist.name;
				const emoji = index === 0 ? emojis.blackcrown : emojis.music;
				return `${emoji} ${artistName} • ${artist.plays || 1} plays`;
			}).join('\n');
			
			embed.addFields({
				name: `${emojis.blackbutterfly} Top Artists`,
				value: artistsText + `\n**───────────────────────────────────**`,
				inline: false
			});
		}
		const statsText = [
			`${emojis.music} First Track: ${userStats.createdAt ? new Date(userStats.createdAt).toLocaleDateString() : 'Today'}`,
			`${emojis.music} Last Updated: ${userStats.lastUpdated ? new Date(userStats.lastUpdated).toLocaleDateString() : 'Never'}`,
			`${emojis.music} Favorite Genre: ${userStats.favoriteGenre || 'Various'}`,
			`${emojis.music} Unique Songs Played: ${userStats.songs?.length || 0}`
		].join('\n');
		
		embed.addFields({
			name: `${emojis.blackbutterfly} Statistics`,
			value: statsText,
			inline: false
		});
		
		return interaction.editReply({ embeds: [embed] });
	},
	
	leaderboard: async (channel, leaderboardData) => {
		const { EmbedBuilder } = require('discord.js');
		const emojis = require('../emojis.js');
		const config = require('../config.js');
		
		function formatTime(ms) {
			if (!ms || ms <= 0) return '0m';
			const minutes = Math.floor(ms / 60000);
			const hours = Math.floor(minutes / 60);
			const days = Math.floor(hours / 24);
			
			if (days > 0) return `${days}d`;
			if (hours > 0) return `${hours}h`;
			return `${minutes}m`;
		}
		
		const embed = new EmbedBuilder()
			.setColor(config.embedColor)
			.setTitle(`${emojis.star} Global Music Leaderboard`)
			.setDescription(`${emojis.blacksparkles} Top listeners across all servers ranked by total plays\n${'─'.repeat(45)}`)
			.setThumbnail('https://i.ibb.co/RNtKj2jF/leaderboard.gif');
		
		if (!leaderboardData || leaderboardData.length === 0) {
			embed.setDescription(`${emojis.error} No statistics recorded yet! Play some music first.`);
			if (typeof channel.send === 'function') {
				return channel.send({ embeds: [embed] });
			} else {
				return channel.editReply({ embeds: [embed] });
			}
		}
		const client = require('../index.js').client;
		const leaderboardText = [];
		
		for (let i = 0; i < leaderboardData.length; i++) {
			const user = leaderboardData[i];
			const rankEmoji = ['🥇', '🥈', '🥉'][i] || `\`${(i + 1).toString().padStart(2, '0')}\``;
			
			try {
				const discordUser = await client.users.fetch(user.userId).catch(() => null);
				
				let displayName;
				if (discordUser) {
					displayName = discordUser.globalName || discordUser.username;
					if (discordUser.discriminator && discordUser.discriminator !== '0') {
						displayName = `${discordUser.username}#${discordUser.discriminator}`;
					}
				} else {
					displayName = `User ${user.userId.substring(0, 6)}`;
				}
				if (displayName.length > 25) {
					displayName = displayName.substring(0, 22) + '...';
				}
				
				leaderboardText.push(`${rankEmoji} **${displayName}**\n${emojis.music} ${user.totalPlays} plays • ${formatTime(user.totalListeningTime)}`);
			} catch (error) {
				leaderboardText.push(`${rankEmoji} **User ${user.userId.substring(0, 6)}**\n${emojis.music} ${user.totalPlays} plays`);
			}
		}
		
		embed.setDescription(`${embed.data.description}\n\n${leaderboardText.join('\n\n')}`);
		embed.setFooter({ 
			text: `Updated just now • Stats are global across all servers`,
			iconURL: 'https://i.ibb.co/GfHpz0fQ/image.gif'
		});
		
		if (typeof channel.send === 'function') {
			return channel.send({ embeds: [embed] });
		} else {
			return channel.editReply({ embeds: [embed] });
		}
	},

	leaderboardInteraction: async (interaction, leaderboardData) => {
		const { EmbedBuilder } = require('discord.js');
		const emojis = require('../emojis.js');
		const config = require('../config.js');
		
		function formatTime(ms) {
			if (!ms || ms <= 0) return '0m';
			const minutes = Math.floor(ms / 60000);
			const hours = Math.floor(minutes / 60);
			const days = Math.floor(hours / 24);
			
			if (days > 0) return `${days}d`;
			if (hours > 0) return `${hours}h`;
			return `${minutes}m`;
		}
		
		const embed = new EmbedBuilder()
			.setColor(config.embedColor)
			.setTitle(`${emojis.star} Global Music Leaderboard`)
			.setDescription(`${emojis.blacksparkles} Top listeners across all servers ranked by total plays\n${'─'.repeat(45)}`)
			.setThumbnail('https://i.ibb.co/RNtKj2jF/leaderboard.gif');
		
		if (!leaderboardData || leaderboardData.length === 0) {
			embed.setDescription(`${emojis.error} No statistics recorded yet! Play some music first.`);
			return interaction.editReply({ embeds: [embed] });
		}
		const client = interaction.client;
		const leaderboardText = [];
		
		for (let i = 0; i < leaderboardData.length; i++) {
			const user = leaderboardData[i];
			const rankEmoji = ['🥇', '🥈', '🥉'][i] || `\`${(i + 1).toString().padStart(2, '0')}\``;
			
			try {
				const discordUser = await client.users.fetch(user.userId).catch(() => null);
				
				let displayName;
				if (discordUser) {
					displayName = discordUser.globalName || discordUser.username;
					if (discordUser.discriminator && discordUser.discriminator !== '0') {
						displayName = `${discordUser.username}#${discordUser.discriminator}`;
					}
				} else {
					displayName = `User ${user.userId.substring(0, 6)}`;
				}
				if (displayName.length > 25) {
					displayName = displayName.substring(0, 22) + '...';
				}
				
				leaderboardText.push(`${rankEmoji} **${displayName}**\n${emojis.music} ${user.totalPlays} plays • ${formatTime(user.totalListeningTime)}`);
			} catch (error) {
				leaderboardText.push(`${rankEmoji} **User ${user.userId.substring(0, 6)}**\n${emojis.music} ${user.totalPlays} plays`);
			}
		}
		
		embed.setDescription(`${embed.data.description}\n\n${leaderboardText.join('\n\n')}`);
		embed.setFooter({ 
			text: `Updated just now • Stats are global across all servers`,
			iconURL: 'https://i.ibb.co/GfHpz0fQ/image.gif'
		});
		
		return interaction.editReply({ embeds: [embed] });
	},
	buildMainHelpEmbed,
	buildCategoryEmbed,
	getHelpActionRows,
	categories
};