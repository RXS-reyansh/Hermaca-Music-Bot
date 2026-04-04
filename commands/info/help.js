const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const emojis = require('../../emojis.js');
const config = require('../../config.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'help',
    description: 'Show all commands or get help for a specific command',
    category: 'utility',
    owner: false,
    userPerms: [],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const specificCommand = interaction.options.getString('command');
        if (specificCommand) {
            // Get command details from the command object
            const command = client.commands.get(specificCommand.toLowerCase());
            if (!command) {
                return messages.error(interaction, `Command "${specificCommand}" not found.`);
            }
            const actualPrefix = client.getGuildPrefix(interaction.guild.id);
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${emojis.blackbutterfly} ${command.name} command`)
                .setDescription(`**${command.description}**\n\n**Usage:** \`${actualPrefix}${command.name} ${getUsageInfo(command)}\``)
                .setFooter({ text: `Use ${actualPrefix}help for all commands` });
            return interaction.editReply({ embeds: [embed] });
        }
        // General help
        await sendHelpWithComponents(interaction, client);
    },
    prefixExecute: async (message, args, client) => {
        if (args.length > 0) {
            const cmdName = args[0].toLowerCase();
            const command = client.prefixCommands.get(cmdName);
            if (!command) {
                return messages.error(message, `Command "${cmdName}" not found.`);
            }
            const actualPrefix = client.getGuildPrefix(message.guild.id);
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${emojis.blackbutterfly} ${command.name} command`)
                .setDescription(`**${command.description}**\n\n**Usage:** \`${actualPrefix}${command.name} ${getUsageInfo(command)}\``)
                .setFooter({ text: `Use ${actualPrefix}help for all commands` });
            return message.channel.send({ embeds: [embed] });
        }
        await sendPrefixHelpWithComponents(message, client);
    }
};

// Helper to get usage info (could be enhanced)
function getUsageInfo(command) {
    // You can add a usage property to commands or build from options
    // For simplicity, return empty for now
    return '';
}

async function sendHelpWithComponents(interaction, client) {
    const guild = interaction.guild;
    const user = interaction.user;
    const prefix = client.getGuildPrefix(guild.id);

    const embed = messages.buildMainHelpEmbed(guild, user, prefix);
    const rows = messages.getHelpActionRows();

    await interaction.editReply({ embeds: [embed], components: rows });

    const message = await interaction.fetchReply();
    const collector = message.createMessageComponentCollector({
        filter: i => i.user.id === user.id,
        time: 300000
    });

    collector.on('collect', async i => {
        if (i.customId === 'help_home') {
            const mainEmbed = messages.buildMainHelpEmbed(guild, i.user, prefix);
            await i.update({ embeds: [mainEmbed], components: messages.getHelpActionRows() });
        } else if (i.customId === 'help_category') {
            const categoryKey = i.values[0];
            const categoryName = i.component.options.find(opt => opt.value === categoryKey).label;
            const categories = messages.loadDynamicCategories();   // ✅ fix
            const commands = categories[categoryKey];              // ✅ fix
            const embed = messages.buildCategoryEmbed(guild, categoryKey, categoryName, commands, i.user, prefix);
            await i.update({ embeds: [embed], components: messages.getHelpActionRows(categoryKey) });
        }
    });

    collector.on('end', () => {
        const disabledRows = messages.getHelpActionRows().map(row => {
            const rowBuilder = ActionRowBuilder.from(row);
            return rowBuilder.setComponents(
                row.components.map(c => {
                    if (c.data.type === 3) { // StringSelectMenuBuilder
                        return new StringSelectMenuBuilder(c.data).setDisabled(true);
                    } else { // ButtonBuilder
                        return new ButtonBuilder(c.data).setDisabled(true);
                    }
                })
            );
        });
        interaction.editReply({ components: disabledRows }).catch(() => {});
    });
}

async function sendPrefixHelpWithComponents(message, client) {
    const guild = message.guild;
    const user = message.author;
    const prefix = client.getGuildPrefix(guild.id);

    const embed = messages.buildMainHelpEmbed(guild, user, prefix);
    const rows = messages.getHelpActionRows();

    const sent = await message.channel.send({ embeds: [embed], components: rows });

    const collector = sent.createMessageComponentCollector({
        filter: i => i.user.id === user.id,
        time: 300000
    });

    collector.on('collect', async i => {
        if (i.customId === 'help_home') {
            const mainEmbed = messages.buildMainHelpEmbed(guild, i.user, prefix);
            await i.update({ embeds: [mainEmbed], components: messages.getHelpActionRows() });
        } else if (i.customId === 'help_category') {
            const categoryKey = i.values[0];
            const categoryName = i.component.options.find(opt => opt.value === categoryKey).label;
            const categories = messages.loadDynamicCategories();   // ✅ fix
            const commands = categories[categoryKey];              // ✅ fix
            const embed = messages.buildCategoryEmbed(guild, categoryKey, categoryName, commands, i.user, prefix);
            await i.update({ embeds: [embed], components: messages.getHelpActionRows(categoryKey) });
        }
    });

    collector.on('end', () => {
        const disabledRows = messages.getHelpActionRows().map(row => {
            const rowBuilder = ActionRowBuilder.from(row);
            return rowBuilder.setComponents(
                row.components.map(c => {
                    if (c.data.type === 3) { // StringSelectMenuBuilder
                        return new StringSelectMenuBuilder(c.data).setDisabled(true);
                    } else { // ButtonBuilder
                        return new ButtonBuilder(c.data).setDisabled(true);
                    }
                })
            );
        });
        sent.edit({ components: disabledRows }).catch(() => {});
    });
}