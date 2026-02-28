const { PermissionsBitField } = require("discord.js");

/**
 * Check if a user has permission (owner, admin, or specific permission)
 * @param {string} userId - User ID to check
 * @param {object} guild - Discord guild object
 * @param {string} ownerId - Bot owner ID
 * @param {bigint} permissionFlag - Permission flag to check (e.g., PermissionsBitField.Flags.MoveMembers)
 * @returns {boolean}
 */
function hasPermission(userId, guild, ownerId, permissionFlag) {
    if (userId === ownerId) return true;
    const member = guild.members.cache.get(userId);
    if (!member) return false;
    return member.permissions.has(PermissionsBitField.Flags.Administrator) || 
           member.permissions.has(permissionFlag);
}

/**
 * Check if user has Move Members permission
 */
function hasMoveMembersPermission(userId, guild, ownerId) {
    return hasPermission(userId, guild, ownerId, PermissionsBitField.Flags.MoveMembers);
}

/**
 * Check if user has Mute Members permission
 */
function hasMuteMembersPermission(userId, guild, ownerId) {
    return hasPermission(userId, guild, ownerId, PermissionsBitField.Flags.MuteMembers);
}

/**
 * Check if user has Deafen Members permission
 */
function hasDeafenMembersPermission(userId, guild, ownerId) {
    return hasPermission(userId, guild, ownerId, PermissionsBitField.Flags.DeafenMembers);
}

/**
 * Check if user has Manage Messages permission
 */
function hasManageMessagesPermission(userId, guild, ownerId) {
    return hasPermission(userId, guild, ownerId, PermissionsBitField.Flags.ManageMessages);
}

/**
 * Check if user has Administrator permission
 */
function hasAdminPermission(userId, guild, ownerId) {
    return hasPermission(userId, guild, ownerId, PermissionsBitField.Flags.Administrator);
}

module.exports = {
    hasPermission,
    hasMoveMembersPermission,
    hasMuteMembersPermission,
    hasDeafenMembersPermission,
    hasManageMessagesPermission,
    hasAdminPermission
};