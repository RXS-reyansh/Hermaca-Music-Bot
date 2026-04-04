const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: '24-7-enable',
    description: 'Enable 24/7 mode in a voice channel',
    category: '24-7',
    owner: false,
    userPerms: ['Administrator'],
    botPerms: ['Connect', 'Speak'],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        let channel = interaction.options.getChannel('channel');
        if (!channel) {
            // Use bot's current voice channel
            const botVoiceChannel = interaction.guild.members.me.voice.channel;
            if (!botVoiceChannel) {
                return messages.error(interaction, "I'm not in a voice channel. Please specify a channel or join one first.");
            }
            channel = botVoiceChannel;
        }
        if (channel.type !== 2) {
            return messages.error(interaction, "Invalid voice channel!");
        }
        if (client.riffy.nodes.size === 0) {
            return messages.error(interaction, "Music nodes are not ready yet.");
        }
        try {
            const player = client.riffy.createConnection({
                guildId: interaction.guild.id,
                voiceChannel: channel.id,
                textChannel: interaction.channel.id,
                deaf: true,
            });
            player.setVolume(10);
            const result = await client.enable24Seven(interaction.guild.id, channel.id);
            if (result.success) {
                await messages.success(interaction, `24/7 enabled. Channel set to <#${channel.id}>`);
            } else {
                await messages.error(interaction, result.message);
            }
        } catch (error) {
            await messages.error(interaction, `Failed to enable 24/7: ${error.message}`);
        }
    }
};