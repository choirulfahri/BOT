const { SlashCommandBuilder } = require("discord.js");
const { useQueue, QueueRepeatMode } = require("discord-player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("aku nyanyiin lagu ini terus nih kak?")
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("Kakak mau aku nyanyiin terus kaya gimana ?")
        .setRequired(true)
        .addChoices(
          { name: "Aku gak nyanyiin terus", value: "off" },
          { name: "Aku nyanyiin 1 lagu terus", value: "track" },
          { name: "Aku nyanyiin semua antrian terus", value: "queue" },
        ),
    ),
  async execute(interaction) {
    const mode = interaction.options.getString("mode");
    const queue = useQueue(interaction.guild.id);
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: "Kak maaf tapi gak ada lagu yang lagi aku nyanyiin nih",
        ephemeral: true,
      });
    }

    const modeMap = {
      off: { value: QueueRepeatMode.OFF, label: "Aku gak nyanyiin terus" },
      track: {
        value: QueueRepeatMode.TRACK,
        label: "Aku nyanyiin 1 lagu terus",
      },
      queue: {
        value: QueueRepeatMode.QUEUE,
        label: "Aku nyanyiin semua antrian terus",
      },
    };

    queue.setRepeatMode(modeMap[mode].value);
    await interaction.reply({ content: modeMap[mode].label });
  },
};
