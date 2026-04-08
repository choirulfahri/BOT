const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Lihat daftar antrian lagu"),
  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: "Aku lagi ngak nyanyiin lagu apapun nih kak",
        ephemeral: true,
      });
    }

    const currentTrack = queue.currentTrack;
    const tracks = queue.tracks.toArray();

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Antrian Lagu nya nih kak")
      .setDescription(
        `**Sekarang aku lagi nyanyiin:**\n[${currentTrack.title}](${currentTrack.url}) - ${currentTrack.duration}\n\n` +
          (tracks.length > 0
            ? `**Antrian selanjutnya (${tracks.length} lagu):**\n` +
              tracks
                .slice(0, 10)
                .map((t, i) => `\`${i + 1}.\` **${t.title}** - ${t.duration}`)
                .join("\n") +
              (tracks.length > 10
                ? `\n\n...dan **${tracks.length - 10}** lagu lainnya`
                : "")
            : "\n*Lagi gak ada lagu dalam antrian*"),
      )
      .setThumbnail(currentTrack.thumbnail)
      .setFooter({
        text: `Total ${tracks.length + 1} lagu | Loop: ${queue.repeatMode === 0 ? "Off" : queue.repeatMode === 1 ? "Track" : "Queue"}`,
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
