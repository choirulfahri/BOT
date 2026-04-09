process.env.DP_FORCE_YTDL_MOD = "youtube-ext";
const { Player } = require("discord-player");
const { Client, GatewayIntentBits } = require("discord.js");
const { YoutubeExtractor } = require("discord-player-youtube");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const player = new Player(client);

(async () => {
  await player.extractors.register(YoutubeExtractor, {});
  console.log("Registered. Now searching.");
  const sr = await player.search("https://youtu.be/aMyik1YF1Lo");
  console.log(sr.tracks[0]?.title);
  process.exit(0);
})();
