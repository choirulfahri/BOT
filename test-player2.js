require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
const { YoutubeiExtractor } = require('discord-player-youtubei');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function run() {
  const player = new Player(client);
  await player.extractors.register(YoutubeiExtractor, {});
  await player.extractors.loadMulti(DefaultExtractors);
  if (false) {
    const ext = player.extractors.get('SpotifyExtractor');
    ext.setCredentials({ clientID: false, clientSecret: process.env.SPOTIFY_CLIENT_SECRET });
  }

  const query = "https://open.spotify.com/track/6M14Bi5TquWeHjiRnt4X4B";
  const result = await player.search(query, { fallbackSearchEngine: 'youtubeExt' });
  console.log("Search result for", query);
  console.log("Has tracks?", result.hasTracks());
  if (result.hasTracks()) {
    console.log("First track:", result.tracks[0].title);
    console.log("Extractor:", result.tracks[0].extractor?.identifier);
  }
  process.exit(0);
}
run();
