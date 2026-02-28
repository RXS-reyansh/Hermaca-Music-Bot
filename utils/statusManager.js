const { ActivityType } = require('discord.js');

class StatusManager {
    constructor(client, config) {
        this.client = client;
        this.config = config;
        this.botInstance = null;
    }

    /**
     * Detect which bot instance is running based on client ID
     */
    detectBotInstance() {
        const botId = this.client.user.id;
        const instances = this.config.botInstances || {};
        
        for (const [instanceName, instanceConfig] of Object.entries(instances)) {
            if (instanceConfig.clientId === botId) {
                return {
                    name: instanceName,
                    presence: instanceConfig.presence
                };
            }
        }
        
        return {
            name: 'Unknown',
            presence: this.config.defaultPresence
        };
    }

    /**
     * Get activity type from string - FIXED VERSION
     */
    getActivityType(typeString) {
        const types = {
            'Playing': ActivityType.Playing,      // 0
            'Listening': ActivityType.Listening,   // 2
            'Watching': ActivityType.Watching,     // 3
            'Streaming': ActivityType.Streaming,   // 1
            'Competing': ActivityType.Competing    // 5
        };
        return types[typeString] ?? ActivityType.Listening;
    }

    /**
     * Replace placeholders in presence name
     */
    formatPresenceName(name) {
        const guildCount = this.client.guilds.cache.size;
        let totalUsers = 0;
        
        for (const guild of this.client.guilds.cache.values()) {
            totalUsers += guild.memberCount;
        }

        const userDisplay = totalUsers >= 1000 
            ? `${(totalUsers / 1000).toFixed(1)}k` 
            : totalUsers;

        return name
            .replace('{guilds}', guildCount)
            .replace('{users}', userDisplay)
            .replace('{prefix}', this.config.prefix || '~');
    }

    /**
     * Set the presence
     */
    async setPresence() {
        this.botInstance = this.detectBotInstance();
        
        const presenceConfig = this.botInstance.presence;
        const activityType = this.getActivityType(presenceConfig.type);
        const formattedName = this.formatPresenceName(presenceConfig.name);

        const presenceData = {
            activities: [{
                name: formattedName,
                type: activityType
            }],
            status: presenceConfig.status || 'online'
        };

        if (activityType === ActivityType.Streaming) {
            presenceData.activities[0].url = presenceConfig.url || 'https://www.twitch.tv/discord';
        }

        await this.client.user.setPresence(presenceData);
        
        console.log(`[STATUS] ${this.botInstance.name}: "${formattedName}" (${presenceConfig.type})`);
    }
}

module.exports = StatusManager;