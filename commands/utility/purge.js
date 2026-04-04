const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');
const { PermissionsBitField } = require('discord.js');
const ownerId = require('../../config.js').ownerId;

module.exports = {
    name: 'purge',
    description: 'Delete messages in bulk',
    category: 'utility',
    owner: false,
    userPerms: ['ManageMessages'],
    botPerms: ['ManageMessages'],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const amount = interaction.options.getInteger('amount');
        const all = interaction.options.getBoolean('all');
        const isOwner = interaction.user.id === ownerId;
        const hasAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (all) {
            if (!isOwner && !hasAdmin) {
                return messages.error(interaction, "Only administrators can purge **all** messages.");
            }
            // For slash, we'll just inform to use prefix for the interactive confirmation
            await interaction.editReply(`${emojis.loading} | Confirmation dialog not implemented here – use prefix for now.`);
            return;
        }

        if (!amount) {
            return messages.error(interaction, "Please specify an amount or use `all`.");
        }

        const deleteAmount = Math.min(amount + 1, 100);
        try {
            const deleted = await interaction.channel.bulkDelete(deleteAmount, true);
            const deletedCount = deleted.size - 1;
            await messages.success(interaction, `Deleted ${deletedCount} message${deletedCount !== 1 ? 's' : ''}.`);
        } catch (error) {
            console.error(`Purge slash error: ${error.message}`);
            await messages.error(interaction, `Failed to purge: ${error.message}`);
        }
    },
    prefixExecute: async (message, args, client) => {
        const isOwner = message.author.id === ownerId;
        if (!args[0]) {
            return messages.error(message, "Please specify the number of messages to delete or `all`.");
        }

        const hasManageMessages = message.member.permissions.has('ManageMessages');
        const hasAdmin = message.member.permissions.has('Administrator');

        if (args[0].toLowerCase() === 'all') {
            if (!isOwner && !hasAdmin) {
                return messages.error(message.channel, `Only administrators can purge **all** messages.`);
            }
            await message.delete().catch(() => {});

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('confirm_purge_all').setLabel('Confirm').setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId('cancel_purge_all').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
                );

            const confirmEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${emojis.info} Confirm Channel Purge`)
                .setDescription(`**Are you sure you want to delete ALL messages in ${message.channel}?**\n\nThis action is **irreversible** and may take a while.`)
                .setFooter({ text: 'You have 30 seconds to decide' });

            const confirmMsg = await message.channel.send({ embeds: [confirmEmbed], components: [row] });
            const filter = i => i.user.id === message.author.id;
            const collector = confirmMsg.createMessageComponentCollector({ filter, time: 30000 });

            collector.on('collect', async i => {
                if (i.customId === 'confirm_purge_all') {
                    await i.deferUpdate();
                    await confirmMsg.delete().catch(() => {});

                    let deletedTotal = 0;
                    const MAX_BATCH = 100;
                    const MAX_TOTAL = 1000;
                    let deleted;
                    do {
                        try {
                            deleted = await message.channel.bulkDelete(Math.min(MAX_BATCH, MAX_TOTAL - deletedTotal), true);
                            deletedTotal += deleted.size;
                            if (deleted.size === MAX_BATCH && deletedTotal < MAX_TOTAL) {
                                await new Promise(r => setTimeout(r, 1000));
                            }
                        } catch {
                            break;
                        }
                    } while (deleted.size === MAX_BATCH && deletedTotal < MAX_TOTAL);

                    const successMsg = await messages.success(message.channel, `Cleaned the channel! (${deletedTotal} messages removed)`);
                    setTimeout(() => successMsg.delete().catch(() => {}), 4000);
                } else if (i.customId === 'cancel_purge_all') {
                    await i.deferUpdate();
                    await confirmMsg.delete().catch(() => {});
                    const cancelledMsg = await messages.info(message.channel, 'Purge cancelled.');
                    setTimeout(() => cancelledMsg.delete().catch(() => {}), 4000);
                }
                collector.stop();
            });

            collector.on('end', async () => {
                const disabledRow = ActionRowBuilder.from(row).setComponents(row.components.map(c => ButtonBuilder.from(c).setDisabled(true)));
                await confirmMsg.edit({ components: [disabledRow] });
            });
            return;
        }

        const amount = parseInt(args[0], 10);
        if (isNaN(amount) || amount < 1) {
            return messages.error(message, "Please provide a valid number of messages to delete.");
        }

        if (!isOwner && !hasManageMessages && !hasAdmin) {
            return messages.error(message, "You need `Manage Messages` or `Administrator` permission.");
        }

        const deleteAmount = Math.min(amount + 1, 100);
        if (amount > 99) {
            await messages.info(message, `You requested ${amount}, but Discord only allows bulk deleting up to 100 messages at once. Deleting the last 100.`);
        }

        try {
            const deleted = await message.channel.bulkDelete(deleteAmount, true);
            const deletedCount = deleted.size;
            const successMsg = await messages.success(message, `Cleaned the channel! (${deletedCount} messages removed)`);
            setTimeout(() => successMsg.delete().catch(() => {}), 4000);
        } catch (error) {
            console.error(`Purge error: ${error.message}`);
            if (error.code === 50013) {
                messages.error(message, "I don't have permission to delete messages.");
            } else if (error.code === 10008) {
                messages.error(message, "Messages are too old to bulk delete (older than 14 days).");
            } else {
                messages.error(message, `Failed to purge messages: ${error.message}`);
            }
        }
    }
};