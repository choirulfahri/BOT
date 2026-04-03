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

// =====================================================
// DAFTAR POLA PHISHING - Deteksi link & konten scam
// =====================================================
const phishingPatterns = [
    // Discord Nitro Scam
    /discord[.\-]?gift/i,
    /discordnitro/i,
    /free.?nitro/i,
    /nitro.?free/i,
    /discord.?nitro.?giveaway/i,
    /claim.?nitro/i,

    // Steam Scam
    /steam.?gift/i,
    /steamcommunity\.com\/gift/i,
    /free.?steam/i,
    /steam.?free/i,

    // URL Shortener + Klaim Hadiah (sering dipakai phishing)
    /(bit\.ly|tinyurl\.com|t\.co|cutt\.ly|rb\.gy).+?(free|gift|nitro|claim|win)/i,

    // Fake gift / reward
    /you.?(have|got|won|received).+?(gift|prize|reward|nitro)/i,
    /klik.?(link|disini|sini).+(gratis|free|hadiah|menang)/i,
    /claim.?your.?(gift|prize|reward|free)/i,

    // Domain mencurigakan yang mirip Discord
    /discords?[^.]*\.(xyz|tk|ml|ga|cf|gq|ru|cn)/i,
    /dlscord/i,
    /disc0rd/i,
    /d1scord/i,
];

// Sistem peringatan (track berapa kali member melanggar kata kasar)
const warningCount = new Map();

// Fungsi untuk kick user dengan DM notifikasi
async function kickUser(message, reason, embedTitle, embedDesc) {
    try {
        // Kirim DM dulu sebelum kick
        await message.author.send({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('🚨 Kamu Telah Dikeluarkan dari Server!')
                    .setDescription(embedDesc)
                    .addFields({ name: '📋 Alasan', value: reason })
                    .setTimestamp()
            ]
        }).catch(() => {});

        // Delay 2 detik biar user sempat baca DM
        setTimeout(async () => {
            try {
                const member = message.guild.members.cache.get(message.author.id);
                if (member && member.kickable) {
                    await member.kick(reason);
                    console.log(`[AutoKick] ${message.author.tag} dikick. Alasan: ${reason}`);
                }
            } catch (e) {
                console.error('Gagal auto-kick:', e);
            }
        }, 2000);
    } catch (e) {
        console.error('Gagal proses kick:', e);
    }
}

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(message, client) {
        // Jangan merespon bot lain atau webhooks
        if (message.author.bot) return;
        if (!message.guild) return;

        const contentLower = message.content.toLowerCase();

        // =====================================================
        // CEK PHISHING TERLEBIH DAHULU (prioritas lebih tinggi)
        // =====================================================
        const isPhishing = phishingPatterns.some(pattern => pattern.test(message.content));

        if (isPhishing) {
            // Hapus pesan phishing
            await message.delete().catch(err => {
                if (err.code !== 10008) console.error('Gagal hapus pesan phishing:', err);
            });

            // Kirim embed peringatan phishing di channel
            const phishEmbed = new EmbedBuilder()
                .setColor(0x8B0000) // Merah gelap
                .setTitle('🎣 Link Phishing / Scam Terdeteksi!')
                .setDescription(`<@${message.author.id}> telah mengirim konten mencurigakan dan **langsung dikeluarkan** dari server!`)
                .addFields(
                    { name: '⚠️ Jenis Pelanggaran', value: 'Phishing / Link Scam', inline: true },
                    { name: '🔨 Tindakan', value: 'Kick Otomatis', inline: true }
                )
                .setThumbnail(message.author.displayAvatarURL())
                .setFooter({ text: 'Jangan klik link mencurigakan dari siapapun!' })
                .setTimestamp();

            const phishMsg = await message.channel.send({ embeds: [phishEmbed] });

            // Hapus pesan peringatan phishing setelah 15 detik
            setTimeout(() => phishMsg.delete().catch(() => {}), 15000);

            // Langsung kick
            await kickUser(
                message,
                'Mengirim konten phishing/scam di server',
                '🚨 Kamu Telah Dikeluarkan dari Server!',
                'Kamu telah dikeluarkan karena mengirim **link phishing atau konten scam**. Harap berhati-hati di masa depan.'
            );

            return; // Berhenti, tidak perlu cek badword lagi
        }

        // =====================================================
        // CEK KATA KASAR
        // =====================================================
        const foundWord = badWords.find(word => {
            const regex = new RegExp(`(^|\\s|[^a-zA-Z])${word}($|\\s|[^a-zA-Z])`, 'i');
            return regex.test(contentLower);
        });

        if (foundWord) {
            try {
                // Hapus pesan kata kasar
                await message.delete().catch(err => {
                    if (err.code !== 10008) console.error('Gagal hapus pesan:', err);
                });

                // Tambah hitungan peringatan
                const userId = message.author.id;
                const currentWarnings = (warningCount.get(userId) || 0) + 1;
                warningCount.set(userId, currentWarnings);

                // Tentukan warna dan pesan berdasarkan jumlah pelanggaran
                let color, title, description;

                if (currentWarnings >= 3) {
                    color = 0xFF0000;
                    title = 'yo yo yo jaga lisan anda';
                    description = `Ini pelanggaran ke-**${currentWarnings}** Anda. Admin datang menjemput anda!`;
                } else if (currentWarnings === 2) {
                    color = 0xFF8C00;
                    title = '⚠️ yo yo yo udah 2 kali ye';
                    description = `Anda sudah melanggar **2 kali**. sekali lagi anda dijemput!`;
                } else {
                    color = 0xFFD700;
                    title = 'gabisa di bilangin nih bocah ye';
                    description = `jaga lisan anda`;
                }

                // Buat embed peringatan
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
                    warningMessage.delete().catch(() => {});
                }, 8000);

            } catch (error) {
                console.error('Gagal memproses pesan kata kasar:', error);
            }
        }
    },
};
