const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { useQueue } = require("discord-player");
const Genius = require("genius-lyrics");
const client = new Genius.Client();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lirik")
    .setDescription("Tampilkan lirik lagu yang sedang diputar")
    .addStringOption((option) =>
      option
        .setName("judul")
        .setDescription("Judul lagu (jika kosong pakai lagu yang diputar)")
        .setRequired(false),
    ),
  async execute(interaction) {
    await interaction.deferReply();

    try {
      let songTitle = interaction.options.getString("judul");

      // Jika tidak ada input, cari dari lagu yang sedang diputar
      if (!songTitle) {
        const queue = useQueue(interaction.guild.id);
        if (!queue || !queue.isPlaying()) {
          return await interaction.editReply({
            content:
              "Gak ada lagu yang diputar kak. Pakai `/lirik [judul]` untuk cari lirik 🎵",
          });
        }
        songTitle = queue.currentTrack.title;
      }

      // Search lirik
      const songs = await client.songs.search(songTitle);

      if (!songs || songs.length === 0) {
        return await interaction.editReply({
          content: `Maaf kak lirik **${songTitle}** tidak ketemu di Genius 😭`,
        });
      }

      const song = songs[0];
      const lyrics = await song.lyrics();

      // Split lyrics jika terlalu panjang (Discord embed max 4096 chars)
      const chunks = [];
      let chunk = "";

      for (const line of lyrics.split("\n")) {
        if ((chunk + line + "\n").length > 2000) {
          chunks.push(chunk);
          chunk = line + "\n";
        } else {
          chunk += line + "\n";
        }
      }
      if (chunk) chunks.push(chunk);

      // Buat embed untuk setiap chunk
      const embeds = chunks.map((text, index) => {
        const embed = new EmbedBuilder()
          .setColor(0xffd700) // Gold ala Genius
          .setAuthor({
            name: `🎤 ${song.artist.name}`,
            iconURL: song.artist.image,
          })
          .setTitle(`[${index + 1}/${chunks.length}] ${song.title}`)
          .setDescription(text)
          .setURL(song.url)
          .setThumbnail(song.image)
          .setFooter({ text: "Powered by Genius.com" });

        return embed;
      });

      // Kirim embed pertama
      await interaction.editReply({ embeds: [embeds[0]] });

      // Jika ada lebih dari 1 embed, kirim yang lain di reply
      if (embeds.length > 1) {
        for (let i = 1; i < embeds.length; i++) {
          await interaction.followUp({ embeds: [embeds[i]] });
        }
      }
    } catch (error) {
      console.error("[Lirik] Error:", error.message);
      await interaction.editReply({
        content: `Error saat mencari lirik: ${error.message}`,
      });
    }
  },
};
