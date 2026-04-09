const { Player } = require("discord-player");
const { Client, GatewayIntentBits } = require("discord.js");
const { DefaultExtractors } = require("@discord-player/extractor");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const player = new Player(client);

(async () => {
  await player.extractors.loadMulti(DefaultExtractors);
  try {
      const sr = await player.search("https://open.spotify.com/track/6M14Bi5TquWeHjiRnt4X4B");
      console.log(sr.tracks);
  } catch (e) {
      console.log(e);
  }
  process.exit(0);
})();
