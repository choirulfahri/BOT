const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");
const voiceStateEvent = require("../../events/voiceStateUpdate");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("private")
    .setDescription("Buat private voice room")
    .addStringOption((option) =>
      option
        .setName("nama")
        .setDescription("Nama room (opsional)")
        .setRequired(false),
    )
    .addUserOption((option) =>
      option
        .setName("invite1")
        .setDescription("Invite member 1 (opsional)")
        .setRequired(false),
    )
    .addUserOption((option) =>
      option
        .setName("invite2")
        .setDescription("Invite member 2 (opsional)")
        .setRequired(false),
    )
    .addUserOption((option) =>
      option
        .setName("invite3")
        .setDescription("Invite member 3 (opsional)")
        .setRequired(false),
    ),
  async execute(interaction) {
    const requester = interaction.member;
    const customName = interaction.options.getString("nama") || null;

    // Cek apakah user sudah di voice channel
    if (!requester.voice.channel) {
      return await interaction.reply({
        content: "Kamu harus masuk voice channel dulu kak!",
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      // Kumpulkan invited members
      const invitedMembers = [];
      for (let i = 1; i <= 3; i++) {
        const member = interaction.options.getUser(`invite${i}`);
        if (member) {
          invitedMembers.push(interaction.guild.members.cache.get(member.id));
        }
      }

      // Setup permissions
      const permissionOverwrites = [
        {
          id: interaction.guild.id,
          deny: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.Connect,
          ],
        },
        {
          id: interaction.guild.members.me.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.MoveMembers,
            PermissionsBitField.Flags.ManageChannels,
          ],
        },
        {
          id: requester.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.Speak,
            PermissionsBitField.Flags.MuteMembers,
          ],
        },
      ];

      invitedMembers.forEach((member) => {
        if (member) {
          permissionOverwrites.push({
            id: member.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.Connect,
              PermissionsBitField.Flags.Speak,
            ],
          });
        }
      });

      // Buat room name
      const roomName = customName || `private-${requester.user.username}`;

      // Create voice channel
      const privateChannel = await interaction.guild.channels.create({
        name: roomName,
        type: ChannelType.GuildVoice,
        parent: requester.voice.channel?.parentId || null,
        permissionOverwrites,
        userLimit: 1 + invitedMembers.filter((m) => m).length,
        reason: "Private room dibuat via bot",
      });

      // Save private channel info
      voiceStateEvent.getPrivateChannels().set(privateChannel.id, {
        ownerId: requester.id,
        createdAt: Date.now(),
      });

      // Move requester ke private room
      if (requester.voice.channel) {
        await requester.voice.setChannel(privateChannel).catch(() => {});
      }

      // Buat invite link
      let inviteUrl = "";
      try {
        const invite = await privateChannel.createInvite({
          maxAge: 0,
          maxUses: 0,
        });
        inviteUrl = invite.url;
      } catch (err) {
        console.error("[Private] Gagal buat invite link:", err.message);
      }

      // Send DM ke invited members
      const inviteNames = [];
      for (const member of invitedMembers) {
        if (member) {
          inviteNames.push(member.user.username);
          try {
            const msgLink = inviteUrl
              ? `\n\n🔗 **Join link:** ${inviteUrl}`
              : "";
            await member.user.send(
              `kak **${interaction.user.username}** dari server **${interaction.guild.name}** baut **Private Room**!\n\nNama room: **${privateChannel.name}**${msgLink}`,
            );
          } catch (err) {
            console.error("[Private] Gagal kirim DM:", err.message);
          }
        }
      }

      // Reply to interaction
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Aku udah buat private room ya kak")
        .setDescription(`**${privateChannel.name}**`)
        .addFields(
          {
            name: "Channel",
            value: `<#${privateChannel.id}>`,
            inline: true,
          },
          {
            name: "Owner",
            value: `<@${requester.id}>`,
            inline: true,
          },
          {
            name: "Slots",
            value: `${1 + invitedMembers.filter((m) => m).length}`,
            inline: true,
          },
        )
        .addFields({
          name: "Aku udah invite",
          value:
            inviteNames.length > 0
              ? inviteNames.map((n) => `• ${n}`).join("\n")
              : "Tidak ada undangan",
          inline: false,
        });

      if (inviteUrl) {
        embed.addFields({
          name: "🔗 Link Invite",
          value: inviteUrl,
          inline: false,
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("[Private] Error:", err.message);
      await interaction.editReply({
        content: `Maaf kak ada error, kak developer tolong !!: ${err.message}`,
      });
    }
  },
};
