const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("musik")
    .setDescription("Putar musik dari youtube")
    .addStringOption((option) =>
      option.setName("lagu").setDescription("Judul Lagu kak").setRequired(true),
    ),
  async execute(interaction) {
    const query = interaction.options.getString("lagu");
    const userChannel = interaction.member.voice.channel;

    if (!userChannel) {
      return interaction.reply({
        content: "Maaf kak masuk ke Voice dulu ya",
        ephemeral: true,
      });
    }

    // Cek apakah bot sedang di voice channel yang berbeda
    const botVoiceState = interaction.guild.members.me.voice;
    if (botVoiceState.channel && botVoiceState.channel.id !== userChannel.id) {
      return interaction.reply({
        content: `pindah dulu ke **${botVoiceState.channel.name}** ya, gue lagi di sana!`,
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      const player = interaction.client.player;

      // Cek apakah sudah ada lagu yang dimainkan (mode antrian)
      const existingQueue = useQueue(interaction.guild.id);
      const isQueuing = existingQueue && existingQueue.isPlaying();

      // Retry logic untuk handle YouTube blocks
      let res;
      let attempts = 0;
      const maxAttempts = 3;
      let lastError;

      while (attempts < maxAttempts && !res) {
        try {
          attempts++;
          console.log(`[Play] Attempt ${attempts} untuk query: ${query}`);

          res = await Promise.race([
            player.play(userChannel, query, {
              nodeOptions: {
                metadata: interaction,
                leaveOnEmpty: false,
                leaveOnEnd: false,
                leaveOnEmptyCooldown: 0,
                leaveOnEndCooldown: 0,
              },
            }),
            // Timeout 30 detik
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Play timeout")), 30000),
            ),
          ]);

          if (res) break;
        } catch (err) {
          lastError = err;
          console.warn(`[Play] Attempt ${attempts} failed: ${err.message}`);

          if (attempts < maxAttempts) {
            // Tunggu 2 detik sebelum retry
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
      }

      if (!res) {
        throw (
          lastError || new Error("Gagal play lagu setelah beberapa percobaan")
        );
      }

      if (isQueuing) {
        // Lagu ditambahkan ke antrian
        const queue = useQueue(interaction.guild.id);
        const position = queue ? queue.tracks.size : "?";

        const queueEmbed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle("Aku tambahin ke antrian ya kak")
          .setDescription(`**${res.track.title}**`)
          .addFields(
            {
              name: "Artis",
              value: res.track.author || "Unknown",
              inline: true,
            },
            {
              name: "Durasi",
              value: res.track.duration || "Unknown",
              inline: true,
            },
            { name: "Posisi Antrian", value: `#${position}`, inline: true },
          )
          .setThumbnail(res.track.thumbnail)
          .setTimestamp();

        await interaction.editReply({ embeds: [queueEmbed] });
      } else {
        // Langsung main
        await interaction.editReply({
          content: `Aku nyanyiin lagu ini ya **${res.track.title}** 🎵`,
        });
      }
    } catch (e) {
      console.error("[Play] Error:", e.message);

      // Error messages yang lebih informatif
      let errorMsg = `Gagal main lagu kak 😭\n\n**${e.message}**`;

      if (e.message.includes("No results")) {
        errorMsg = `Lagu **${query}** tidak ketemu nih kak. Coba:\n\n• Pakai judul lengkap (artist - judul)\n• Cari judul lain\n• Pakai URL YouTube/Spotify langsung`;
      } else if (
        e.message.includes("Cannot retrieve") ||
        e.message.includes("unavailable")
      ) {
        errorMsg = `Lagu **${query}** gak bisa dimainkan kak. Kemungkinan:\n\n• 🌍 Diblock di negara ini\n• 🔒 Konten terbatas\n• ❌ Video dihapus\n\nCoba lagu lain ya kak! 🎵`;
      } else if (e.message.includes("FFmpeg")) {
        errorMsg = `Sistem audio error kak. Hubungi developer! 🛠️`;
      } else if (
        e.message.includes("ETIMEDOUT") ||
        e.message.includes("timeout")
      ) {
        errorMsg = `Koneksi lambat kak. Coba lagi dalam beberapa saat ya 🌐`;
      } else if (e.message.includes("403") || e.message.includes("401")) {
        errorMsg = `Video ini private atau age-restricted kak. Coba lagu lain ya 🔞`;
      } else if (e.message.includes("deleted")) {
        errorMsg = `Video sudah dihapus kak. Coba lagu lain ya 🗑️`;
      }

      await interaction.editReply({
        content: errorMsg,
      });
    }
  },
};
