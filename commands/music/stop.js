const { SlashCommandBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stopin")
    .setDescription("Suruh aku stop nyanyi"),
  async execute(interaction) {
    // useQueue mengambil music queue di server (guild) tersebut
    const queue = useQueue(interaction.guild.id);

    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: "Maaf kak ada kesalahan, Tolong kak developer!!!",
        ephemeral: true,
      });
    }

    // Hentikan lagu dan kosongkan antrian, tapi bot TETAP di channel
    queue.tracks.clear(); // hapus semua antrian lagu
    queue.node.stop(); // hentikan lagu yang sedang diputar

    await interaction.reply({
      content: "Aku berhenti nyanyi nih kak ?, Suara ku gak enak ya ?",
    });
  },
};
