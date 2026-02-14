const { createCanvas, loadImage, registerFont } = require('canvas');
const fetch = require('node-fetch');
const path = require('path');
const config = require('../config.js');

// Helper function for rounded rectangle
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

// Function to extract dominant colors from image
function extractDominantColors(imageData, numColors = 5) {
    const data = imageData.data;
    const colors = [];
    const colorMap = {};
    
    // Sample pixels (every 10th pixel for performance)
    for (let i = 0; i < data.length; i += 40) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Group similar colors using simple quantization
        const quantizedR = Math.floor(r / 16) * 16;
        const quantizedG = Math.floor(g / 16) * 16;
        const quantizedB = Math.floor(b / 16) * 16;
        const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
        
        if (colorMap[colorKey]) {
            colorMap[colorKey].count++;
        } else {
            colorMap[colorKey] = {
                r: quantizedR,
                g: quantizedG,
                b: quantizedB,
                count: 1
            };
        }
    }
    
    // Convert to array and sort by frequency
    const colorArray = Object.values(colorMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, numColors);
    
    // Calculate average color from top colors
    let totalR = 0, totalG = 0, totalB = 0;
    colorArray.forEach(color => {
        totalR += color.r;
        totalG += color.g;
        totalB += color.b;
    });
    
    const avgColor = {
        r: Math.floor(totalR / colorArray.length),
        g: Math.floor(totalG / colorArray.length),
        b: Math.floor(totalB / colorArray.length)
    };
    
    return {
        average: avgColor,
        colors: colorArray
    };
}

// Function to generate complementary color
function generateComplementaryColor(r, g, b) {
    // Convert to HSL for better color manipulation
    const [h, s, l] = rgbToHsl(r, g, b);
    
    // Create complementary color (rotate hue by 180 degrees)
    const complementaryHue = (h + 0.5) % 1;
    
    // Adjust saturation and lightness for better contrast
    const newS = Math.min(s * 1.2, 100);
    const newL = l > 50 ? Math.max(l * 0.8, 20) : Math.min(l * 1.2, 80);
    
    return hslToRgb(complementaryHue, newS, newL);
}

// RGB to HSL conversion
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    
    return [h * 360, s * 100, l * 100];
}

// HSL to RGB conversion
function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
    
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

// Function to create vibrant color from base color
function createVibrantColor(r, g, b) {
    const [h, s, l] = rgbToHsl(r, g, b);
    
    // Increase saturation and adjust lightness for vibrancy
    const newS = Math.min(s * 1.3, 100);
    const newL = l > 50 ? 70 : 40; // Make it either light or dark
    
    return hslToRgb(h, newS, newL);
}

// Function to format RGB to CSS string
function rgbToCss(r, g, b) {
    return `rgb(${r}, ${g}, ${b})`;
}

try {
    const fontsPath = path.join(__dirname, '../fonts');
    
    registerFont(path.join(fontsPath, 'Poppins-Regular.ttf'), { 
        family: 'Poppins', 
        weight: '400' 
    });
    
    registerFont(path.join(fontsPath, 'Poppins-Bold.ttf'), { 
        family: 'Poppins', 
        weight: '700' 
    });
    
    registerFont(path.join(fontsPath, 'Poppins-Italic.ttf'), { 
        family: 'Poppins', 
        style: 'italic',
        weight: '400'
    });
    
    console.log('✅ Custom fonts loaded');
} catch (error) {
    console.log('⚠️ Using default fonts (Poppins not found):', error.message);
}

// Spotify token management
let spotifyAccessToken = null;
let tokenExpiry = null;

async function getSpotifyAccessToken() {
    try {
        if (spotifyAccessToken && tokenExpiry && Date.now() < tokenExpiry) {
            return spotifyAccessToken;
        }

        const clientId = config.spotify?.clientId;
        const clientSecret = config.spotify?.clientSecret;
        
        if (!clientId || !clientSecret) {
            console.warn('Spotify credentials not configured');
            return null;
        }

        const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        if (!response.ok) {
            throw new Error(`Failed to get Spotify token: ${response.status}`);
        }

        const data = await response.json();
        spotifyAccessToken = data.access_token;
        tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
        
        console.log('✅ Spotify access token obtained');
        return spotifyAccessToken;
    } catch (error) {
        console.error('Error getting Spotify token:', error);
        return null;
    }
}

