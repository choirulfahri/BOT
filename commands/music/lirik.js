const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

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

      // Try Genius API with fallback
      try {
        const Genius = require("genius-lyrics");
        const client = new Genius.Client();

        const songs = await client.songs.search(songTitle);

        if (!songs || songs.length === 0) {
          throw new Error("Lirik tidak ketemu");
        }

        const song = songs[0];
        const lyrics = await song.lyrics();

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

        const embeds = chunks.map((text, index) => {
          return new EmbedBuilder()
            .setColor(0xffd700)
            .setAuthor({
              name: `🎤 ${song.artist.name}`,
              iconURL: song.artist.image,
            })
            .setTitle(`[${index + 1}/${chunks.length}] ${song.title}`)
            .setDescription(text)
            .setURL(song.url)
            .setThumbnail(song.image)
            .setFooter({ text: "Powered by Genius.com" });
        });

        await interaction.editReply({ embeds: [embeds[0]] });

        if (embeds.length > 1) {
          for (let i = 1; i < embeds.length; i++) {
            await interaction.followUp({ embeds: [embeds[i]] });
          }
        }
      } catch (geniusError) {
        // Fallback: Berikan link untuk cari lirik
        console.warn("[Lirik] Genius API tidak tersedia, pakai fallback");

        const searchUrl = `https://genius.com/search?q=${encodeURIComponent(songTitle)}`;
        const googleUrl = `https://www.google.com/search?q=%22${encodeURIComponent(songTitle)}%22+lirik`;

        const embed = new EmbedBuilder()
          .setColor(0xffd700)
          .setTitle(`🎤 ${songTitle}`)
          .setDescription(
            `Lirik tidak bisa ditampilkan langsung. Buka link di bawah ini:\n\n` +
              `🔗 [Genius](${searchUrl})\n` +
              `🔗 [Google](${googleUrl})`,
          )
          .setFooter({ text: "Klik salah satu link untuk lirik lengkap" });

        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      console.error("[Lirik] Error:", error.message);
      await interaction.editReply({
        content: `❌ Error: ${error.message}`,
      });
    }
  },
};
