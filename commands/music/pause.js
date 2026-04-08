const { SlashCommandBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Aku berhenti nyanyiin lagunya dulu ya kak"),
  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: "Aku lagi ngak nyanyiin lagu apapun nih kak",
        ephemeral: true,
      });
    }
    if (queue.node.isPaused()) {
      return interaction.reply({
        content: "Aku berhenti nyanyi dulu ya kak",
        ephemeral: true,
      });
    }
    queue.node.pause();
    await interaction.reply({
      content:
        "Aku lagi berhenti nyanyiin lagunya dulu ya kak kalau mau aku nyanyiin lagi bilang aja ya atau ketik /resume ya kak",
    });
  },
};
