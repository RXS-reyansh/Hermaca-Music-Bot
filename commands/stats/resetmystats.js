const emojis = require('../../emojis.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'resetmystats',
    description: 'Reset your personal statistics (irreversible!)',
    category: 'stats',
        owner: false,
    userPerms: [],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_reset')
                    .setLabel('Yes, Reset All Stats')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel_reset')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
            );

        const embed = new EmbedBuilder()
            .setColor(0xff5555)
            .setTitle(`${emojis.error} Reset Statistics Confirmation`)
            .setDescription(`**Are you absolutely sure?**\n\nThis will:\n• Delete all your listening history\n• Remove your top songs/artists\n• Reset your global ranking\n\n**This action is irreversible!**`)
            .setFooter({ text: 'You have 30 seconds to decide' });

        await interaction.editReply({ embeds: [embed], components: [row] });

        const filter = i => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000 });

        collector.on('collect', async i => {
            if (i.customId === 'confirm_reset') {
                try {
                    const collection = client.db.getPrefixedCollection('user_stats');
                    await collection.deleteOne({ discord_user_id: interaction.user.id });
                    await i.update({ content: `Your statistics have been reset!`, embeds: [], components: [] });
                } catch (error) {
                    await i.update({ content: `Failed to reset statistics!`, embeds: [], components: [] });
                }
            } else if (i.customId === 'cancel_reset') {
                await i.update({ content: `Statistics reset cancelled.`, embeds: [], components: [] });
            }
            collector.stop();
        });

        collector.on('end', async () => {
            try {
                await interaction.editReply({ components: [] });
            } catch { /* ignore */ }
        });
    },
    prefixExecute: async (message, args, client) => {
        await messages.error(message, "Please use `/resetmystats` for the interactive reset confirmation.");
    }
};
