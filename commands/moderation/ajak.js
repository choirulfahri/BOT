const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ajak')
        .setDescription('Kasih tau teman kamu bahwa kamu nyariin dia buat main game bareng!')
        .addUserOption(option =>
            option.setName('teman')
                .setDescription('Tag teman yang ingin kamu ajak main')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('game')
                .setDescription('Game apa yang mau dimainkan?')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('pesan')
                .setDescription('Pesan tambahan (opsional)')
                .setRequired(false)),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('teman');
        const game = interaction.options.getString('game');
        const pesanTambahan = interaction.options.getString('pesan');
        const sender = interaction.user;

        // Jangan bisa ajak diri sendiri
        if (targetUser.id === sender.id) {
            return interaction.reply({
                content: 'masa ngajak diri sendiri bro 😂',
                ephemeral: true
            });
        }

        // Jangan bisa ajak bot
        if (targetUser.bot) {
            return interaction.reply({
                content: 'bot ga bisa diajak main bro 🤖',
                ephemeral: true
            });
        }

        // Buat embed DM untuk target user
        const dmEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('🎮 Ada yang Nyariin Kamu!')
            .setDescription(`**${sender.username}** lagi nyariin kamu buat main bareng nih!`)
            .addFields(
                { name: '🎯 Game', value: `**${game}**`, inline: true },
                { name: '🏠 Server', value: interaction.guild.name, inline: true },
            )
            .setThumbnail(sender.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Cepet gasken! Hubungi balik ${sender.username} di server.` })
            .setTimestamp();

        // Tambahkan pesan tambahan jika ada
        if (pesanTambahan) {
            dmEmbed.addFields({ name: '💬 Pesan Tambahan', value: pesanTambahan });
        }

        // Coba kirim DM ke target user
        try {
            await targetUser.send({ embeds: [dmEmbed] });

            // Balas ke user yang ngirim command
            const successEmbed = new EmbedBuilder()
                .setColor(0x57F287) // Hijau
                .setTitle('✅ Pesan Terkirim!')
                .setDescription(`Bot udah ngasih tau **${targetUser.username}** bahwa kamu nyariin dia buat main **${game}**!`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed], ephemeral: true });

            // Kirim juga notif publik ke channel (opsional, agar server tau)
            const publicEmbed = new EmbedBuilder()
                .setColor(0xFEE75C) // Kuning
                .setDescription(`🎮 <@${sender.id}> lagi nyariin <@${targetUser.id}> buat main **${game}**! ${pesanTambahan ? `\n💬 *"${pesanTambahan}"*` : ''}`)
                .setTimestamp();

            await interaction.channel.send({ embeds: [publicEmbed] });

        } catch (error) {
            // Jika target user menonaktifkan DM
            if (error.code === 50007) {
                await interaction.reply({
                    content: `❌ Gagal ngirim DM ke **${targetUser.username}**. Sepertinya dia menonaktifkan DM dari server ini.`,
                    ephemeral: true
                });
            } else {
                console.error('[Ajak] Gagal kirim DM:', error);
                await interaction.reply({
                    content: 'ada yang error nih, coba lagi bang',
                    ephemeral: true
                });
            }
        }
    },
};
