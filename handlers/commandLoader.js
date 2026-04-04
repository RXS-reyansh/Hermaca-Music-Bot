const fs = require('fs');
const path = require('path');

async function loadCommands(client) {
    client.commands = new Map();        // slash commands
    client.prefixCommands = new Map();  // prefix commands

    const categories = fs.readdirSync('./commands');
    for (const category of categories) {
        const categoryPath = path.join('./commands', category);
        if (!fs.statSync(categoryPath).isDirectory()) continue;

        const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(path.join('../', categoryPath, file));
            if (!command.name) {
                console.error(`⚠️ Command file ${file} missing 'name' property`);
                continue;
            }

            // Slash command
            if (command.execute) {
                client.commands.set(command.name, command);
            }

            // Prefix command (with aliases)
            if (command.prefixExecute) {
                client.prefixCommands.set(command.name, command);
                if (command.aliases && Array.isArray(command.aliases)) {
                    for (const alias of command.aliases) {
                        client.prefixCommands.set(alias, command);
                    }
                }
            }
        }
    }
}

module.exports = { loadCommands };