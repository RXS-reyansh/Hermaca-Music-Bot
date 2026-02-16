// quoteGenerator.js – Aesthetic quote image generator
// Now with avatar placement working for both layouts, smaller quote box, and updated footer.

const { createCanvas, loadImage, registerFont } = require('canvas');
const fetch = require('node-fetch');
const path = require('path');
const config = require('../config.js');

// ==================== HARDCODED DEFAULT BACKGROUND ====================
const DEFAULT_BACKGROUND_URL = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=630&fit=crop';

// Helper functions
function roundRect(ctx, x, y, width, height, radius) {
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        radius = { ...{ tl: 0, tr: 0, br: 0, bl: 0 }, ...radius };
    }
    if (width < 0) width = 0;
    if (height < 0) height = 0;
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    return ctx;
}

function wrapText(ctx, text, maxWidth, fontSize) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        if (width < maxWidth) {
            currentLine += ' ' + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

function applyGrayscaleFilter(ctx, x, y, width, height) {
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
    }
    ctx.putImageData(imageData, x, y);
}

async function downloadImage(url) {
    try {
        if (!url || typeof url !== 'string') return null;
        if (!url.startsWith('http://') && !url.startsWith('https://')) return null;
        const response = await fetch(url, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        if (!response.ok) return null;
        return await response.buffer();
    } catch {
        return null;
    }
}

// Font registration
try {
    const fontsPath = path.join(__dirname, '../fonts');
    registerFont(path.join(fontsPath, 'Poppins-Regular.ttf'), { family: 'Poppins', weight: '400' });
    registerFont(path.join(fontsPath, 'Poppins-Bold.ttf'), { family: 'Poppins', weight: '700' });
    registerFont(path.join(fontsPath, 'Poppins-Italic.ttf'), { family: 'Poppins', style: 'italic', weight: '400' });
    console.log('✅ Custom fonts loaded');
} catch (error) {
    console.log('⚠️ Using default fonts (Poppins not found):', error.message);
}

// Theme colors
const themeColors = {
    light: {
        bgGradient: ['#f9f3e8', '#e8e3f5', '#d9eaf5', '#f5e3e3'],
        cardBg: 'rgba(255, 255, 255, 0.8)',
        textPrimary: '#2d3e4f',
        textSecondary: '#6b5e7a',
        accent: '#c5b9e0',
        border: '#b8a9d9',
        divider: '#c5b9e0',
        footer: '#8a7a9a'
    },
    dark: {
        bgGradient: ['#1a1625', '#251a2a', '#1a2430', '#252235'],
        cardBg: 'rgba(30, 20, 40, 0.85)',
        textPrimary: '#f0e6f5',
        textSecondary: '#b0a5c0',
        accent: '#4a3f5a',
        border: '#a08ac0',
        divider: '#6f5e8a',
        footer: '#a090b0'
    }
};

// ==================== LAYOUT 1: HORIZONTAL (1200x630) ====================
async function drawLayout1(ctx, width, height, avatarImage, displayName, username, quoteText, theme, avatarPosition, boldText, fontFamily, colors) {
    // Determine which side the avatar is on
    const isAvatarLeft = avatarPosition === 'left';
    
    const avatarSideWidth = Math.floor(width * 2 / 5);
    const quoteSideWidth = width - avatarSideWidth;
    
    const avatarX = isAvatarLeft ? 0 : quoteSideWidth;
    const quoteX = isAvatarLeft ? avatarSideWidth : 0;
    
    // Avatar side background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(avatarX, 0, avatarSideWidth, height);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    for (let i = 0; i < 150; i++) {
        ctx.fillRect(avatarX + Math.random() * avatarSideWidth, Math.random() * height, 1, 1);
    }

    // Avatar (280px)
    const avatarSize = 280;
    const avatarCenterX = avatarX + avatarSideWidth / 2;
    const avatarDrawX = avatarCenterX - avatarSize / 2;
    const avatarY = 80;

    if (avatarImage) {
        ctx.save();
        roundRect(ctx, avatarDrawX, avatarY, avatarSize, avatarSize, 20);
        ctx.clip();
        ctx.drawImage(avatarImage, avatarDrawX, avatarY, avatarSize, avatarSize);
        ctx.restore();
    } else {
        ctx.fillStyle = colors.accent;
        roundRect(ctx, avatarDrawX, avatarY, avatarSize, avatarSize, 20);
        ctx.fill();
    }
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 2;
    roundRect(ctx, avatarDrawX, avatarY, avatarSize, avatarSize, 20);
    ctx.stroke();

    // Display name
    ctx.font = `bold 28px "Poppins", sans-serif`;
    ctx.fillStyle = colors.textPrimary;
    ctx.textAlign = 'center';
    ctx.fillText(displayName, avatarCenterX, avatarY + avatarSize + 45);

    // Username
    ctx.font = '22px "Poppins", sans-serif';
    ctx.fillStyle = colors.textSecondary;
    ctx.fillText('@' + username, avatarCenterX, avatarY + avatarSize + 75);

    // Quote side background
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(quoteX, 0, quoteSideWidth, height);
    const quoteGradient = ctx.createLinearGradient(quoteX, 0, quoteX + quoteSideWidth, 0);
    quoteGradient.addColorStop(0, 'rgba(0,0,0,0.9)');
    quoteGradient.addColorStop(1, 'rgba(20,20,20,0.7)');
    ctx.fillStyle = quoteGradient;
    ctx.fillRect(quoteX, 0, quoteSideWidth, height);

    // Divider line
    const dividerX = isAvatarLeft ? avatarSideWidth : quoteSideWidth;
    ctx.fillStyle = colors.divider;
    ctx.fillRect(dividerX - 2, 0, 4, height);

    // Quote box (smaller: increased margins)
    const boxMargin = 60;
    const boxX = quoteX + boxMargin;
    const boxY = boxMargin;
    const boxWidth = quoteSideWidth - (boxMargin * 2);
    const boxHeight = height - (boxMargin * 2);

    ctx.fillStyle = colors.cardBg;
    roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 20);
    ctx.fill();
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1.5;
    roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 20);
    ctx.stroke();

    // Quote text
    const textMargin = 40;
    const maxTextWidth = boxWidth - (textMargin * 2);
    ctx.font = `${boldText ? 'bold' : 'normal'} 28px "${fontFamily}", sans-serif`;
    const lines = wrapText(ctx, quoteText, maxTextWidth, 28);
    const lineHeight = 36;
    const totalTextHeight = lines.length * lineHeight;
    const startY = boxY + (boxHeight - totalTextHeight) / 2 + 28;

    ctx.textAlign = 'center';
    ctx.fillStyle = colors.textPrimary;
    lines.forEach((line, i) => {
        ctx.fillText(line, boxX + boxWidth / 2, startY + i * lineHeight);
    });

    // Quote marks
    ctx.font = 'bold 80px "Georgia", serif';
    ctx.fillStyle = colors.accent;
    ctx.textAlign = 'left';
    ctx.fillText('“', boxX + 15, boxY + 90);
    ctx.textAlign = 'right';
    ctx.fillText('”', boxX + boxWidth - 15, boxY + boxHeight - 25);

    // Footer (two lines)
    const footerY = boxY + boxHeight + 35;
    ctx.font = '16px "Poppins", sans-serif';
    ctx.fillStyle = colors.footer;
    ctx.textAlign = 'center';
    ctx.fillText('✨ Powered by Hermaca', boxX + boxWidth / 2, footerY);
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    ctx.fillText(dateStr, boxX + boxWidth / 2, footerY + 22);
}

