# Discord Music Bot

A feature-rich Discord music bot built with Discord.js, Riffy, and Lavalink. This bot provides high-quality music playback with support for YouTube, Spotify, and more.

## Features

- 🎵 **High-quality music playback** – Crystal clear audio from YouTube and Spotify
- 🎮 **Slash Commands & Prefix Commands** – Full support for both slash commands and traditional prefix commands
- 📋 **Advanced queue management** – Move, insert, remove, reorder, shuffle, and skip to specific positions
- 🔁 **Loop & shuffle** – Toggle queue looping and randomize your playlist
- 🔊 **Dynamic volume control** – Per-player volume and server-wide persistent volume settings
- 🎛️ **20+ audio filters** – Nightcore, vaporwave, deepbass, 8D, bass boost, distortion, karaoke, lofi, and more
- 📜 **Lyrics display** – Fetch and display lyrics for current track in real-time
- 📊 **Statistics system** – Track personal listening stats across all servers with global leaderboard
- 🎨 **Quote generation** – Create aesthetic quote images with current track information
- 🎤 **Voice channel controls** – Mute, deafen, disconnect, and manage users in voice channels
- 🕒 **24/7 mode** – Keep bot in voice channel around the clock with persistent playback
- 👤 **Server customization** – Customize bot's nickname, avatar, banner, and bio per server
- ☁️ **Spotify integration** – Play your saved Spotify playlists and set Spotify username
- 🔧 **Developer tools** – User blacklisting, prefixless mode, admin role management
- 🖼️ **Beautiful embeds** – Clean and stylish embed messages with helpful information

## Commands

### 🎵 Music Commands
| Command | Description |
|---------|-------------|
| `/play <query>` | Play a song or playlist from YouTube/Spotify |
| `/pause` | Pause the current track |
| `/resume` | Resume the current track |
| `/skip` | Skip the current track |
| `/skipto <position>` | Skip to a specific track in the queue |
| `/stop` | Stop playback and clear the queue |
| `/queue` / `/q` | Show the current queue |
| `/nowplaying` | Show current track information |
| `/volume <0-100>` | Adjust player volume |
| `/servervolume <0-100>` | Set permanent volume for this server |
| `/filter <type>` | Add audio filters (nightcore, vaporwave, bass, 8D, etc.) |
| `/shuffle` | Shuffle the current queue |
| `/loop` | Toggle queue loop mode |
| `/move <from> <to>` | Move a song to a different position in queue |
| `/add <song> <position>` | Add a track at specific position |
| `/remove <position>` | Remove a track from queue |
| `/clear` | Clear the entire queue |
| `/lyrics` | Show the lyrics of the current track |
| `/song-quote <text>` | Create an aesthetic quote image with current track |
| `/status` | Show current player status and statistics |

### ☁️ Spotify Commands
| Command | Description |
|---------|-------------|
| `/playspotify` | Play your saved Spotify playlists |
| `/setspotify <username>` | Set your Spotify username for playlist access |

### 🎤 Voice Channel Controls
| Command | Description |
|---------|-------------|
| `/join [channel]` | Make the bot join a voice channel |
| `/leave` | Make the bot leave the voice channel |
| `/disconnect [user]` | Disconnect a user from voice channel (or yourself) |
| `/mute <user>` | Mute a user in voice channel |
| `/unmute <user>` | Unmute a user in voice channel |
| `/deafen <user>` | Deafen a user in voice channel |
| `/undeafen <user>` | Undeafen a user in voice channel |
| `/rejoin` | Make the bot leave and rejoin the current voice channel |
| `/shift <user> <channel>` | Move a user to another voice channel |

### 📊 Statistics Commands
| Command | Description |
|---------|-------------|
| `/mystats` | View your personal music statistics across all servers |
| `/stats [user]` | View your or another user's music statistics |
| `/leaderboard` | View global ranking of top listeners |
| `/resetmystats` | Reset your personal statistics (irreversible!) |

### 🎨 Customization Commands
| Command | Description |
|---------|-------------|
| `/setprefix <prefix>` | Change the bot's command prefix for this server |
| `/setname <name>` | Change the bot's server nickname |
| `/setavatar <url>` | Change the bot's server avatar |
| `/setbanner <url>` | Change the bot's server banner |
| `/setbio <text>` | Set the bot's server profile bio (About Me) |
| `/resetprofile` | Reset the bot's server profile to global defaults |

### 🕒 24/7 Mode Commands
| Command | Description |
|---------|-------------|
| `/24-7` | Enable or disable 24/7 mode |
| `/24-7-enable` | Enable 24/7 mode in current voice channel |
| `/24-7-disable` | Disable 24/7 mode |

