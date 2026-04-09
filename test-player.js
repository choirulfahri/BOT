require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
const { YoutubeiExtractor } = require('discord-player-youtubei');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function run() {
  const player = new Player(client);
  await player.extractors.register(YoutubeiExtractor, {});
  await player.extractors.loadMulti(DefaultExtractors);
  
  console.log("Extractors loaded:", player.extractors.store.map(e => e.identifier));
  
  const query = "https://youtu.be/aMyik1YF1Lo";
  const result = await player.search(query, { fallbackSearchEngine: 'youtubei' });
  console.log("Search result for", query);
  console.log("Has tracks?", result.hasTracks());
  if (result.hasTracks()) {
    console.log("First track:", result.tracks[0].title);
    console.log("Extractor:", result.tracks[0].extractor?.identifier);
  } else {
    console.log("No tracks found");
  }
  process.exit(0);
}
run().catch(console.error);
