const colors = {
    color1: '#FAF7F3',
    color2: '#F0E4D3',
    color3: '#DCC5B2',
    color4: '#D9A299'
};

function blendColors(hex1, hex2, ratio) {
    const r1 = parseInt(hex1.slice(1, 3), 16);
    const g1 = parseInt(hex1.slice(3, 5), 16);
    const b1 = parseInt(hex1.slice(5, 7), 16);
    const r2 = parseInt(hex2.slice(1, 3), 16);
    const g2 = parseInt(hex2.slice(3, 5), 16);
    const b2 = parseInt(hex2.slice(5, 7), 16);
    const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function hexToAnsi(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `\x1b[38;2;${r};${g};${b}m`;
}

function getGradientColors() {
    const gradientColors = [
        colors.color1,
        blendColors(colors.color1, colors.color2, 0.33),
        blendColors(colors.color1, colors.color2, 0.66),
        colors.color2,
        blendColors(colors.color2, colors.color3, 0.5),
        colors.color3,
        blendColors(colors.color3, colors.color4, 0.5),
        colors.color4
    ];
    return gradientColors;
}

module.exports = {
    colors,
    blendColors,
    hexToAnsi,
    getGradientColors
};