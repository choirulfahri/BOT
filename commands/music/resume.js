const { SlashCommandBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Aku lanjut nyanyiin lagunya lagi ya kak"),
  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);
    if (!queue) {
      return interaction.reply({
        content: "Aku lagi ngak nyanyiin lagu apapun nih kak",
        ephemeral: true,
      });
    }
    if (!queue.node.isPaused()) {
      return interaction.reply({
        content: "Aku lagi ngak nyanyiin lagu apapun nih kak",
        ephemeral: true,
      });
    }
    queue.node.resume();
    await interaction.reply({ content: "Aku lanjut nyanyi ya kak" });
  },
};
