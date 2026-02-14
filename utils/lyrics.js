const Genius = require("genius-lyrics");
const Client = new Genius.Client(process.env.GENIUS_TOKEN);
const lyricsFinder = require("lyrics-finder");

async function getLyrics(trackTitle, artist = "") {
  try {
    let cleanTitle = trackTitle
      .replace(/\(Official.*?\)/gi, '')
      .replace(/\[.*?\]/g, '')
      .replace(/lyrics?/gi, '')
      .replace(/official music video/gi, '')
      .replace(/audio/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    let searchQuery = cleanTitle;
    if (artist && artist.trim()) {
      const cleanArtist = artist.replace(/\s*- Topic$/i, '').trim();
      searchQuery = `${cleanArtist} ${cleanTitle}`;
    }
    
    console.log(`🔍 Searching Genius for: "${searchQuery}"`);
    
    const searches = await Client.songs.search(searchQuery);
    
    if (!searches || !searches.length) {
      if (artist) {
        console.log(`⚠️ No results with artist, trying with title only: "${cleanTitle}"`);
        const fallbackSearches = await Client.songs.search(cleanTitle);
        if (!fallbackSearches || !fallbackSearches.length) return null;
        var song = fallbackSearches[0];
      } else {
        return null;
      }
    } else {
      var song = searches[0];
    }
    
    // Get artist from Genius result to verify
    const geniusArtist = song.artist?.name || '';
    console.log(`🎵 Found: "${song.title}" by "${geniusArtist}"`);
    
    let lyrics;

	try {
	  lyrics = await song.lyrics();
	} catch (err) {
	  console.error("Primary Genius lyrics() failed, trying fallback...");

	  lyrics = await lyricsFinder(geniusArtist || artist || "", song.title || cleanTitle);

	  if (!lyrics) {
		console.error("Fallback lyrics-finder also failed.");
		return null;
	  }
	}

	// Ensure lyrics is string
	if (!lyrics || typeof lyrics !== "string") return null;
    
    lyrics = lyrics
      .replace(/\d+\s*Contributors[\s\S]*?Lyrics[\s\S]*?(?=\[|$)/i, '')
      .replace(/You might also like.*$/i, '')
      .replace(/Read More[\s\S]*$/i, '')
      .replace(/Embed[\s\S]*$/i, '')
      .replace(/Share URL[\s\S]*$/i, '')
      .replace(/Copy[\s\S]*$/i, '')
      .replace(/See .*? Live[\s\S]*$/i, '')
      .replace(/\n{4,}/g, '\n\n')
      .trim();

    lyrics = lyrics
      .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');

    lyrics += '\n\n─── ⋆⋅ ♰ ⋅⋆ ─── End of lyrics ─── ⋆⋅ ♰ ⋅⋆ ───';
    
    return {
      lyrics: lyrics,
      description: `Lyrics for "${song.title}" by ${geniusArtist}`
    };
  } } catch (err) {
	  console.error("Lyrics fetch error:", err?.message || err);

	  // If Genius blocks us (Cloudflare 403)
	  if (err?.message?.includes("403") || err?.message?.includes("Forbidden")) {
		console.error("⚠️ Genius is blocking this host (Cloudflare protection).");
	  }

	  return null;
	}
}

module.exports = { getLyrics };