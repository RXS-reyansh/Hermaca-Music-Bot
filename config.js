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
    
    colorClient: '#D2EAF1',
    colorDatabase: '#CB674C',
    colorNode: '#1C0770',
    colorLoadingData: '#CFFFE2',
    color247: '#CFFFE2',
    colorOwner: '#FF0000',
    colorBot: '#FF0000',
    colorServerList: '#FF0000',
    colorSlash: '#FF0000',
    colorYay: '#FF0000',
    colorError: '#511D43'
};