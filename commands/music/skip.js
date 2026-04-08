const { SlashCommandBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip lagu yang sedang diputar"),
  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: "Aku lagi ngak nyanyiin lagu apapun nih kak",
        ephemeral: true,
      });
    }
    const skipped = queue.node.skip();
    await interaction.reply({
      content: skipped
        ? `Aku skip lagu ini ya kak, lanjut ke lagu berikutnya`
        : "Aku gagal skip, coba lagi ya",
    });
  },
};
