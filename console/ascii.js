const fs = require('fs');
const path = require('path');
const { hexToAnsi, getGradientColors } = require('./colors.js');

const reset = '\x1b[0m';
const bright = '\x1b[1m';

function loadAsciiArt() {
    const asciiPath = path.join(__dirname, 'ascii.txt');
    const asciiArt = fs.readFileSync(asciiPath, 'utf8');
    return asciiArt.split('\n');
}

function displayAsciiArt() {
    const asciiLines = loadAsciiArt();
    const gradientColors = getGradientColors();
    
    console.log('─'.repeat(120));
    
    asciiLines.forEach((line, index) => {
        const colorIndex = Math.min(index, gradientColors.length - 1);
        const color = hexToAnsi(gradientColors[colorIndex]);
        console.log(`${color}${bright}${line}${reset}`);
    });
}

module.exports = { displayAsciiArt };