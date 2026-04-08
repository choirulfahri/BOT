const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Mengeluarkan member dari server.")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("Member yang ingin di-kick")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("alasan").setDescription("Alasan kick"),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    const targetMember = interaction.options.getMember("target");
    const alasan =
      interaction.options.getString("alasan") ??
      "Tidak ada alasan yang diberikan";

    if (!targetMember) {
      return interaction.reply({
        content: "Kakak yang di cari gak ada di server ini.",
        ephemeral: true,
      });
    }

    if (!targetMember.kickable) {
      return interaction.reply({
        content:
          "Aku gak bisa kick developer ku sendiri kak, Nanti dia marah aku takut !",
        ephemeral: true,
      });
    }

    try {
      await targetMember.kick(alasan);
      await interaction.reply({
        content: `Udah aku keluarin ya kak **${targetMember.user.tag}** dari server. Alasanya: *${alasan}* , Terimakasih kak udah jaga servernya dengan baik!`,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "Maaf kak ada error, Kakak developer tolong!!",
        ephemeral: true,
      });
    }
  },
};
