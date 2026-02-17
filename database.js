const { MongoClient } = require('mongodb');

class Database {
    constructor() {
        this.uri = process.env.MONGO_URI;
        this.client = new MongoClient(this.uri, {
            serverApi: {
                version: '1',
                strict: true,
                deprecationErrors: true,
            },
            tls: true,
            tlsAllowInvalidCertificates: false,
            connectTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        this.dbName = "HermacaDiscordBot";
        this.db = null;
        this.connected = false;

        this.botId = process.env.BOT_IDENTIFIER || '';
        
        if (this.botId) {
            console.log(`🤖 Database initialized for bot: ${this.botId} (using PREFIXED collections)`);
        } else {
            console.log(`🤖 Database initialized for Heaven bot (using ORIGINAL collections)`);
        }
    }

    getPrefixedCollection(collectionName) {
        const prefixedName = this.botId ? `${this.botId}_${collectionName}` : collectionName;
        return this.db.collection(prefixedName);
    }

    async connect() {
        if (this.connected) return true;
        
        try {
            await this.client.connect();
            this.db = this.client.db(this.dbName);
            this.connected = true;
            console.log(`🪐 Connected to MongoDB Atlas for bot: ${this.botId}`);
            return true;
        } catch (error) {
            console.error("❌ MongoDB connection error:", error.message);
            return false;
        }
    }

    async loadGuildVolumes() {
        try {
            await this.connect();
            const collection = this.getPrefixedCollection('volumes');
            const volumes = await collection.find({}).toArray();
            const volumeMap = new Map();
            volumes.forEach(entry => {
                volumeMap.set(entry.guild_id || entry._id, entry.volume);
            });
            return volumeMap;
        } catch (error) {
            console.error("Error loading guild volumes:", error);
            return new Map();
        }
    }

    async saveGuildVolumes(volumeMap) {
        try {
            await this.connect();
            const collection = this.getPrefixedCollection('volumes');
            const operations = Array.from(volumeMap.entries()).map(([guildId, volume]) => ({
                updateOne: {
                    filter: { guild_id: guildId },
                    update: { $set: { volume: volume, updatedAt: new Date() } },
                    upsert: true
                }
            }));
            if (operations.length > 0) {
                await collection.bulkWrite(operations);
            }
            return true;
        } catch (error) {
            console.error("Error saving guild volumes:", error);
            return false;
        }
    }

    async load24SevenData() {
        try {
            await this.connect();
            const collection = this.getPrefixedCollection('twentyfour_seven');
            const data = await collection.find({}).toArray();
            const result = {};
            data.forEach(entry => {
                const guildId = entry.guild_id || entry._id;
                result[guildId] = {
                    channelId: entry.channelId,
                    enabled: entry.enabled || false
                };
            });
            return result;
        } catch (error) {
            console.error("Error loading 24/7 data:", error);
            return {};
        }
    }

    async save24SevenData(data) {
        try {
            await this.connect();
            const collection = this.getPrefixedCollection('twentyfour_seven');
            const operations = Object.entries(data).map(([guildId, settings]) => ({
                updateOne: {
                    filter: { guild_id: guildId },
                    update: { 
                        $set: { 
                            channelId: settings.channelId, 
                            enabled: settings.enabled || false,
                            updatedAt: new Date() 
                        }
                    },
                    upsert: true
                }
            }));
            if (operations.length > 0) {
                await collection.bulkWrite(operations);
            }
            return true;
        } catch (error) {
            console.error("Error saving 24/7 data:", error);
            return false;
        }
    }

    async enable24Seven(guildId, channelId) {
        try {
            await this.connect();
            const collection = this.getPrefixedCollection('twentyfour_seven');
            await collection.updateOne(
                { guild_id: guildId },
                { 
                    $set: { 
                        channelId: channelId,
                        enabled: true,
                        updatedAt: new Date()
                    }
                },
                { upsert: true }
            );
            return { success: true, message: "24/7 enabled" };
        } catch (error) {
            console.error("Error enabling 24/7:", error);
            return { success: false, message: `Database error: ${error.message}` };
        }
    }

    async disable24Seven(guildId) {
        try {
            await this.connect();
            const collection = this.getPrefixedCollection('twentyfour_seven');
            await collection.updateOne(
                { guild_id: guildId },
                { 
                    $set: { 
                        enabled: false,
                        updatedAt: new Date()
                    }
                }
            );
            return { success: true, message: "24/7 disabled" };
        } catch (error) {
            console.error("Error disabling 24/7:", error);
            return { success: false, message: `Database error: ${error.message}` };
        }
    }

    async loadServersData() {
        try {
            await this.connect();
            const collection = this.getPrefixedCollection('servers');
            const servers = await collection.find({}).toArray();
            const result = {};
            servers.forEach(server => {
                const guildId = server.guild_id || server._id;
                result[guildId] = {
                    name: server.name,
                    inviteCode: server.inviteCode || null
                };
            });
            return result;
        } catch (error) {
            console.error("Error loading servers data:", error);
            return {};
        }
    }

    async saveServersData(data) {
        try {
            await this.connect();
            const collection = this.getPrefixedCollection('servers');
            const operations = Object.entries(data).map(([guildId, serverInfo]) => ({
                updateOne: {
                    filter: { guild_id: guildId },
                    update: { 
                        $set: { 
                            name: serverInfo.name,
                            inviteCode: serverInfo.inviteCode,
                            updatedAt: new Date()
                        }
                    },
                    upsert: true
                }
            }));
            if (operations.length > 0) {
                await collection.bulkWrite(operations);
            }
            return true;
        } catch (error) {
            console.error("Error saving servers data:", error);
            return false;
        }
    }

    async loadSpotifyIds() {
        try {
            await this.connect();
            const collection = this.getPrefixedCollection('spotify-ids');
            const ids = await collection.find({}).toArray();
            const result = {};
            ids.forEach(entry => {
                const userId = entry.discord_user_id || entry._id;
                result[userId] = entry.spotify_id;
            });
            return result;
        } catch (error) {
            console.error("Error loading Spotify IDs:", error);
            return {};
        }
    }

    async saveSpotifyIds(data) {
        try {
            await this.connect();
            const collection = this.getPrefixedCollection('spotify-ids');
            const operations = Object.entries(data).map(([userId, spotifyId]) => ({
                updateOne: {
                    filter: { discord_user_id: userId },
                    update: { 
                        $set: { 
                            spotify_id: spotifyId,
                            updatedAt: new Date()
                        }
                    },
                    upsert: true
                }
            }));
            if (operations.length > 0) {
                await collection.bulkWrite(operations);
            }
            return true;
        } catch (error) {
            console.error("Error saving Spotify IDs:", error);
            return false;
        }
    }

    async getSpotifyId(userId) {
        try {
            await this.connect();
            const collection = this.getPrefixedCollection('spotify-ids');
            const doc = await collection.findOne({ discord_user_id: userId });
            return doc ? doc.spotify_id : null;
        } catch (error) {
            console.error("Error getting Spotify ID:", error);
            return null;
        }
    }

    async setSpotifyId(userId, spotifyId) {
        try {
            await this.connect();
            const collection = this.getPrefixedCollection('spotify-ids');
            await collection.updateOne(
                { discord_user_id: userId },
                { 
                    $set: { 
                        spotify_id: spotifyId,
                        updatedAt: new Date()
                    }
                },
                { upsert: true }
            );
            return true;
        } catch (error) {
            console.error("Error setting Spotify ID:", error);
            return false;
        }
    }

    async cleanupOldServers(currentGuildIds) {
        try {
            await this.connect();
            const collection = this.getPrefixedCollection('servers');
            await collection.deleteMany({
                guild_id: { $nin: currentGuildIds }
            });
            return true;
        } catch (error) {
            console.error("Error cleaning up old servers:", error);
            return false;
        }
    }

    async getOrCreateClusterId() {
		try {
			await this.connect();

			const collection = this.db.collection('bot_cluster_registry');
			
			const botSignature = this.botId || 'heaven';

			const existing = await collection.findOne({ botId: botSignature });
			if (existing) {
				console.log(`🆔 Bot ${botSignature} already has Cluster ID: ${existing.clusterId}`);
				return existing.clusterId;
			}

			const highest = await collection.findOne({}, { sort: { clusterId: -1 } });
			const nextClusterId = highest ? highest.clusterId + 1 : 1;

			await collection.insertOne({
				botId: botSignature,
				clusterId: nextClusterId,
				hostname: process.env.HOSTNAME || require('os').hostname(),
				firstSeen: new Date(),
				lastSeen: new Date()
			});
			
			console.log(`🆔 Assigned NEW Cluster ID: ${nextClusterId} for bot: ${botSignature}`);
			return nextClusterId;
			
		} catch (error) {
			console.error("❌ Cluster ID error:", error);
			return 1;
		}
	}

    async close() {
        try {
            await this.client.close();
            this.connected = false;
            console.log("🔌 MongoDB connection closed");
        } catch (error) {
            console.error("Error closing connection:", error);
        }
    }

    async recordSongPlay(userId, trackInfo) {
        try {
            if (!userId || !trackInfo) return false;
            
            const safeTrackInfo = {
                title: trackInfo.title || 'Unknown Track',
                author: trackInfo.author || 'Unknown Artist',
                length: trackInfo.length || 0,
                thumbnail: trackInfo.thumbnail || null,
                identifier: trackInfo.identifier || null
            };
            
            await this.connect();
            const collection = this.getPrefixedCollection('user_stats');
            const songId = trackInfo.identifier || `${trackInfo.title}_${trackInfo.author}`.replace(/[^\w\s]/gi, '');

            await collection.updateOne(
                { discord_user_id: userId },
                { 
                    $inc: { totalPlays: 1, totalListeningTime: trackInfo.length || 0 },
                    $set: { lastUpdated: new Date() },
                    $setOnInsert: { 
                        discord_user_id: userId, 
                        createdAt: new Date(),
                        songs: [],
                        artists: []
                    }
                },
                { upsert: true }
            );

            await collection.updateOne(
                { discord_user_id: userId, 'songs.songId': songId },
                { 
                    $inc: { 
                        'songs.$.plays': 1,
                        'songs.$.totalDuration': trackInfo.length || 0
                    },
                    $set: { 
                        'songs.$.lastPlayed': new Date(),
                        'songs.$.title': trackInfo.title,
                        'songs.$.artist': trackInfo.author || 'Unknown',
                        'songs.$.thumbnail': trackInfo.thumbnail || null
                    }
                }
            );

            await collection.updateOne(
                { discord_user_id: userId, 'songs.songId': { $ne: songId } },
                {
                    $push: {
                        songs: {
                            songId: songId,
                            title: trackInfo.title,
                            artist: trackInfo.author || 'Unknown',
                            thumbnail: trackInfo.thumbnail || null,
                            plays: 1,
                            totalDuration: trackInfo.length || 0,
                            firstPlayed: new Date(),
                            lastPlayed: new Date()
                        }
                    }
                }
            );

            const artist = trackInfo.author || 'Unknown';
            await collection.updateOne(
                { discord_user_id: userId, 'artists.name': artist },
                {
                    $inc: { 
                        'artists.$.plays': 1,
                        'artists.$.totalDuration': trackInfo.length || 0
                    },
                    $set: { 'artists.$.lastPlayed': new Date() }
                }
            );

            await collection.updateOne(
                { discord_user_id: userId, 'artists.name': { $ne: artist } },
                {
                    $push: {
                        artists: {
                            name: artist,
                            plays: 1,
                            totalDuration: trackInfo.length || 0,
                            lastPlayed: new Date()
                        }
                    }
                }
            );
            
            return true;
        } catch (error) {
            console.error('Error recording song play:', error);
            return false;
        }
    }

    async getUserStats(userId) {
        try {
            await this.connect();
            const collection = this.getPrefixedCollection('user_stats');
            const userStats = await collection.findOne({ discord_user_id: userId });
            
            if (!userStats) {
                return {
                    discord_user_id: userId,
                    totalPlays: 0,
                    totalListeningTime: 0,
                    createdAt: new Date(),
                    songs: [],
                    artists: []
                };
            }

            const topSongs = userStats.songs
                ?.sort((a, b) => b.plays - a.plays)
                .slice(0, 10) || [];

            const topArtists = userStats.artists
                ?.sort((a, b) => b.plays - a.plays)
                .slice(0, 5) || [];

            const favoriteGenre = 'Various';
            
            return {
                ...userStats,
                topSongs,
                topArtists,
                favoriteGenre,
                averagePlayTime: userStats.totalPlays > 0 
                    ? Math.floor(userStats.totalListeningTime / userStats.totalPlays / 60000 * 10) / 10
                    : 0
            };
        } catch (error) {
            console.error('Error fetching user stats:', error);
            return null;
        }
    }

    async getUserRank(userId) {
        try {
            await this.connect();
            const collection = this.getPrefixedCollection('user_stats');
            const allUsers = await collection.find({})
                .sort({ totalPlays: -1 })
                .toArray();
            
            const userIndex = allUsers.findIndex(user => user.discord_user_id === userId);
            
            if (userIndex === -1) {
                return { rank: allUsers.length + 1, totalUsers: allUsers.length };
            }
            
            return { 
                rank: userIndex + 1, 
                totalUsers: allUsers.length,
                topUser: allUsers[0]?.discord_user_id || null,
                topPlays: allUsers[0]?.totalPlays || 0
            };
        } catch (error) {
            console.error('Error getting user rank:', error);
            return { rank: 999, totalUsers: 0 };
        }
    }

    async getLeaderboard(limit = 10) {
        try {
            await this.connect();
            const collection = this.getPrefixedCollection('user_stats');
            const topUsers = await collection.find({})
                .sort({ totalPlays: -1 })
                .limit(limit)
                .toArray();
            
            return topUsers.map((user, index) => ({
                position: index + 1,
                userId: user.discord_user_id,
                totalPlays: user.totalPlays || 0,
                totalListeningTime: user.totalListeningTime || 0,
                lastUpdated: user.lastUpdated
            }));
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }
    }

    async resetUserStats(userId) {
        try {
            await this.connect();
            const collection = this.getPrefixedCollection('user_stats');
            await collection.deleteOne({ discord_user_id: userId });
            return true;
        } catch (error) {
            console.error('Error resetting user stats:', error);
            return false;
        }
    }
    
    async setAFK(userId, reason, imageUrl) {
        try {
            await this.connect();
            const collection = this.getPrefixedCollection('afk');
            await collection.updateOne(
                { discord_user_id: userId },
                {
                    $set: {
                        reason: reason || 'AFK',
                        imageUrl: imageUrl || null,
                        timestamp: new Date(),
                        active: true
                    }
                },
                { upsert: true }
            );
            return true;
        } catch (error) {
            console.error('Error setting AFK:', error);
            return false;
        }
    }

    async removeAFK(userId) {
        try {
            await this.connect();
            const collection = this.getPrefixedCollection('afk');
            await collection.deleteOne({ discord_user_id: userId });
            return true;
        } catch (error) {
            console.error('Error removing AFK:', error);
            return false;
        }
    }

    async getAFK(userId) {
        try {
            await this.connect();
            const collection = this.getPrefixedCollection('afk');
            return await collection.findOne({ discord_user_id: userId, active: true });
        } catch (error) {
            console.error('Error getting AFK:', error);
            return null;
        }
    }

	async addNoPrefixUser(userId) {
		try {
			await this.connect();
			const collection = this.getPrefixedCollection('noprefix_users');
			await collection.updateOne(
				{ user_id: userId },
				{ $set: { user_id: userId, addedAt: new Date() } },
				{ upsert: true }
			);
			return true;
		} catch (error) {
			console.error('Error adding noprefix user:', error);
			return false;
		}
	}

	async removeNoPrefixUser(userId) {
		try {
			await this.connect();
			const collection = this.getPrefixedCollection('noprefix_users');
			const result = await collection.deleteOne({ user_id: userId });
			return result.deletedCount > 0;
		} catch (error) {
			console.error('Error removing noprefix user:', error);
			return false;
		}
	}

	async getAllNoPrefixUsers() {
		try {
			await this.connect();
			const collection = this.getPrefixedCollection('noprefix_users');
			const users = await collection.find({}).toArray();
			return users.map(u => u.user_id);
		} catch (error) {
			console.error('Error getting noprefix users:', error);
			return [];
		}
	}

	async isNoPrefixUser(userId) {
		try {
			await this.connect();
			const collection = this.getPrefixedCollection('noprefix_users');
			const user = await collection.findOne({ user_id: userId });
			return !!user;
		} catch (error) {
			console.error('Error checking noprefix user:', error);
			return false;
		}
	}

	async getNoprefixGlobalEnabled() {
		try {
			await this.connect();
			const collection = this.getPrefixedCollection('settings');
			const doc = await collection.findOne({ _id: 'noprefix_global' });
			if (!doc) {

				await collection.insertOne({ _id: 'noprefix_global', enabled: true });
				return true;
			}
			return doc.enabled;
		} catch (error) {
			console.error('Error getting noprefix global enabled:', error);
			return true;
		}
	}

	async setNoprefixGlobalEnabled(enabled) {
		try {
			await this.connect();
			const collection = this.getPrefixedCollection('settings');
			await collection.updateOne(
				{ _id: 'noprefix_global' },
				{ $set: { enabled } },
				{ upsert: true }
			);
			return true;
		} catch (error) {
			console.error('Error setting noprefix global enabled:', error);
			return false;
		}
	}
	
	async getCountingConfig(guildId) {
	  try {
		await this.connect();
		const collection = this.getPrefixedCollection('counting');
		return await collection.findOne({ guild_id: guildId });
	  } catch (error) {
		console.error('Error getting counting config:', error);
		return null;
	  }
	}

	async setCountingChannel(guildId, channelId) {
	  try {
		await this.connect();
		const collection = this.getPrefixedCollection('counting');
		await collection.updateOne(
		  { guild_id: guildId },
		  {
			$set: {
			  channel_id: channelId,
			  enabled: true,
			  updated_at: new Date()
			},
			$setOnInsert: {
			  current_number: 0,
			  last_user_id: null,
			  toggle_reset: false   // renamed
			}
		  },
		  { upsert: true }
		);
		return true;
	  } catch (error) {
		console.error('Error setting counting channel:', error);
		return false;
	  }
	}

	async disableCounting(guildId) {
	  try {
		await this.connect();
		const collection = this.getPrefixedCollection('counting');
		await collection.updateOne(
		  { guild_id: guildId },
		  { $set: { enabled: false, updated_at: new Date() } }
		);
		return true;
	  } catch (error) {
		console.error('Error disabling counting:', error);
		return false;
	  }
	}

	async setCountingToggleReset(guildId, enabled) {   // renamed
	  try {
		await this.connect();
		const collection = this.getPrefixedCollection('counting');
		await collection.updateOne(
		  { guild_id: guildId },
		  { $set: { toggle_reset: enabled, updated_at: new Date() } }
		);
		return true;
	  } catch (error) {
		console.error('Error setting toggle-reset:', error);
		return false;
	  }
	}

	async setCountingStart(guildId, startNumber) {
	  try {
		await this.connect();
		const collection = this.getPrefixedCollection('counting');
		await collection.updateOne(
		  { guild_id: guildId },
		  {
			$set: {
			  current_number: startNumber,
			  last_user_id: null,
			  updated_at: new Date()
			}
		  }
		);
		return true;
	  } catch (error) {
		console.error('Error setting counting start:', error);
		return false;
	  }
	}

	async updateCountingAfterCorrect(guildId, newNumber, userId) {
	  try {
		await this.connect();
		const collection = this.getPrefixedCollection('counting');
		await collection.updateOne(
		  { guild_id: guildId },
		  {
			$set: {
			  current_number: newNumber,
			  last_user_id: userId,
			  updated_at: new Date()
			}
		  }
		);
		return true;
	  } catch (error) {
		console.error('Error updating counting:', error);
		return false;
	  }
	}

	async resetCounting(guildId) {
	  try {
		await this.connect();
		const collection = this.getPrefixedCollection('counting');
		await collection.updateOne(
		  { guild_id: guildId },
		  {
			$set: {
			  current_number: 0,
			  last_user_id: null,
			  updated_at: new Date()
			}
		  }
		);
		return true;
	  } catch (error) {
		console.error('Error resetting counting:', error);
		return false;
	  }
	}
}

module.exports = new Database();