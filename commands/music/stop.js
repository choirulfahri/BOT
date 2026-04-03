const { SlashCommandBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Menghentikan musik yang sedang diputar dan keluar dari voice channel.'),
    async execute(interaction) {
        // useQueue mengambil music queue di server (guild) tersebut
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({ content: '❌ Saat ini tidak ada musik yang sedang diputar!', ephemeral: true });
        }

        // Hapus queue dan node
        queue.delete();
        
        await interaction.reply({ content: '🛑 Musik telah dihentikan, dan saya keluar dari channel.' });
    },
};
