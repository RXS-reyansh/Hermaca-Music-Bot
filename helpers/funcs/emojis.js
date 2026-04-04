async function resolveEmoji(client, identifier, guild = null) {
    let emoji = null;
    let emojiId = null;

    const customEmojiRegex = /^<a?:\w+:(\d+)>$/;
    const match = identifier.match(customEmojiRegex);

    if (match) {
        emojiId = match[1];
    } else if (/^\d+$/.test(identifier)) {
        emojiId = identifier;
    }

    if (emojiId) {
        if (guild) {
            emoji = guild.emojis.cache.get(emojiId);
            if (!emoji) {
                try {
                    emoji = await guild.emojis.fetch(emojiId);
                    if (emoji) client.emojis.cache.set(emojiId, emoji);
                } catch { /* ignore */ }
            }
        }

        if (!emoji) {
            emoji = client.emojis.cache.get(emojiId);
        }

        if (!emoji) {
            for (const g of client.guilds.cache.values()) {
                if (guild && g.id === guild.id) continue;
                emoji = g.emojis.cache.get(emojiId);
                if (emoji) {
                    client.emojis.cache.set(emojiId, emoji);
                    break;
                }
                try {
                    emoji = await g.emojis.fetch(emojiId);
                    if (emoji) {
                        client.emojis.cache.set(emojiId, emoji);
                        break;
                    }
                } catch { /* ignore */ }
            }
        }
    } else {
        const nameLower = identifier.toLowerCase();

        if (guild) {
            emoji = guild.emojis.cache.find(e => e.name.toLowerCase() === nameLower);
        }

        if (!emoji) {
            for (const g of client.guilds.cache.values()) {
                emoji = g.emojis.cache.find(e => e.name.toLowerCase() === nameLower);
                if (emoji) break;
            }
        }
    }

    return emoji;
}

async function replaceEmojiPlaceholders(text, client, guild) {
    const regex = /-emoji-([^\s]+)/g;
    const matches = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
        matches.push({ full: match[0], id: match[1] });
    }

    if (matches.length === 0) return { result: text, invalid: [] };

    const emojiMap = new Map();
    const invalid = [];

    for (const { full, id } of matches) {
        if (id.includes('/$/')) {
            const parts = id.split('/$/');
            const resolvedParts = [];
            let hasInvalid = false;
            for (const part of parts) {
                const emoji = await resolveEmoji(client, part, guild);
                if (emoji) {
                    resolvedParts.push(emoji.toString());
                } else {
                    invalid.push(part);
                    hasInvalid = true;
                }
            }
            if (resolvedParts.length > 0) {
                emojiMap.set(full, resolvedParts.join(''));
            }
        } else {
            const emoji = await resolveEmoji(client, id, guild);
            if (emoji) {
                emojiMap.set(full, emoji.toString());
            } else {
                invalid.push(id);
            }
        }
    }

    let result = text;
    for (const [placeholder, resolved] of emojiMap) {
        result = result.replace(placeholder, resolved);
    }
    return { result, invalid };
}

module.exports = { resolveEmoji, replaceEmojiPlaceholders };