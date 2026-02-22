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
	],
    githubProfile: 'https://github.com/RXS-reyansh',
    githubRepo: 'https://github.com/RXS-reyansh/Hermaca-Music-Bot',
    
    colorClient: '#d2eaf1ff',
    colorDatabase: '#cb674cff',
    colorNode: '#4b2bccde',
    colorLoadingData: '#cfffe2ff',
    color247: '#cfffe2ff',
    colorOwner: '#ff0000ff',
    colorBot: '#ff0000ff',
    colorServerList: '#ff7b00ff',
    colorSlash: '#ff7b00ff',
    colorYay: '#ff0000ff',
    colorError: '#9b357fff',
	colorLyrics : "#f03671"
};