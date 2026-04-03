const { Events, EmbedBuilder } = require('discord.js');

// =====================================================
// DAFTAR KATA KASAR - Tambahkan kata baru di sini
// Format: huruf kecil semua
// =====================================================
const badWords = [
    // Umum
    'anjing', 'anj', 'anjg',
    'babi', 'b4b1',
    'bangsat', 'bgst', 'bngst',
    'goblok', 'g0bl0k', 'gblk',
    'tolol', 'tlol',
    'bodoh', 'bodo',
    'idiot',
    'kampret',
    'keparat',
    'bajingan',
    'bedebah',
    'sialan',
    'brengsek',
    // Kasar
    'kontol', 'kntl',
    'memek', 'mmk',
    'ngentot', 'ngt',
    'jancok', 'jncok',
    'cuki', 'cukimai',
    'asu',
    'celeng',
];

// Sistem peringatan (track berapa kali member melanggar)
const warningCount = new Map();

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(message, client) {
        // Jangan merespon bot lain atau webhooks
        if (message.author.bot) return;
        if (!message.guild) return;

        // Cek filter kata kasar
        const contentLower = message.content.toLowerCase();

        const foundWord = badWords.find(word => {
            // Cek dengan word boundary
            const regex = new RegExp(`(^|\\s|[^a-zA-Z])${word}($|\\s|[^a-zA-Z])`, 'i');
            return regex.test(contentLower);
        });

        if (foundWord) {
            try {
                // Hapus pesan yang mengandung kata kasar
                await message.delete();

                // Tambah hitungan peringatan untuk user ini
                const userId = message.author.id;
                const currentWarnings = (warningCount.get(userId) || 0) + 1;
                warningCount.set(userId, currentWarnings);

                // Tentukan warna dan pesan berdasarkan jumlah pelanggaran
                let color, title, description;

                if (currentWarnings >= 3) {
                    color = 0xFF0000; // Merah - peringatan serius
                    title = 'yo yo yo jaga lisan anda';
                    description = `Ini pelanggaran ke-**${currentWarnings}** Anda. Admin datang menjemput anda!`;
                } else if (currentWarnings === 2) {
                    color = 0xFF8C00; // Oranye - peringatan kedua
                    title = '⚠️ yo yo yo udah 2 kali ye';
                    description = `Anda sudah melanggar **2 kali**. sekali lagi anda dijemput!`;
                } else {
                    color = 0xFFD700; // Kuning - peringatan pertama
                    title = 'gabisa di bilangin nih bocah ye';
                    description = `jaga lisan anda`;
                }

                // Buat embed peringatan yang bagus
                const warningEmbed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle(title)
                    .setDescription(`<@${message.author.id}>, ${description}`)
                    .addFields(
                        { name: '📋 Alasan', value: 'Penggunaan kata kasar/tidak pantas', inline: true },
                        { name: '🔢 Total Pelanggaran', value: `${currentWarnings}x`, inline: true }
                    )
                    .setThumbnail(message.author.displayAvatarURL())
                    .setFooter({ text: 'Pesan ini akan dihapus dalam 8 detik' })
                    .setTimestamp();

                // Kirim peringatan
                const warningMessage = await message.channel.send({ embeds: [warningEmbed] });

                // Hapus pesan peringatan setelah 8 detik
                setTimeout(() => {
                    warningMessage.delete().catch(() => { });
                }, 8000);

                // AUTO-KICK saat pelanggaran ke-3
                if (currentWarnings >= 3) {
                    // Reset counter setelah dikick
                    warningCount.delete(message.author.id);

                    // Coba kirim DM ke user sebelum dikick
                    try {
                        await message.author.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(0xFF0000)
                                    .setTitle('🚨 Kamu Telah Dikeluarkan dari Server!')
                                    .setDescription(`Kamu telah dikeluarkan dari server karena **3 kali** melanggar aturan kata kasar.`)
                                    .addFields({ name: '📋 Alasan', value: 'Melanggar aturan kata kasar sebanyak 3 kali' })
                                    .setTimestamp()
                            ]
                        });
                    } catch (dmError) {
                        // User mungkin menonaktifkan DM, tidak perlu panic
                        console.log(`Tidak bisa kirim DM ke ${message.author.tag}`);
                    }

                    // Tunggu sebentar biar user sempat baca peringatan, lalu kick
                    setTimeout(async () => {
                        try {
                            const member = message.guild.members.cache.get(message.author.id);
                            if (member && member.kickable) {
                                await member.kick('Melanggar aturan kata kasar sebanyak 3 kali');
                                console.log(`[AutoKick] ${message.author.tag} telah dikick karena 3x kata kasar.`);
                            }
                        } catch (kickError) {
                            console.error('Gagal melakukan auto-kick:', kickError);
                        }
                    }, 3000); // 3 detik delay biar user sempat baca peringatan
                }

            } catch (error) {
                console.error('Gagal menghapus pesan kata kasar:', error);
            }
        }
    },
};
