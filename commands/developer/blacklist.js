const { EmbedBuilder } = require('discord.js');
const emojis = require('../../emojis.js');
const config = require('../../config.js');
const messages = require('../../utils/messages.js');
const { aliases } = require('../music/play.js');
const ownerId = require('../../config.js').ownerId;

module.exports = {
    name: 'blacklist',
    aliases: ['bl'],
    description: 'Blacklist a user from using the bot (owner only)',
    category: 'developer',
    owner: true,
    userPerms: [],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const targetUser = interaction.options.getUser('user');
        if (!targetUser) {
            // List blacklisted users
            const blacklistedIds = await client.db.getAllBlacklistedUsers();
            if (!blacklistedIds.length) {
                return interaction.editReply('No users are currently blacklisted.');
            }
            const userMentions = [];
            for (const id of blacklistedIds) {
                try {
                    const user = await client.users.fetch(id);
                    userMentions.push(user.toString());
                } catch {
                    userMentions.push(`<@${id}> (unknown user)`);
                }
            }
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${emojis.doakesknows} Blacklisted Users`)
                .setDescription(userMentions.join('\n'))
                .setFooter({ text: `Total: ${blacklistedIds.length}` });
            return interaction.editReply({ embeds: [embed] });
        }

        const success = await client.db.addBlacklistedUser(targetUser.id);
        if (success) {
            await messages.success(interaction, `Successfully blacklisted ${targetUser} from using any commands.`);
        } else {
            await messages.error(interaction, "Failed to blacklist user.");
        }
    },
    prefixExecute: async (message, args, client) => {
        if (message.author.id !== ownerId) {
            return message.reply(`${emojis.blackcrown} | This command is reserved for bot owner only!`);
        }
        const target = args[0];
        if (!target) {
            const blacklistedIds = await client.db.getAllBlacklistedUsers();
            if (!blacklistedIds.length) {
                return messages.info(message.channel, 'No users are currently blacklisted.');
            }
            const userMentions = [];
            for (const id of blacklistedIds) {
                try {
                    const user = await client.users.fetch(id);
                    userMentions.push(user.toString());
                } catch {
                    userMentions.push(`<@${id}> (unknown user)`);
                }
            }
            const embed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle(`${emojis.doakesknows} Blacklisted Bitches`)
                .setDescription(userMentions.join('\n'))
                .setFooter({ text: `Total: ${blacklistedIds.length}` });
            return message.channel.send({ embeds: [embed] });
        }

        let userId = target.replace(/[<@!>]/g, '');
        let user;
        try {
            user = await client.users.fetch(userId, { force: true });
        } catch {
            return messages.error(message, "Invalid user ID or user not found.");
        }

        const success = await client.db.addBlacklistedUser(user.id);
        if (success) {
            await messages.success(message.channel, `Successfully blacklisted ${user} from using any commands of the bot.`);
        } else {
            await messages.error(message.channel, "Failed to blacklist user.");
        }
    }
};