// ==================== LAYOUT 2: SQUARE (1000x1000) ====================
async function drawLayout2(ctx, width, height, avatarImage, displayName, username, quoteText, theme, avatarPosition, boldText, fontFamily, colors) {
    const isAvatarTop = avatarPosition !== 'right'; // 'left' -> top, 'right' -> bottom
    const splitY = isAvatarTop ? Math.floor(height * 0.45) : Math.floor(height * 0.55);
    const dividerY = splitY;

    // Background overlays
    if (isAvatarTop) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, width, splitY);
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        for (let i = 0; i < 100; i++) {
            ctx.fillRect(Math.random() * width, Math.random() * splitY, 1, 1);
        }
    } else {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, splitY, width, height - splitY);
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        for (let i = 0; i < 100; i++) {
            ctx.fillRect(Math.random() * width, splitY + Math.random() * (height - splitY), 1, 1);
        }
    }

    // Avatar (300px)
    const avatarSize = 300;
    const avatarX = (width - avatarSize) / 2;
    const avatarY = isAvatarTop ? 50 : splitY + 50;

    if (avatarImage) {
        ctx.save();
        roundRect(ctx, avatarX, avatarY, avatarSize, avatarSize, 20);
        ctx.clip();
        ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
    } else {
        ctx.fillStyle = colors.accent;
        roundRect(ctx, avatarX, avatarY, avatarSize, avatarSize, 20);
        ctx.fill();
    }
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 2;
    roundRect(ctx, avatarX, avatarY, avatarSize, avatarSize, 20);
    ctx.stroke();

    // Display name
    ctx.font = `bold 26px "Poppins", sans-serif`;
    ctx.fillStyle = colors.textPrimary;
    ctx.textAlign = 'center';
    ctx.fillText(displayName, width / 2, avatarY + avatarSize + 40);

    // Username
    ctx.font = '20px "Poppins", sans-serif';
    ctx.fillStyle = colors.textSecondary;
    ctx.fillText('@' + username, width / 2, avatarY + avatarSize + 65);

    // Divider line
    ctx.fillStyle = colors.divider;
    ctx.fillRect(0, dividerY - 2, width, 4);

    // Quote area (smaller: increased margins)
    const boxMargin = 60;
    const boxY = isAvatarTop ? splitY + boxMargin : boxMargin;
    const boxHeight = isAvatarTop ? height - splitY - (boxMargin * 2) : splitY - (boxMargin * 2);
    const boxX = boxMargin;
    const boxWidth = width - (boxMargin * 2);

    ctx.fillStyle = colors.cardBg;
    roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 20);
    ctx.fill();
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1.5;
    roundRect(ctx, boxX, boxY, boxWidth, boxHeight, 20);
    ctx.stroke();

    // Quote text
    const textMargin = 30;
    const maxTextWidth = boxWidth - (textMargin * 2);
    ctx.font = `${boldText ? 'bold' : 'normal'} 26px "${fontFamily}", sans-serif`;
    const lines = wrapText(ctx, quoteText, maxTextWidth, 26);
    const lineHeight = 34;
    const totalTextHeight = lines.length * lineHeight;
    const startY = boxY + (boxHeight - totalTextHeight) / 2 + 26;

    ctx.textAlign = 'center';
    ctx.fillStyle = colors.textPrimary;
    lines.forEach((line, i) => {
        ctx.fillText(line, boxX + boxWidth / 2, startY + i * lineHeight);
    });

    // Quote marks
    ctx.font = 'bold 70px "Georgia", serif';
    ctx.fillStyle = colors.accent;
    ctx.textAlign = 'left';
    ctx.fillText('“', boxX + 15, boxY + 75);
    ctx.textAlign = 'right';
    ctx.fillText('”', boxX + boxWidth - 15, boxY + boxHeight - 20);

    // Footer (two lines)
    const footerY = boxY + boxHeight + 30;
    ctx.font = '15px "Poppins", sans-serif';
    ctx.fillStyle = colors.footer;
    ctx.textAlign = 'center';
    ctx.fillText('✨ Powered by Hermaca', width / 2, footerY);
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    ctx.fillText(dateStr, width / 2, footerY + 20);
}

