const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('filter')
        .setDescription('Add filters to playback')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Filter type')
                .setRequired(true)
                .addChoices(
                    { name: '8d', value: '8d' },
                    { name: '16d', value: '16d' },
                    { name: 'bass', value: 'bass' },
                    { name: 'bassboost', value: 'bassboost' },
                    { name: 'chipmunk', value: 'chipmunk' },
                    { name: 'clear', value: 'clear' },
                    { name: 'reset', value: 'reset' },
                    { name: 'dance', value: 'dance' },
                    { name: 'darthvader', value: 'darthvader' },
                    { name: 'daycore', value: 'daycore' },
                    { name: 'deepbass', value: 'deepbass' },
                    { name: 'distort', value: 'distort' },
                    { name: 'earrape', value: 'earrape' },
                    { name: 'electronic', value: 'electronic' },
                    { name: 'enhance', value: 'enhance' },
                    { name: 'equalizer', value: 'equalizer' },
                    { name: 'karaoke', value: 'karaoke' },
                    { name: 'lofi', value: 'lofi' },
                    { name: 'lowpass', value: 'lowpass' },
                    { name: 'nightcore', value: 'nightcore' },
                    { name: 'pitch', value: 'pitch' },
                    { name: 'rotation', value: 'rotation' },
                    { name: 'slowreverb', value: 'slowreverb' },
                    { name: 'soft', value: 'soft' },
                    { name: 'speed', value: 'speed' }
                ))
};