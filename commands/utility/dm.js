const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dm")
    .setDescription("Kirim DM ke teman")
    .addUserOption((option) =>
      option
        .setName("teman")
        .setDescription("Teman yang ingin dikirimi pesan")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("pesan")
        .setDescription("Isi pesan yang ingin dikirim")
        .setRequired(true),
    ),
  async execute(interaction) {
    const targetUser = interaction.options.getUser("teman");
    const message = interaction.options.getString("pesan");

    if (targetUser.bot) {
      return await interaction.reply({
        content: "Gak bisa kirim DM ke bot ya kak!",
        ephemeral: true,
      });
    }

    try {
      await targetUser.send(
        `kak **${interaction.user.username}** dari server **${interaction.guild.name}** kirim pesan ke kakak:\n\n${message}`,
      );

      return await interaction.reply({
        content: `sip aku udah kirim ya pesannya **${targetUser.username}**! `,
        ephemeral: true,
      });
    } catch (err) {
      if (err.code === 50007) {
        return await interaction.reply({
          content: `Gagal aku kirim ke **${targetUser.username}**, DM-nya dikunci nih kak!`,
          ephemeral: true,
        });
      }
      return await interaction.reply({
        content: `Maaf kak ada error, kak developer tolong !!: ${err.message}`,
        ephemeral: true,
      });
    }
  },
};
