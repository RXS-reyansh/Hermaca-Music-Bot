const Genius = require("genius-lyrics");
const db = require("../database/database.js");

// Parse GENIUS_TOKEN into array of { token, name }
const GENIUS_TOKENS = (process.env.GENIUS_TOKEN || '')
    .split('|')
    .map(entry => {
        const parts = entry.trim().split(':');
        const token = parts[0];
        const name = parts[1] || 'Unknown';
        return { token, name };
    })
    .filter(entry => entry.token);

let geniusClients = [];
let geniusClientNames = [];

GENIUS_TOKENS.forEach(({
        token,
        name
    }) => {
    try {
        const client = new Genius.Client(token);
        geniusClients.push(client);
        geniusClientNames.push(name);
    } catch (e) {
        console.error("Invalid Genius token:", token);
    }
});

let currentGeniusIndex = 0;

function getGeniusClient() {
    if (geniusClients.length === 0)
        return null;
    const client = geniusClients[currentGeniusIndex];
    currentGeniusIndex = (currentGeniusIndex + 1) % geniusClients.length;
    return client;
}

function getCurrentGeniusClientName() {
    if (geniusClientNames.length === 0)
        return null;
    // Get the name of the client that was just used (the previous index)
    const prevIndex = (currentGeniusIndex - 1 + geniusClientNames.length) % geniusClientNames.length;
    return geniusClientNames[prevIndex];
}

function cleanQuery(text) {
    return text
    .replace(/\(Official.*?\)/gi, "")
    .replace(/\[.*?\]/g, "")
    .replace(/lyrics?/gi, "")
    .replace(/official music video/gi, "")
    .replace(/audio/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanLyricsText(raw) {
    const lines = raw.split('\n');
    const filtered = [];
    let lyricsStarted = false;
    for (let line of lines) {
        const trimmed = line.trim();
        if (!lyricsStarted) {
            if (/contributors?|translations?|read more|embed|share url|copy|you might also like|see .*? live/i.test(trimmed)) {
                continue;
            }
            if (trimmed.length > 0) {
                lyricsStarted = true;
                filtered.push(line);
            }
        } else {
            if (/embed|share url|copy|you might also like|see .*? live/i.test(trimmed)) {
                continue;
            }
            filtered.push(line);
        }
    }
    return filtered.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function boldBracketLines(lyrics) {
    return lyrics.split('\n').map(line => {
        if (line.match(/^\[.*\]$/)) {
            return `**${line}**`;
        }
        return line;
    }).join('\n');
}

async function fetchFromGenius(title, artist) {
    if (geniusClients.length === 0)
        return null;
    const client = getGeniusClient();
    if (!client)
        return null;
    const clientName = getCurrentGeniusClientName();

    try {
        const cleanTitle = cleanQuery(title);
        const cleanArtist = artist ? cleanQuery(artist.replace(/\s*- Topic$/i, "")) : "";
        const searchQuery = cleanArtist ? `${cleanArtist} ${cleanTitle}` : cleanTitle;

        const searches = await client.songs.search(searchQuery);
        if (!searches || searches.length === 0)
            return null;

        const song = searches[0];
        let lyrics = await song.lyrics();
        lyrics = cleanLyricsText(lyrics);
        return {
            lyrics,
            source: "Genius",
            clientName: clientName
        };
    } catch (err) {
        console.error(`[Genius] Error: ${err.message}`);
        return null;
    }
}

async function fetchFromLyricsOvh(title, artist) {
    if (!artist)
        return null;
    try {
        const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
        const res = await fetch(url);
        if (!res.ok)
            return null;
        const data = await res.json();
        if (data.lyrics) {
            return {
                lyrics: data.lyrics,
                source: "lyrics.ovh"
            };
        }
    } catch (err) {
        console.error(`[Lyrics.ovh] Error: ${err.message}`);
    }
    return null;
}

async function fetchFromLRCLIB(title, artist) {
    try {
        const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist || "")}&track_name=${encodeURIComponent(title)}`;
        const res = await fetch(url);
        if (!res.ok)
            return null;
        const data = await res.json();
        if (data.syncedLyrics || data.plainLyrics) {
            const lyrics = data.syncedLyrics || data.plainLyrics;
            return {
                lyrics,
                source: "LRCLIB"
            };
        }
    } catch (err) {
        console.error(`[LRCLIB] Error: ${err.message}`);
    }
    return null;
}

async function getLyrics(trackTitle, artist = "") {
    const cacheKey = `${artist}|${trackTitle}`.toLowerCase().replace(/\s+/g, " ");
    const cached = await db.getLyricsCache(cacheKey);
    if (cached) {
        /* console.log(`[Cache] Found lyrics for "${trackTitle}"`); */
        return {
            ...cached,
            cached: true
        };
    }
    let result = await fetchFromGenius(trackTitle, artist);
    if (!result) {
        result = await fetchFromLyricsOvh(trackTitle, artist);
    }
    if (!result) {
        result = await fetchFromLRCLIB(trackTitle, artist);
    }
    if (result) {
        result.lyrics = boldBracketLines(result.lyrics);

        const marker = "\n\n─── ⋆⋅ ♰ ⋅⋆ ─── End of lyrics ─── ⋆⋅ ♰ ⋅⋆ ───";
        if (!result.lyrics.includes("End of lyrics")) {
            result.lyrics = result.lyrics.trim() + marker;
        }
        result.cached = false;
        await db.saveLyricsCache(cacheKey, result);
    }

    return result;
}

module.exports = {
    getLyrics
};