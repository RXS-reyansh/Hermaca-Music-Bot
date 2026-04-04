const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');

module.exports = {
    name: 'membercount',
    aliases: ['mc', 'memcount', 'memc', 'mcount'],
    description: 'Shows the number of members, users, and bots in the server',
    category: 'utility',
    owner: false,
    userPerms: [],
    botPerms: [],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const guild = interaction.guild;
        
        // Use cached members if available, otherwise fetch
        if (guild.members.cache.size === 0 || guild.members.cache.size !== guild.memberCount) {
            await guild.members.fetch({ count: true }); // Only fetch count, not all members
        }
        
        const totalMembers = guild.memberCount;
        const bots = guild.members.cache.filter(m => m.user.bot).size;
        const users = totalMembers - bots;

        const embed = messages.memberCountEmbed(guild, {
            userCount: users,
            botCount: bots,
            totalCount: totalMembers
        }, interaction.user);

        await interaction.editReply({ embeds: [embed] });
    },
    prefixExecute: async (message, args, client) => {
        const guild = message.guild;
        
        // Use cached members if available
        if (guild.members.cache.size === 0 || guild.members.cache.size !== guild.memberCount) {
            await guild.members.fetch({ count: true });
        }
        
        const totalMembers = guild.memberCount;
        const bots = guild.members.cache.filter(m => m.user.bot).size;
        const users = totalMembers - bots;

        const embed = messages.memberCountEmbed(guild, {
            userCount: users,
            botCount: bots,
            totalCount: totalMembers
        }, message.author);

        await message.channel.send({ embeds: [embed] });
    }
};