const axios = require('axios');
const config = require('../config.js');

let accessToken = null;
let tokenExpires = 0;

async function getSpotifyAccessToken() {
    if (accessToken && Date.now() < tokenExpires) {
        return accessToken;
    }
    
    try {
        const response = await axios({
            method: 'post',
            url: 'https://accounts.spotify.com/api/token',
            params: {
                grant_type: 'client_credentials'
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(config.spotify.clientId + ':' + config.spotify.clientSecret).toString('base64')
            }
        });
        
        accessToken = response.data.access_token;
        tokenExpires = Date.now() + (response.data.expires_in * 1000) - 60000; // 1 minute buffer
        console.log('✅ Spotify access token refreshed');
        return accessToken;
    } catch (error) {
        console.error('❌ Failed to get Spotify access token:', error.response?.data || error.message);
        return null;
    }
}

async function SpotifyUserPlaylists(username) {
    try {
        const token = await getSpotifyAccessToken();
        if (!token) return [];
        
        let playlists = [];
        let url = `https://api.spotify.com/v1/users/${username}/playlists?limit=50`;
        
        while (url) {
            const response = await axios({
                method: 'get',
                url: url,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            playlists = playlists.concat(response.data.items.map(item => ({
                id: item.id,
                name: item.name,
                tracksCount: item.tracks.total,
                image: item.images?.[0]?.url || null
            })));
            
            url = response.data.next;
        }
        
        return playlists;
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error("User not found. Check your Spotify username.");
        } else if (error.response?.status === 403) {
            throw new Error("Cannot access this user's playlists. They might be private.");
        }
        console.error("❌ Error fetching Spotify user playlists:", error.response?.data || error.message);
        return [];
    }
}

async function getPlaylistDetails(playlistId) {
    try {
        const token = await getSpotifyAccessToken();
        if (!token) return null;
        
        const response = await axios({
            method: 'get',
            url: `https://api.spotify.com/v1/playlists/${playlistId}`,
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Try to get creation date from earliest track
        let creationDate = null;
        if (response.data.tracks?.items?.length > 0) {
            let oldestDate = null;
            for (const item of response.data.tracks.items) {
                if (item.added_at) {
                    const date = new Date(item.added_at);
                    if (!oldestDate || date < oldestDate) oldestDate = date;
                }
            }
            if (oldestDate) creationDate = oldestDate.toISOString();
        }
        
        return {
            id: response.data.id,
            name: response.data.name,
            image: response.data.images?.[0]?.url || null,
            tracksCount: response.data.tracks.total,
            created_at: creationDate
        };
    } catch (error) {
        console.error("❌ Error fetching playlist details:", error.response?.data || error.message);
        return null;
    }
}

async function getAllPlaylistTracks(playlistId) {
    try {
        const token = await getSpotifyAccessToken();
        if (!token) return [];
        
        let tracks = [];
        let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;
        
        while (url) {
            const response = await axios({
                method: 'get',
                url: url,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            for (const item of response.data.items) {
                if (item.track) {
                    tracks.push({
                        uri: item.track.uri,
                        title: item.track.name,
                        artist: item.track.artists.map(a => a.name).join(', '),
                        thumbnail: item.track.album?.images?.[0]?.url || null,
                        duration: item.track.duration_ms,
                        id: item.track.id
                    });
                }
            }
            
            url = response.data.next;
        }
        
        console.log(`✅ Fetched ${tracks.length} tracks from Spotify playlist ${playlistId}`);
        return tracks;
    } catch (error) {
        console.error('❌ Error fetching Spotify playlist tracks:', error.response?.data || error.message);
        return [];
    }
}

module.exports = {
    SpotifyUserPlaylists,
    getPlaylistDetails,
    getAllPlaylistTracks
};