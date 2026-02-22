const config = require("./config.js");

// true color ANSI
const colorMap = {
    CLIENT: config.colorClient,
    DATABASE: config.colorDatabase,
    NODE: config.colorNode,
    'LOADING DATA': config.colorLoadingData,
    'LOADING DATA - 24/7': config.color247,
    OWNER: config.colorOwner,
    BOT: config.colorBot,
    'SERVER LIST': config.colorServerList,
    SLASH: config.colorSlash,
    'YAY!': config.colorYay,
    ERROR: config.colorError,
    LYRICS: config.colorLyrics,
};

function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    }
     : null;
}

function colorize(text, hex) {
    const rgb = hexToRgb(hex);
    if (!rgb)
        return text; // fallback
    return `\x1b[38;2;${rgb.r};${rgb.g};${rgb.b}m${text}\x1b[0m`;
}

let botReady = false;

function setBotReady(value) {
    botReady = value;
}

function log(tag, message) {
    if (botReady && tag !== 'ERROR' && tag !== 'LYRICS')
        return;
    const colorHex = colorMap[tag] || '#ffffff';
    const coloredTag = colorize(`[${tag}]`, colorHex);
    console.log(`${coloredTag} ${message}`);
}

function line() {
    console.log('─'.repeat(60));
}

module.exports = {
    log,
    line,
    setBotReady
};