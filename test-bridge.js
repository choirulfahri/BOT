const { Client, GatewayIntentBits } = require("discord.js");
const { Player } = require("discord-player");
const { BridgeProvider, BridgeSource } = require("@discord-player/extractor");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const player = new Player(client);

(async () => {
  const { DefaultExtractors } = require("@discord-player/extractor");
  const bridgeProvider = new BridgeProvider(BridgeSource.YouTube);
  
  await player.extractors.loadMulti(DefaultExtractors, {
      bridgeProvider
  });
  console.log("Extractors configured.");
  process.exit(0);
})();
