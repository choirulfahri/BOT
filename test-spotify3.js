const { Player } = require("discord-player");
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const player = new Player(client);

(async () => {
  const { DefaultExtractors } = require("@discord-player/extractor");
  await player.extractors.loadMulti(DefaultExtractors);
  
  const sr = await player.search("https://open.spotify.com/track/6M14Bi5TquWeHjiRnt4X4B", {
       fallbackSearchEngine: "youtubeExt"
  });
  console.dir(sr.tracks, { depth: 2 });
  process.exit(0);
})();
