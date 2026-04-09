process.env.DP_FORCE_YTDL_MOD = "youtube-ext";
const { Player } = require("discord-player");
const { Client, GatewayIntentBits } = require("discord.js");
const { DefaultExtractors } = require("@discord-player/extractor");
const { YoutubeExtractor } = require("discord-player-youtube");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const player = new Player(client);

(async () => {
  await player.extractors.register(YoutubeExtractor, {});
  await player.extractors.loadMulti(DefaultExtractors);
  
  const sr = await player.search("https://open.spotify.com/track/1OMkdm5qzJYHCaOWfIplVo");
  console.log("Spotify Metadata:", sr.tracks[0]?.title);
  
  if (sr.tracks[0]) {
      try {
          const stream = await sr.tracks[0].extractor.createStream(sr.tracks[0]);
          console.log("Stream fetched!");
      } catch (e) {
          console.error("Stream fail:", e.message);
      }
  }
  process.exit(0);
})();