### ℹ️ Info & Utility Commands
| Command | Description |
|---------|-------------|
| `/help [command]` | Show all commands or get help for a specific command |
| `/ping` | Show the bot's ping and latency |
| `/debug` | Show bot status, uptime, and system information |
| `/afk <reason> [image]` | Set your AFK status with optional reason and image |
| `/avatar [user]` | View a user's avatar |
| `/banner [user]` | View a user's server banner |
| `/emoji <emoji...>` | Send emoji(s) as text |
| `/membercount` | Show the number of members, users, and bots in the server |
| `/count` | Manage the counting game |
| `/quote [message]` | Generate a quote image from a message |
| `/react <emoji>` | React to a message with an emoji (reply to a message) |
| `/reveal` | Reveal spoiler text in a message (reply to a message) |
| `/say <text>` | Make the bot say something |
| `/purge <amount>` | Delete messages in bulk |

> **Note:** All commands work as BOTH slash and traditional prefix commands (default prefix: `~`)

## Screenshots of a user using the Bot

### Now Playing
![Now Playing](https://github.com/RXS-reyansh/Hermaca-Music-Bot/blob/main/images/now_playing.png?raw=true)

### Help
![Help](https://github.com/RXS-reyansh/Hermaca-Music-Bot/blob/main/images/help.png?raw=true)

### Queue List
![Queue List](https://github.com/RXS-reyansh/Hermaca-Music-Bot/blob/main/images/queue.png?raw=true)

### Player Status
![Player Status](https://github.com/RXS-reyansh/Hermaca-Music-Bot/blob/main/images/status.png?raw=true)

### Song Quote
![Song Quote](https://github.com/RXS-reyansh/Hermaca-Music-Bot/blob/main/images/song-quote1.png?raw=true)
![Generated Song Quote Image](https://github.com/RXS-reyansh/Hermaca-Music-Bot/blob/main/images/song-quote2.png?raw=true)

### Statistics of a user
![Statistics](https://github.com/RXS-reyansh/Hermaca-Music-Bot/blob/main/images/stats.png?raw=true)

### Lyrics display
![Lyrics]()

### Audio filters

#### Nightcore
![Nightcore Fitler]()

#### Darthvader
![Darthvader Filter]()

#### Slowreverb
![16d filter]()

#### Clearing the filters
![Clear all fitlers]()

### Spotify Playlist integration**
![Spotify]

### Customizing the Bot's Server Profile

#### Custom avatar
![SetAvatar]()

#### Custom banner
![SetBanner]()

#### Custom bio and change display name
![SetBio and SetName]()

#### Final result
![Initial to Final Profile]()

### Awesome AFK
![AFK]()

### Voice Channel Status

#### When playing a song
![Current song voice status]()

#### When nothing is playing AND 24/7 is NOT enabled
![Idle voice status]()

#### When nothing is playing BUT 24/7 is enabled
![24/7 voice status]()

###### Thanks to aanya.45 for using the commands of the bot and providing these beautiful screenshots!

<hr>

## .env File Format

Create a `.env` file in the root directory with the following variables:

```env
# Discord Bot Configuration
DISCORD_TOKEN=<Bot's_Token>
DISCORD_CLIENT_ID=<Bot's_Client_ID>

# Spotify API (for playlist playback)
SPOTIFY_CLIENT_ID=<Spotify_Client_ID>
SPOTIFY_CLIENT_SECRET=<Spotify_Client_Secret>

# Genius API (for lyrics fetching)
GENIUS_TOKEN=<Genius_token>:<Identifier>|<Genius_token2>:<Identifier>

# MongoDB Database
MONGO_URI=<MongoDB_Connection_String>
BOT_IDENTIFIER=<Unique_Identifier_For_Collections>
```

**Where to get these tokens:**
- **Discord Token**: [Discord Developer Portal](https://discord.com/developers/applications)
- **Spotify Credentials**: [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- **Genius Token**: [Genius API](https://genius.com/api-clients)
- **MongoDB**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

## Prerequisites
- Node.js v16.9.0 or higher
- npm or yarn
- [MongoDB](https://mongodb.com) database
- Discord Bot token from [Discord Developer Portal](https://discord.com/developers/applications)

## Support

- 📌 [GitHub Issues](https://github.com/RXS-reyansh/Hermaca-Music-Bot/issues)
- 💬 [Discord Support Server](https://discord.gg/nVfAGH9G67)
- ✨ Author's Discord Username – \__reyansh__

## Contributing

Contributions are welcome! Feel free to submit a Pull Request.

## Privacy Policy and Terms of Services

- 📋 [Privacy Policy](https://rxs-reyansh.github.io/Hermaca-Music-Bot/privacy.html)
- 📋 [Terms of Services](https://rxs-reyansh.github.io/Hermaca-Music-Bot/terms.html)
  
## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

- [Discord.js](https://discord.js.org/)
- [Riffy](https://github.com/riffy-team/riffy)
- [Lavalink Nodes](https://github.com/botxlab/lavalink-list/tree/main)
- [Spotify API](https://developer.spotify.com/)

---

⭐ Star this repository if you find it useful!
<p align="center">
  <div style="display: inline-block; border-radius: 20px; overflow: hidden; border: 3px solid #5865F2;">
    <img src="https://github.com/RXS-reyansh/Hermaca-Music-Bot/blob/main/images/cover.gif?raw=true" 
         alt="Bot Demo GIF" 
         width="400" />
  </div>
</p>