async function searchSpotifyTrack(trackTitle, artist) {
    try {
        const token = await getSpotifyAccessToken();
        if (!token) {
            return null;
        }

        let cleanTitle = trackTitle;
        if (cleanTitle.includes('(')) cleanTitle = cleanTitle.split('(')[0].trim();
        if (cleanTitle.includes('[')) cleanTitle = cleanTitle.split('[')[0].trim();
        if (cleanTitle.includes('-')) cleanTitle = cleanTitle.split('-')[0].trim();

        const query = encodeURIComponent(`${cleanTitle} ${artist}`);
        const searchUrl = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`;
        
        const response = await fetch(searchUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                spotifyAccessToken = null;
                tokenExpiry = null;
                return await searchSpotifyTrack(trackTitle, artist);
            }
            throw new Error(`Spotify API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.tracks && data.tracks.items && data.tracks.items.length > 0) {
            const track = data.tracks.items[0];
            
            if (track.album && track.album.images && track.album.images.length > 0) {
                const images = track.album.images.sort((a, b) => b.width - a.width);
                return images[0].url;
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error searching Spotify:', error.message);
        return null;
    }
}

async function getYouTubeThumbnail(track) {
    try {
        if (track.info.uri && (track.info.uri.includes('youtube.com') || track.info.uri.includes('youtu.be'))) {
            const videoIdMatch = track.info.uri.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[&?]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            if (videoIdMatch && videoIdMatch[1]) {
                const maxresUrl = `https://img.youtube.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`;
                const maxresResponse = await fetch(maxresUrl, { method: 'HEAD' });
                if (maxresResponse.ok) return maxresUrl;
                return `https://img.youtube.com/vi/${videoIdMatch[1]}/hqdefault.jpg`;
            }
        }
        return null;
    } catch (error) {
        console.error('Error getting YouTube thumbnail:', error);
        return null;
    }
}

async function downloadImage(url) {
    try {
        if (!url || typeof url !== 'string') {
            throw new Error('Invalid URL');
        }
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            console.warn(`URL is not absolute: ${url}`);
            return null;
        }
        
        const response = await fetch(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
        }
        
        return await response.buffer();
    } catch (error) {
        console.error('Error downloading image:', error.message);
        return null;
    }
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
        data[i] = avg;     // Red
        data[i + 1] = avg; // Green
        data[i + 2] = avg; // Blue
    }
    
    ctx.putImageData(imageData, x, y);
}