// ==================== MAIN GENERATOR ====================
async function createQuoteImage(quotedMessage, options) {
    const {
        theme = 'light',
        avatarColor = true,
        avatarPosition = 'left',
        boldText = false,
        layout = 'layout1',
        fontFamily = 'Poppins',
        backgroundUrl = null,
    } = options;

    const width = layout === 'layout1' ? 1200 : 1000;
    const height = layout === 'layout1' ? 630 : 1000;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Author info
    const author = quotedMessage.author;
    const member = quotedMessage.member;
    const displayName = member?.displayName || author.globalName || author.username;
    const username = author.username;
    const avatarUrl = author.displayAvatarURL({ extension: 'png', size: 256 });

    // Download avatar
    let avatarImage = null;
    try {
        const avatarBuffer = await downloadImage(avatarUrl);
        if (avatarBuffer) avatarImage = await loadImage(avatarBuffer);
    } catch {
        console.warn('Failed to load avatar, using placeholder');
    }

    // Convert avatar to grayscale if needed
    if (!avatarColor && avatarImage) {
        const tempCanvas = createCanvas(avatarImage.width, avatarImage.height);
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(avatarImage, 0, 0);
        const imageData = tempCtx.getImageData(0, 0, avatarImage.width, avatarImage.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const avg = 0.2126 * data[i] + 0.7152 * data[i+1] + 0.0722 * data[i+2];
            data[i] = data[i+1] = data[i+2] = avg;
        }
        tempCtx.putImageData(imageData, 0, 0);
        avatarImage = tempCanvas;
    }

    // Quote text
    let quoteText = quotedMessage.cleanContent || quotedMessage.content || '';
    if (!quoteText.trim()) quoteText = ' ';

    // Load background image
    let backgroundImage = null;
    const urlsToTry = [];
    if (backgroundUrl) urlsToTry.push(backgroundUrl);
    urlsToTry.push(DEFAULT_BACKGROUND_URL);

    for (const url of urlsToTry) {
        const buffer = await downloadImage(url);
        if (buffer) {
            try {
                backgroundImage = await loadImage(buffer);
                break;
            } catch {
                continue;
            }
        }
    }

    if (backgroundImage) {
        // Scale to cover
        const imgRatio = backgroundImage.width / backgroundImage.height;
        const canvasRatio = width / height;
        let drawWidth, drawHeight, drawX, drawY;
        if (imgRatio > canvasRatio) {
            drawHeight = height;
            drawWidth = drawHeight * imgRatio;
            drawX = (width - drawWidth) / 2;
            drawY = 0;
        } else {
            drawWidth = width;
            drawHeight = drawWidth / imgRatio;
            drawX = 0;
            drawY = (height - drawHeight) / 2;
        }
        ctx.drawImage(backgroundImage, drawX, drawY, drawWidth, drawHeight);

        if (theme === 'dark') {
            applyGrayscaleFilter(ctx, 0, 0, width, height);
        }

        ctx.fillStyle = theme === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, width, height);
    } else {
        // Fallback gradient
        const colors = themeColors[theme];
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        colors.bgGradient.forEach((c, i) => bgGrad.addColorStop(i / (colors.bgGradient.length - 1), c));
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
    }

    const colors = themeColors[theme];

    if (layout === 'layout1') {
        await drawLayout1(ctx, width, height, avatarImage, displayName, username, quoteText, theme, avatarPosition, boldText, fontFamily, colors);
    } else {
        await drawLayout2(ctx, width, height, avatarImage, displayName, username, quoteText, theme, avatarPosition, boldText, fontFamily, colors);
    }

    return canvas.toBuffer('image/png');
}

module.exports = { createQuoteImage };