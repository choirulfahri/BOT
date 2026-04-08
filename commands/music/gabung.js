const { SlashCommandBuilder } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sini")
    .setDescription("panggil aku nanti aku masuk"),
  async execute(interaction) {
    const userChannel = interaction.member.voice.channel;

    if (!userChannel) {
      return interaction.reply({
        content: "kakak nya masuk dulu ke voice channel ya kak",
        ephemeral: true,
      });
    }

    // Cek apakah bot sudah ada di channel yang sama
    const botVoiceState = interaction.guild.members.me.voice;
    if (botVoiceState.channel && botVoiceState.channel.id === userChannel.id) {
      return interaction.reply({
        content: `Hallo kak ${userChannel.name} aku udah di sini nih`,
        ephemeral: true,
      });
    }

    try {
      joinVoiceChannel({
        channelId: userChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false,
      });

      await interaction.reply({
        content: `sip aku gabung ya ke **${userChannel.name}**`,
      });
    } catch (error) {
      console.error("Gagal join voice channel:", error);
      await interaction.reply({
        content: "Aduh kak ada error ni maaf, di coba lagi ya",
        ephemeral: true,
      });
    }
  },
};