async function createSongQuoteImage(track, text) {
    try {
        console.log(`Generating aesthetic sidebar quote for: ${track.info.title} - ${track.info.author}`);
        
        // Get thumbnail
        let thumbnailUrl = null;
        
        if (track.info.thumbnail && typeof track.info.thumbnail === 'string' && track.info.thumbnail.startsWith('http')) {
            thumbnailUrl = track.info.thumbnail;
        } else if (track.info.artwork && typeof track.info.artwork === 'string' && track.info.artwork.startsWith('http')) {
            thumbnailUrl = track.info.artwork;
        } else if (track.info.image && typeof track.info.image === 'string' && track.info.image.startsWith('http')) {
            thumbnailUrl = track.info.image;
        }
        
        if (!thumbnailUrl) {
            thumbnailUrl = await getYouTubeThumbnail(track);
        }
        
        if (!thumbnailUrl && track.info.title && track.info.author) {
            thumbnailUrl = await searchSpotifyTrack(track.info.title, track.info.author);
        }
        
        if (!thumbnailUrl) {
            const titleHash = track.info.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const hue = titleHash % 360;
            thumbnailUrl = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800"><rect width="800" height="800" fill="hsl(${hue}, 70%, 30%)"/><text x="400" y="400" font-family="Arial" font-size="60" fill="white" text-anchor="middle" dy=".3em">${encodeURIComponent(track.info.title.substring(0, 20))}</text></svg>`;
        }
        
        let imageBuffer;
        if (thumbnailUrl.startsWith('data:')) {
            imageBuffer = Buffer.from(thumbnailUrl.split(',')[1], 'base64');
        } else {
            imageBuffer = await downloadImage(thumbnailUrl);
            if (!imageBuffer) {
                thumbnailUrl = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=630&fit=crop';
                imageBuffer = await downloadImage(thumbnailUrl);
            }
        }
        
        if (!imageBuffer) {
            throw new Error('Failed to get image data');
        }
        
        // Load album art for analysis
        const albumArt = await loadImage(imageBuffer);
        
        // === COLOR EXTRACTION ===
        // Create a small canvas for color analysis
        const colorCanvas = createCanvas(100, 100);
        const colorCtx = colorCanvas.getContext('2d');
        
        // Draw album art to color canvas
        colorCtx.drawImage(albumArt, 0, 0, 100, 100);
        
        // Extract dominant colors
        const imageData = colorCtx.getImageData(0, 0, 100, 100);
        const dominantColors = extractDominantColors(imageData, 3);
        
        // Get the most vibrant color from the palette
        const vibrantColor = createVibrantColor(
            dominantColors.average.r,
            dominantColors.average.g,
            dominantColors.average.b
        );
        
        // Generate complementary color for gradient
        const complementaryColor = generateComplementaryColor(
            dominantColors.average.r,
            dominantColors.average.g,
            dominantColors.average.b
        );
        
        // Create gradient colors
        const color1 = rgbToCss(vibrantColor.r, vibrantColor.g, vibrantColor.b);
        const color2 = rgbToCss(complementaryColor.r, complementaryColor.g, complementaryColor.b);
        
        console.log(`🎨 Extracted colors: ${color1} -> ${color2}`);
        
        // Create main canvas
        const width = 1200;
        const height = 630;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        
        // Calculate 2:3 split
        const leftWidth = Math.floor(width * 2 / 5); // 2 parts
        const rightWidth = width - leftWidth; // 3 parts
        const dividerX = leftWidth;
        
        // === BACKGROUND: BLACK & WHITE SONG COVER ===
        // Load album art for background (separate instance)
        const backgroundArt = await loadImage(imageBuffer);
        
        // Draw background (full canvas, scaled to cover)
        const imgRatio = backgroundArt.width / backgroundArt.height;
        const canvasRatio = width / height;
        
        let bgWidth, bgHeight, bgX, bgY;
        
        if (imgRatio > canvasRatio) {
            bgHeight = height;
            bgWidth = bgHeight * imgRatio;
            bgX = (width - bgWidth) / 2;
            bgY = 0;
        } else {
            bgWidth = width;
            bgHeight = bgWidth / imgRatio;
            bgX = 0;
            bgY = (height - bgHeight) / 2;
        }
        
        ctx.drawImage(backgroundArt, bgX, bgY, bgWidth, bgHeight);
        applyGrayscaleFilter(ctx, 0, 0, width, height);
        
        // Darken the entire background for better readability
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, width, height);
        
        // === LEFT SIDE OVERLAY ===
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, leftWidth, height);
        
        // Add subtle noise texture to left side
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        for (let i = 0; i < 150; i++) {
            const x = Math.random() * leftWidth;
            const y = Math.random() * height;
            ctx.fillRect(x, y, 1, 1);
        }
        
        // Draw album art (square, centered horizontally) - IN COLOR
        const albumSize = 280;
        const albumX = (leftWidth - albumSize) / 2;
        const albumY = 120;
        
        ctx.save();
        roundRect(ctx, albumX, albumY, albumSize, albumSize, 20);
        ctx.clip();
        ctx.drawImage(albumArt, albumX, albumY, albumSize, albumSize);
        ctx.restore();
        
        // Add border to album art (using extracted vibrant color)
        ctx.strokeStyle = color1;
        ctx.lineWidth = 2;
        roundRect(ctx, albumX, albumY, albumSize, albumSize, 20);
        ctx.stroke();
        
        // Add subtle shadow/glow effect (with extracted color)
        ctx.shadowColor = color1;
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 3;
        roundRect(ctx, albumX - 5, albumY - 5, albumSize + 10, albumSize + 10, 25);
        ctx.stroke();
        ctx.shadowBlur = 0;
        
        // === SONG TITLE WITH DYNAMIC GRADIENT ===
        const titleY = albumY + albumSize + 50;
        const titleGradient = ctx.createLinearGradient(
            leftWidth / 2 - 150, titleY,
            leftWidth / 2 + 150, titleY
        );
        titleGradient.addColorStop(0, color1);
        titleGradient.addColorStop(0.5, color2);
        titleGradient.addColorStop(1, color1);
        
        ctx.font = 'bold 36px "Poppins", "Arial", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = titleGradient;
        
        const songTitle = track.info.title.length > 30 
            ? track.info.title.substring(0, 27) + '...' 
            : track.info.title;
        ctx.fillText(songTitle, leftWidth / 2, titleY);
        
        // Artist name (using a lighter version of the vibrant color)
        ctx.font = '24px "Poppins", "Arial", sans-serif';
        ctx.fillStyle = color1;
        const artist = track.info.author || 'Unknown Artist';
        ctx.fillText(`by ${artist}`, leftWidth / 2, titleY + 40);
        
        // === RIGHT SIDE OVERLAY ===
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(dividerX, 0, rightWidth, height);
        
        const rightGradient = ctx.createLinearGradient(dividerX, 0, width, 0);
        rightGradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
        rightGradient.addColorStop(1, 'rgba(20, 20, 20, 0.7)');
        ctx.fillStyle = rightGradient;
        ctx.fillRect(dividerX, 0, rightWidth, height);
        
        // === DIVIDER LINE WITH DYNAMIC GRADIENT ===
        const lineGradient = ctx.createLinearGradient(dividerX, 0, dividerX, height);
        lineGradient.addColorStop(0, color1);
        lineGradient.addColorStop(0.5, color2);
        lineGradient.addColorStop(1, color1);
        
        ctx.fillStyle = lineGradient;
        ctx.fillRect(dividerX - 2, 0, 4, height);
        
        // Add glow effect to divider line
        ctx.shadowColor = color1;
        ctx.shadowBlur = 15;
        ctx.fillRect(dividerX - 2, 0, 4, height);
        ctx.shadowBlur = 0;
        
        // === QUOTE BOX DIMENSIONS ===
		const quoteBoxMargin = 60;
		const quoteBoxX = dividerX + quoteBoxMargin;
		const quoteBoxY = quoteBoxMargin;
		const quoteBoxWidth = rightWidth - (quoteBoxMargin * 2);
		const quoteBoxHeight = 400;

		// === QUOTE TEXT – NOW SUPPORTS NEWLINES ===
		const textMargin = 40;
		const maxTextWidth = quoteBoxWidth - (textMargin * 2);
		const maxTextHeight = quoteBoxHeight - (textMargin * 2);

		// 1. Split the input into paragraphs by newline
		const paragraphs = text.split('\n');

		let fontSize = 42;
		let allLines = [];
		let textFits = false;

		while (fontSize >= 28 && !textFits) {
			ctx.font = `italic ${fontSize}px "Poppins", "Arial", sans-serif`;
			const lineHeight = fontSize * 1.4;
			allLines = [];
			let totalHeight = 0;

			for (const para of paragraphs) {
				// word‑wrap the paragraph
				const words = para.split(' ');
				let currentLine = '';
				const paraLines = [];

				for (const word of words) {
					const testLine = currentLine ? currentLine + ' ' + word : word;
					const testWidth = ctx.measureText(testLine).width;
					if (testWidth > maxTextWidth) {
						if (currentLine) paraLines.push(currentLine);
						currentLine = word;
					} else {
						currentLine = testLine;
					}
				}
				if (currentLine) paraLines.push(currentLine);

				// add the paragraph lines to the global list
				allLines.push(...paraLines);
				// add a small gap between paragraphs (but not after the last one)
				if (para !== paragraphs[paragraphs.length - 1]) {
					allLines.push(''); // empty line = visual paragraph break
				}
			}

			totalHeight = allLines.length * lineHeight;
			if (totalHeight <= maxTextHeight) {
				textFits = true;
			} else {
				fontSize -= 2;
			}
		}

		// If still doesn't fit, shrink font and truncate
		if (!textFits) {
			fontSize = 32;
			ctx.font = `italic ${fontSize}px "Poppins", "Arial", sans-serif`;
			const lineHeight = fontSize * 1.4;

			// rebuild lines with smaller font
			allLines = [];
			for (const para of paragraphs) {
				const words = para.split(' ');
				let currentLine = '';
				for (const word of words) {
					const testLine = currentLine ? currentLine + ' ' + word : word;
					const testWidth = ctx.measureText(testLine).width;
					if (testWidth > maxTextWidth) {
						if (currentLine) allLines.push(currentLine);
						currentLine = word;
					} else {
						currentLine = testLine;
					}
				}
				if (currentLine) allLines.push(currentLine);
				if (para !== paragraphs[paragraphs.length - 1]) {
					allLines.push('');
				}
			}

			const maxLines = Math.floor(maxTextHeight / lineHeight);
			if (allLines.length > maxLines) {
				allLines = allLines.slice(0, maxLines);
				// add ellipsis to last line if needed
				if (allLines.length > 0 && allLines[allLines.length - 1] !== '') {
					const last = allLines[allLines.length - 1];
					if (last.length > 3) {
						allLines[allLines.length - 1] = last.substring(0, last.length - 3) + '...';
					}
				}
			}
		}

		// Draw the lines
		ctx.textAlign = 'center';
		const lineHeight = fontSize * 1.4;
		const startX = quoteBoxX + (quoteBoxWidth / 2);
		// calculate vertical start position (centered)
		const totalTextHeight = allLines.length * lineHeight;
		const startY = quoteBoxY + textMargin + fontSize + ((maxTextHeight - totalTextHeight) / 2);

		allLines.forEach((line, index) => {
			if (line === '') {
				// empty line = skip drawing, but still advance vertical position
				// (no need to draw anything)
				return;
			}

			ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
			ctx.shadowBlur = 4;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 2;

			const textGradient = ctx.createLinearGradient(
				startX - 100, startY + (index * lineHeight),
				startX + 100, startY + (index * lineHeight)
			);
			textGradient.addColorStop(0, '#ffffff');
			textGradient.addColorStop(1, '#f0f0f0');

			ctx.fillStyle = textGradient;
			ctx.fillText(line, startX, startY + (index * lineHeight));

			ctx.shadowBlur = 0;
			ctx.shadowOffsetY = 0;
		});
        
        // Add quote marks (using extracted color)
        ctx.font = 'bold 60px "Georgia", serif';
        ctx.fillStyle = color1;
        ctx.textAlign = 'left';
        ctx.fillText('"', quoteBoxX + 15, quoteBoxY + 70);
        
        ctx.textAlign = 'right';
        ctx.fillText('"', quoteBoxX + quoteBoxWidth - 15, quoteBoxY + quoteBoxHeight - 15);
        
        // === FOOTER ===
        const footerY = quoteBoxY + quoteBoxHeight + 40;
        const footerCenterX = quoteBoxX + (quoteBoxWidth / 2);
        
        ctx.font = '18px "Poppins", "Arial", sans-serif';
        ctx.fillStyle = color1;
        ctx.textAlign = 'center';
        ctx.fillText('Powered by Hermaca Music Bot', footerCenterX, footerY);
        
        // Add current date
        ctx.font = '16px "Poppins", "Arial", sans-serif';
        ctx.fillStyle = color2;
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        ctx.fillText(dateStr, footerCenterX, footerY + 25);
        
        console.log('✅ Aesthetic sidebar quote image generated with dynamic colors');
        return canvas.toBuffer('image/png');
        
    } catch (error) {
        console.error('Error creating aesthetic sidebar quote image:', error);
        throw error;
    }
}

module.exports = { createSongQuoteImage };