module.exports = {
    botToken: process.env.DISCORD_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    prefix: "~",
    ownerId: '922491166149214218',
    embedColor: "#b4f8c8",
    fakeLowerCpuUsage: 3.0,  // Minimum fallback CPU% if real value unavailable
    fakeUpperCpuUsage: 5.0,  // Maximum fallback CPU% if real value unavailable
    minTotalRamMB: 10240,    // Minimum total RAM in MB (10GB) for display
    spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    },
    nodes: [    
        {
            host: "lavalinkv4.serenetia.com",
            version: "4.0.0",
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
    colorError: '#c147a1',
    colorLyrics: "#f03671",
    colorLoader: '#249bf0',
    colorStatus: '#249bf0',
    colorYay: '#249bf0',

    // different presence for each bot :)
    botInstances: {
        Main: {
            clientId: '923476129623453777',
            displayServerCount: 45,
            displayUserCount: 6700,
            buildName: "Hermaca",
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
            buildName: "BETA version of Hermaca",
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