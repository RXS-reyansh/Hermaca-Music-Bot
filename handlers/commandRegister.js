const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.js');
const { log, line } = require('../utils/logger.js');

/**
 * Recursively loads all slash command definitions from a directory.
 * @param {string} dir - Directory to scan.
 * @returns {Array} Array of SlashCommandBuilder objects (or their JSON forms).
 */
function loadSlashCommands(dir) {
    const commands = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            commands.push(...loadSlashCommands(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            try {
                const command = require(fullPath);
                
                if (!command) {
                    log('ERROR', `Slash command file ${entry.name} exported null/undefined`);
                    continue;
                }
                
                if (command.data) {
                    if (Array.isArray(command.data)) {
                        commands.push(...command.data.map(cmd => cmd.toJSON()));
                    } else {
                        commands.push(command.data.toJSON());
                    }
                } else if (Array.isArray(command)) {
                    commands.push(...command.map(cmd => cmd.toJSON()));
                } else {
                    log('ERROR', `Slash command file ${entry.name} has invalid export. Expected 'data' property or array.`);
                }
            } catch (err) {
                log('ERROR', `Failed to load slash command ${entry.name}: ${err.message}`);
            }
        }
    }
    return commands;
}

/**
 * Registers all slash commands with Discord.
 * @param {Client} client - Discord client (unused, but kept for consistency)
 */
async function registerSlashCommands(client) {
    try {
        const commandsPath = path.join(__dirname, '../slashCommands');
        
        log('SLASH', `ℹ️ Registering slash commands globally...`);

        if (!config.clientId) {
            log('ERROR', `❌ No clientId found in config!`);
            return;
        }

        if (!fs.existsSync(commandsPath)) {
            log('ERROR', `❌ slashCommands folder not found at: ${commandsPath}`);
            return;
        }

        const commands = loadSlashCommands(commandsPath);
        
        if (commands.length === 0) {
            log('SLASH', `ℹ️ No slash commands found to register.`);
            return;
        }

        log('SLASH', `ℹ️ Number of commands: ${commands.length}`);

        const rest = new REST({ version: '10' }).setToken(config.botToken);
        const response = await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands }
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

module.exports = { registerSlashCommands };