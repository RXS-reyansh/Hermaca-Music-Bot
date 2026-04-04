const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');
const path = require('path');
const fs = require('fs');
const { EmbedBuilder } = require('discord.js');
const config = require('../../config.js');

function getFilterList() {
    const filtersDir = path.join(__dirname, '..', 'filters');
    const files = fs.readdirSync(filtersDir).filter(f => f.endsWith('.js'));
    return files.map(f => f.slice(0, -3)).sort();
}

module.exports = {
    name: 'filter',
    description: 'Add filters to playback',
    category: 'music',
    owner: false,
    userPerms: [],
    botPerms: ['Connect', 'Speak'],
    player: true,
    inVoiceChannel: true,
    sameVoiceChannel: true,
    execute: async (interaction, client) => {
        const filterName = interaction.options.getString('type').toLowerCase();
        const player = client.riffy.players.get(interaction.guild.id);
        if (!player) {
            return messages.error(interaction, "Nothing is playing!");
        }

        // Help
        if (filterName === 'help') {
            const filterList = [
                '8d, 16d',
                'bass', 'bassboost', 'chipmunk', 'clear', 'dance', 'darthvader',
                'daycore', 'deepbass', 'distort', 'earrape', 'electronic', 'enhance',
                'equalizer', 'karaoke', 'lofi', 'lowpass', 'nightcore', 'pitch',
                'rotation', 'slowreverb', 'soft', 'speed', 'treblebass', 'tremolo',
                'vaporwave', 'vibrato', 'vocalboost'
            ];
            const description = filterList.map(f => `• ${f}`).join('\n');
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${emojis.info} Available Filters`)
                .setDescription(description)
                .setFooter({ text: 'Use ~filter <name> or /filter <name> to apply' });
            return interaction.editReply({ embeds: [embed] });
        }

        // Alias: reset -> clear
        let actualFilterName = filterName;
        if (actualFilterName === 'reset') {
            actualFilterName = 'clear';
        }

        // Load filter module
        const filterPath = path.join(__dirname, '..', 'filters', `${actualFilterName}.js`);
        if (!fs.existsSync(filterPath)) {
            const availableFilters = getFilterList();
            return messages.error(interaction, `Unknown filter! Available: ${availableFilters.join(', ')}`);
        }

        const filterModule = require(filterPath);
        try {
            filterModule.apply(player);
            await messages.filterApplied(interaction.channel, player.activeFilters || []);
            await interaction.editReply({ content: '​', embeds: [] }); // empty ack
        } catch (error) {
            console.error(`Filter error: ${error.message}`);
            await messages.error(interaction, "Failed to apply filter.");
        }
    },
    prefixExecute: async (message, args, client) => {
        const filterName = args[0] ? args[0].toLowerCase() : null;
        const player = client.riffy.players.get(message.guild.id);
        if (!player) {
            return messages.error(message, "Nothing is playing!");
        }

        if (!filterName || filterName === 'help') {
            return messages.filterHelp(message.channel);
        }

        // Alias: reset -> clear
        let actualFilterName = filterName;
        if (actualFilterName === 'reset') {
            actualFilterName = 'clear';
        }

        const filterPath = path.join(__dirname, '..', 'filters', `${actualFilterName}.js`);
        if (!fs.existsSync(filterPath)) {
            const availableFilters = getFilterList();
            return messages.error(message, `Unknown filter! Available: ${availableFilters.join(', ')}`);
        }

        const filterModule = require(filterPath);
        try {
            filterModule.apply(player);
            await messages.filterApplied(message.channel, player.activeFilters || []);
        } catch (error) {
            console.error(`Filter error: ${error.message}`);
            await messages.error(message, "Failed to apply filter.");
        }
    }
};