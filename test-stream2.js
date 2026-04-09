const { Client, GatewayIntentBits } = require("discord.js");
const { Player } = require("discord-player");
const { YoutubeExtractor } = require("discord-player-youtube");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const player = new Player(client);

(async () => {
  await player.extractors.register(YoutubeExtractor, {});
  const sr = await player.search("https://youtu.be/aMyik1YF1Lo");
  console.log(sr.tracks[0]?.title, sr.tracks[0]?.extractor?.identifier);

  try {
     const stream = await sr.tracks[0].extractor.createStream(sr.tracks[0]);    
     console.log("Stream success:", !!stream);
  } catch(e) {
     console.error("Stream failed:", e);
  }
  process.exit(0);
})();
