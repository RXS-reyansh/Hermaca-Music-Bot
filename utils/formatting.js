/**
 * Format milliseconds to a duration string (HH:MM:SS or MM:SS)
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
function formatDuration(ms) {
    if (!ms || ms <= 0 || ms === "Infinity") return "LIVE";
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours > 0) {
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Get duration string from a track object
 * @param {object} track - Track object with info property
 * @returns {string} Formatted duration or "LIVE" or "N/A"
 */
function getDurationString(track) {
    if (!track || !track.info) return "N/A";
    if (track.info.stream || track.info.isStream) return "LIVE";
    const duration = track.info.length;
    if (!duration || duration <= 0 || isNaN(duration)) {
        return "N/A";
    }
    return formatDuration(duration);
}

/**
 * Extract thumbnail URL from track info object
 * @param {object} trackInfo - Track info object
 * @returns {string|null} Thumbnail URL or null
 */
function extractThumbnail(trackInfo) {
    if (!trackInfo) return null;

    // Check common properties
    const possibleProps = ["thumbnail", "artworkUrl", "cover", "image", "picture", "thumbnailUrl", "thumbnail_url"];
    for (const prop of possibleProps) {
        const val = trackInfo[prop];
        if (val) {
            if (typeof val === "string" && val.startsWith("http")) return val;
            if (typeof val === "object" && val?.url?.startsWith("http")) return val.url;
        }
    }

    // Check album images
    if (trackInfo.album?.images?.length) {
        const img = trackInfo.album.images[0];
        if (img?.url?.startsWith("http")) return img.url;
    }

    // Check artwork array
    if (Array.isArray(trackInfo.artwork)) {
        const img = trackInfo.artwork.find((a) => a?.url?.startsWith("http"));
        if (img) return img.url;
    }

    return null;
}

module.exports = {
    formatDuration,
    getDurationString,
    extractThumbnail
};