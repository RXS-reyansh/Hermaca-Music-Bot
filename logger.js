const config = require("./config.js");

// Color logging utility (true color ANSI)
const colorMap = {
    CLIENT: config.colorClient || '#00ff00',
    DATABASE: config.colorDatabase || '#00ffff',
    NODE: config.colorNode || '#ffff00',
    'LOADING DATA': config.colorLoadingData || '#ff00ff',
    'LOADING DATA - 24/7': config.color247 || '#ffa500',
    OWNER: config.colorOwner || '#ff69b4',
    BOT: config.colorBot || '#87ceeb',
    'SERVER LIST': config.colorServerList || '#98fb98',
    SLASH: config.colorSlash || '#ffd700',
    'YAY!': config.colorYay || '#ff4500',
    ERROR: config.colorError || '#ff5555',
};

function hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function colorize(text, hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return text; // fallback
    return `\x1b[38;2;${rgb.r};${rgb.g};${rgb.b}m${text}\x1b[0m`;
}

let botReady = false;

function setBotReady(value) {
    botReady = value;
}

function log(tag, message) {
    if (botReady && tag !== 'ERROR') return; // suppress non‑errors after ready
    const colorHex = colorMap[tag] || '#ffffff';
    const coloredTag = colorize(`[${tag}]`, colorHex);
    console.log(`${coloredTag} ${message}`);
}

function line() {
    console.log('─'.repeat(60));
}

module.exports = { log, line, setBotReady };