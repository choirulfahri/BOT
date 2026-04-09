const { Track, Player } = require("discord-player");
const { Client, GatewayIntentBits } = require("discord.js");
const { BridgeProvider, BridgeSource } = require("@discord-player/extractor");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const player = new Player(client);

(async () => {
  const { DefaultExtractors } = require("@discord-player/extractor");
  await player.extractors.loadMulti(DefaultExtractors, {});
  
  const searchResult = await player.search("https://youtu.be/aMyik1YF1Lo");     
  console.log("Search result:", searchResult.tracks[0].title);
  console.log("Extractor used:", searchResult.tracks[0].extractor?.identifier); 

  try {
     const streamInfo = await player.extractors.run(async (ext) => {
         if (ext.createStream) return await ext.createStream(searchResult.tracks[0], ext);
         return null;
     });
     console.log("Stream success:", !!streamInfo, streamInfo?.stream ? "Stream created" : "");
  } catch(e) {
     console.error("Stream failed:", e);
  }
  process.exit(0);
})();
