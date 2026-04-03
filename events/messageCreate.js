const { Events } = require('discord.js');

// Daftar kata-kata kasar (tambahkan sesuai kebutuhan dengan format huruf kecil semua)
const badWords = [
    'anjing',
    'babi',
    'bangsat',
    'goblok',
    'tolol',
    'bgst',
    'anj',
    'kontol',
    'memek'
];

module.exports = {
    name: Events.MessageCreate,
    once: false,
    async execute(message, client) {
        // Jangan merespon bot lain atau webhooks
        if (message.author.bot) return;

        // Cek filter kata kasar
        const contentLower = message.content.toLowerCase();
        
        // Memeriksa apakah setiap kata kasar ada di dalam pesan teks (menggunakan regular expression yang mengecek batasan kata)
        const isSwearing = badWords.some(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            return regex.test(contentLower);
        });

        if (isSwearing) {
            try {
                // Menghapus pesan
                await message.delete();
                
                // Menegur pengguna
                const warningMessage = await message.channel.send(`⚠️ <@${message.author.id}>, jangan menggunakan kata kasar! Pesan Anda telah dihapus.`);
                
                // Hapus teguran setelah 5 detik agar channel tidak kotor
                setTimeout(() => {
                    warningMessage.delete().catch(() => {});
                }, 5000);
            } catch (error) {
                console.error('Gagal saat mencoba menghapus pesan kata kasar: ', error);
            }
        }
    },
};
