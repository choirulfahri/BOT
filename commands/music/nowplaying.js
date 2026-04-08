const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

function createProgressBar(current, total) {
  const percentage = (current / total) * 100;
  const bars = Math.round(percentage / 5);
  const empty = 20 - bars;
  return `${"▰".repeat(bars)}${"▱".repeat(empty)} ${Math.floor(percentage)}%`;
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Lagu yang lagi aku nyanyiin sekarang"),
  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: "Aku lagi ngak nyanyiin lagu apapun nih kak",
        ephemeral: true,
      });
    }

    const track = queue.currentTrack;
    const progress = queue.node.getTimestamp();

    const embed = new EmbedBuilder()
      .setColor(0xff0000) // Merah ala YouTube Music
      .setTitle("🎵 Lagi Diputar Sekarang")
      .setDescription(`**[${track.title}](${track.url})**`)
      .addFields(
        {
          name: "👤 Artis",
          value: track.author || "Unknown",
          inline: true,
        },
        {
          name: "⏱️ Durasi",
          value: track.duration || "Unknown",
          inline: true,
        },
        {
          name: "🔁 Loop",
          value:
            queue.repeatMode === 0
              ? "Off"
              : queue.repeatMode === 1
                ? "Track"
                : "Queue",
          inline: true,
        },
      )
      .addFields({
        name: "📊 Progress",
        value:
          `${createProgressBar(progress.current, progress.total)}\n` +
          `${formatTime(progress.current)} / ${formatTime(progress.total)}`,
        inline: false,
      })
      .setThumbnail(track.thumbnail)
      .setFooter({
        text: `📝 Queue: ${queue.tracks.size} lagu • ${queue.node.isPaused() ? "⏸️ PAUSED" : "▶️ PLAYING"}`,
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
