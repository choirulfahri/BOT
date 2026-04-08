const { Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Hallo kakak developer aku udah online nih ${client.user.tag}`);
    client.user.setActivity(
      "Hallo kakak kakak semua aku assistent Developer, Salam Kenal ya",
      { type: 2 },
    ); // type 2 = Listening
    console.log("[Voice] aku siap kak");
  },
};
