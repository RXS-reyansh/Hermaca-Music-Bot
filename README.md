# Discord Music Bot

A feature-rich Discord music bot built with Discord.js, Riffy, and Lavalink. This bot provides high-quality music playback with support for YouTube, Spotify, and more.

## Features

- 🎵 **High-quality music playback** – Crystal clear audio from YouTube and Spotify
- 🎮 **Slash Commands** – Full support for slash commands for easy access
- 📋 **Queue management** – Move, insert, remove, and reorder tracks
- 🔁 **Loop & shuffle** – Toggle queue looping and shuffle your playlist
- 🔊 **Volume control** – Per-player volume and server-wide persistent volume
- 🎛️ **Audio filters** – Add effects like bassboost, slow, etc.
- 📜 **Lyrics display** – Fetch and show lyrics for current track
- 📊 **Statistics** – Personal listening stats and global leaderboard
- 🎨 **Song quotes** – Create aesthetic quote images with current track
- 🕒 **24/7 mode** – Keep bot in voice channel around the clock
- 🖼️ **Beautiful embeds** – Clean and stylish embed messages

## Commands

| Command | Description |
|---------|-------------|
| `/play <query>` | Play a song or playlist |
| `/pause` | Pause the current track |
| `/resume` | Resume the current track |
| `/skip` | Skip the current track |
| `/stop` | Stop playback and clear queue |
| `/lyrics` | Show the lyrics of the current track |
| `/queue` | Show the current queue |
| `/nowplaying` | Show current track info |
| `/volume <0-100>` | Adjust player volume |
| `/servervolume <0-100>` | Set permanent volume for this server |
| `/filter <type>` | Add different filters to playback |
| `/shuffle` | Shuffle the current queue |
| `/loop` | Toggle queue loop mode |
| `/move <from> <to>` | Move a song in the queue |
| `/add <song> <position>` | Add a track at specific position |
| `/remove <position>` | Remove a track from queue |
| `/clear` | Clear the current queue |
| `/status` | Show player status |
| `/ping` | Show the bot's ping |
| `/mystats` | View your personal music statistics |
| `/leaderboard` | Global ranking of top listeners |
| `/resetmystats` | Reset your personal statistics |
| `/setspotify <username>` | Set your Spotify username |
| `/playspotify` | Play your saved Spotify playlists |
| `/24-7-enable` | Enable 24/7 mode in a voice channel |
| `/24-7-disable` | Disable 24/7 mode |
| `/song-quote <text>` | Create a quote image with current track |
| `/help` | Show this help message |

> **Note:** All commands work as slash commands! Traditional prefix commands (`~`) are also available.

## .env file format

```
DISCORD_TOKEN= 		// Token of BOT
DISCORD_CLIENT_ID= 		// Client ID of BOT
SPOTIFY_CLIENT_SECRET= 	// For Spotify Playback
SPOTIFY_CLIENT_ID= 		// For Spotify Playback
GENIUS_TOKEN= 			// For Lyrics
MONGO_URI=				// MongoDB
BOT_IDENTIFIER=			// For MongoDB Collection
```

## Screenshots

### Now Playing
![Now Playing](https://i.imgur.com/PMmebc2.png)

### Queue List
![Queue List](https://i.imgur.com/n7uBEvU.png)

### Player Status
![Player Status](https://i.imgur.com/0JhhPo3.png)

## Support

- 📌 [GitHub Issues](https://github.com/RXS-reyansh/Hermaca-Music-Bot/issues)
- 💬 [Discord Support Server](https://discord.gg/nVfAGH9G67)

## Contributing

Contributions are welcome! Feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

- [Discord.js](https://discord.js.org/)
- [Riffy](https://github.com/riffy-team/riffy)
- [Lavalink Nodes](https://github.com/botxlab/lavalink-list/tree/main)
- [Spotify API](https://developer.spotify.com/)

---

⭐ Star this repository if you find it useful!