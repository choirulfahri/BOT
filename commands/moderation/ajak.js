const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ajak")
    .setDescription(
      "Kasih tau teman kakak kalo kamu nyariin dia buat main game bareng!",
    )
    .addUserOption((option) =>
      option
        .setName("teman")
        .setDescription("Tag teman kakak yang mau diajak main")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("game")
        .setDescription("Kakak mau ngajak main game apa nih?")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("pesan")
        .setDescription("Pesan tambahan buat teman kakak (opsional)")
        .setRequired(false),
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("teman");
    const game = interaction.options.getString("game");
    const pesanTambahan = interaction.options.getString("pesan");
    const sender = interaction.user;
    const voiceChannel = interaction.member?.voice?.channel;

    // Jangan bisa ajak diri sendiri
    if (targetUser.id === sender.id) {
      return interaction.reply({
        content: "Jangan main sendiri kak, ajak temen kakak dong!",
        ephemeral: true,
      });
    }

    // Jangan bisa ajak bot
    if (targetUser.bot) {
      return interaction.reply({
        content: "aduh kak aku gabisa main game",
        ephemeral: true,
      });
    }

    let components = [];
    let description = `**${sender.username}** lagi nyariin kakak buat main bareng nih!`;

    if (voiceChannel) {
      try {
        // Buat invite link ke channel voice
        const invite = await voiceChannel.createInvite({
          maxAge: 86400,
          maxUses: 0,
        }); // Kadaluarsa dalam 1 hari
        description += `\n\nDia udah nunggu di voice channel **${voiceChannel.name}**, Klik aja kak linknya buat join ya!`;

        const joinButton = new ButtonBuilder()
          .setLabel("Join Voice Room")
          .setStyle(ButtonStyle.Link)
          .setURL(invite.url);

        components.push(new ActionRowBuilder().addComponents(joinButton));
      } catch (err) {
        console.error("[Ajak] Gagal bikin invite link:", err);
      }
    }

    // Buat embed DM untuk target user
    const dmEmbed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Ada yang nyariin kakak nih!")
      .setDescription(description)
      .addFields(
        { name: "Game", value: `**${game}**`, inline: true },
        { name: "Server", value: interaction.guild.name, inline: true },
      )
      .setThumbnail(sender.displayAvatarURL({ dynamic: true }))
      .setFooter({
        text: `Ayo kak balas pesannya ${sender.username} di server.`,
      })
      .setTimestamp();

    // Tambahkan pesan tambahan jika ada
    if (pesanTambahan) {
      dmEmbed.addFields({ name: "Pesan Tambahan", value: pesanTambahan });
    }

    // Coba kirim DM ke target user
    try {
      await targetUser.send({ embeds: [dmEmbed], components: components });

      // Balas ke user yang ngirim command
      const successEmbed = new EmbedBuilder()
        .setColor(0x57f287) // Hijau
        .setTitle("✅ Pesan Terkirim!")
        .setDescription(
          `Aku udah kasih tahu ke kakak **${targetUser.username}** Kalo kakak nyariin dia main **${game}**!${voiceChannel ? ` (Link ke **${voiceChannel.name}** udah dikirim juga)` : ""}`,
        )
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

      await interaction.reply({ embeds: [successEmbed], ephemeral: true });

      // Kirim juga notif publik ke channel (opsional, agar server tau)
      const publicEmbed = new EmbedBuilder()
        .setColor(0xfee75c) // Kuning
        .setDescription(
          `🎮 <@${sender.id}> lagi nyariin <@${targetUser.id}> buat main **${game}**! ${pesanTambahan ? `\n💬 *"${pesanTambahan}"*` : ""}`,
        )
        .setTimestamp();

      await interaction.channel.send({
        embeds: [publicEmbed],
        components: components,
      });
    } catch (error) {
      // Jika target user menonaktifkan DM
      if (error.code === 50007) {
        await interaction.reply({
          content: `❌ Gagal ngirim DM ke **${targetUser.username}**. Sepertinya dia menonaktifkan DM dari server ini.`,
          ephemeral: true,
        });
      } else {
        console.error("[Ajak] Gagal kirim DM:", error);
        await interaction.reply({
          content: "Maaf kak ada error, Kakak developer tolong!!",
          ephemeral: true,
        });
      }
    }
  },
};
