const {
  SlashCommandBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cari")
    .setDescription("Cari lagu sebelum dimainkan")
    .addStringOption((option) =>
      option
        .setName("judul")
        .setDescription("Judul atau artis lagu kak")
        .setRequired(true),
    ),
  async execute(interaction) {
    const query = interaction.options.getString("judul");
    const userChannel = interaction.member.voice.channel;

    if (!userChannel) {
      return interaction.reply({
        content: "Maaf kak masuk ke Voice dulu ya",
        ephemeral: true,
      });
    }

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

      // Search untuk 5 lagu teratas
      const results = await player.search(query, {
        requestedBy: interaction.user,
        searchEngine: "youtube",
      });

      if (!results.tracks || results.tracks.length === 0) {
        return await interaction.editReply({
          content: `Maaf kak lagu **${query}** tidak ketemu. Coba judul lain ya 🎵`,
        });
      }

      // Buat select menu untuk memilih lagu
      const tracks = results.tracks.slice(0, 10);

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("music_select")
        .setPlaceholder("Pilih lagu yang mau diputar")
        .addOptions(
          tracks.map((track, index) => ({
            label: `${index + 1}. ${track.title.substring(0, 80)}`,
            description: `${track.author ? track.author.substring(0, 50) : "Unknown"} • ${track.duration}`,
            value: index.toString(),
          })),
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`Hasil pencarian: "${query}"`)
        .setDescription(
          `Ketemu ${tracks.length} hasil. Pilih yang mau diputar ya kak! 🎵`,
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed], components: [row] });

      // Timeout 30 detik untuk select
      const collector = interaction.channel.createMessageComponentCollector({
        filter: (i) =>
          i.user.id === interaction.user.id && i.customId === "music_select",
        time: 30000,
      });

      collector.on("collect", async (selectInteraction) => {
        await selectInteraction.deferReply();

        const selectedIndex = parseInt(selectInteraction.values[0]);
        const selectedTrack = tracks[selectedIndex];

        try {
          const existingQueue = useQueue(interaction.guild.id);
          const isQueuing = existingQueue && existingQueue.isPlaying();

          const res = await player.play(userChannel, selectedTrack.url, {
            nodeOptions: {
              metadata: selectInteraction,
              leaveOnEmpty: false,
              leaveOnEnd: false,
              leaveOnEmptyCooldown: 0,
              leaveOnEndCooldown: 0,
            },
          });

          if (isQueuing) {
            const queue = useQueue(interaction.guild.id);
            const position = queue ? queue.tracks.size : "?";

            const queueEmbed = new EmbedBuilder()
              .setColor(0x5865f2)
              .setTitle("Ditambah ke antrian ya kak")
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
                {
                  name: "Posisi Antrian",
                  value: `#${position}`,
                  inline: true,
                },
              )
              .setThumbnail(res.track.thumbnail)
              .setTimestamp();

            await selectInteraction.editReply({
              embeds: [queueEmbed],
              components: [],
            });
          } else {
            await selectInteraction.editReply({
              content: `Aku nyanyiin **${res.track.title}** ya kak 🎵`,
              components: [],
            });
          }

          // Hapus select menu dari original reply
          await interaction.editReply({ components: [] });
        } catch (err) {
          console.error("[Search] Play error:", err.message);
          await selectInteraction.editReply({
            content: `Gagal play lagu kak 😭\n\n**${err.message}**`,
          });
        }
      });

      collector.on("end", (collected) => {
        if (collected.size === 0) {
          interaction.editReply({
            content: "Timeout kak, pilihan ditutup 😭",
            components: [],
          });
        }
      });
    } catch (e) {
      console.error("[Search] Error:", e.message);
      await interaction.editReply({
        content: `Error saat mencari lagu: ${e.message}`,
      });
    }
  },
};
