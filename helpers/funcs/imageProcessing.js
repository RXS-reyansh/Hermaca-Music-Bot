async function imageUrlToBase64(url) {
    const response = await fetch(url, {
        timeout: 10000,
        size: 5 * 1024 * 1024
    });
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const mime = response.headers.get('content-type') || 'image/png';
    return `data:${mime};base64,${buffer.toString('base64')}`;
}

module.exports = { imageUrlToBase64 };