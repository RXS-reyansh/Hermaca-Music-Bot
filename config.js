module.exports = {
    botToken: process.env.DISCORD_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    prefix: "$!",
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
    // Github Links
    githubProfile: 'https://github.com/RXS-reyansh',
    githubRepo: 'https://github.com/RXS-reyansh/Hermaca-Music-Bot',
    
    colorClient: '#d2eaf1',
    colorDatabase: '#cb674c',
    colorNode: '#4b2bcc',
    colorLoadingData: '#cfffe2',
    color247: '#cfffe2',
    colorOwner: '#ff0000',
    colorBot: '#ff0000',
    colorServerList: '#ff7b00',
    colorSlash: '#ff7b00',
    colorYay: '#ff0000',
    colorError: '#9b357f',
    colorLyrics: "#f03671",

    // different presence for each bot :)
    botInstances: {
        Main: {
            clientId: '923476129623453777',
            presence: {
                name: '/help | 45 Guilds | 6.7k Users',
                type: 'Listening',
                status: 'idle'
            }
        },
        TheSecond: {
            clientId: '1471514482067902545',
            presence: {
                name: '$!help | {guilds} Servers',
                type: 'Listening',
                status: 'idle'
            }
        },
        TheThird: {
            clientId: '1457601829738250301',
            presence: {
                name: 'music in 11 servers',
                type: 'Streaming',
                status: 'dnd'
            }
        },
        Beta: {
            clientId: '1442787596131373166',
            presence: {
                name: 'BETA Version of Hermaca',
                type: 'Playing',
                status: 'dnd'
            }
        }
    },

    defaultPresence: {
        name: '/help | {guilds} Guilds',
        type: 'Listening',
        status: 'idle'
    }
};