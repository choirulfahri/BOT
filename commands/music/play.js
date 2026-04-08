const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("musik")
    .setDescription("")
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

      const res = await player.play(userChannel, query, {
        nodeOptions: {
          metadata: interaction,
          leaveOnEmpty: false,
          leaveOnEnd: false,
          leaveOnEmptyCooldown: 0,
          leaveOnEndCooldown: 0,
        },
      });

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
      console.log(e);
      await interaction.editReply({
        content: `Maaf kak ada kesalahan, Tolong kak developer: ${e.message}`,
      });
    }
  },
};
