const config = require('../config.js');

/**
 * Get display server count based on bot instance configuration
 * @param {string} clientId - The bot's client ID
 * @param {number} actualGuildCount - Real guild count from client.guilds.cache.size
 * @returns {number} Display server count
 */
function getDisplayServerCount(clientId, actualGuildCount) {
    const instance = Object.values(config.botInstances).find(inst => inst.clientId === clientId);
    if (instance && instance.displayServerCount !== null && instance.displayServerCount !== undefined) {
        return instance.displayServerCount;
    }
    return actualGuildCount;
}

/**
 * Get display user count based on bot instance configuration
 * @param {string} clientId - The bot's client ID
 * @param {number} actualUserCount - Real user count from client.users.cache.size
 * @returns {number} Display user count
 */
function getDisplayUserCount(clientId, actualUserCount) {
    const instance = Object.values(config.botInstances).find(inst => inst.clientId === clientId);
    if (instance && instance.displayUserCount !== null && instance.displayUserCount !== undefined) {
        return instance.displayUserCount;
    }
    return actualUserCount;
}

/**
 * Get build name based on bot instance configuration
 * @param {string} clientId - The bot's client ID
 * @returns {string} Build name
 */
function getBuildName(clientId) {
    const instance = Object.values(config.botInstances).find(inst => inst.clientId === clientId);
    if (instance && instance.buildName) {
        return instance.buildName;
    }
    return config.buildName || 'Hermaca';
}

module.exports = { getDisplayServerCount, getDisplayUserCount, getBuildName };