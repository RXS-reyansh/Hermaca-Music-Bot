module.exports = {
    botToken: process.env.DISCORD_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    prefix: "~",
	ownerId: '922491166149214218',
    embedColor: "#b4f8c8",
    spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    },
    nodes: [    
        {
            host: "lavalinkv4.serenetia.com",
            port: 80,
            secure: false,
            password: "https://dsc.gg/ajidevserver",
            name: "Serenetia"
        }
	]
};
