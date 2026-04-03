const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Memutar musik dari YouTube, Spotify, Soundcloud, dll.')
        .addStringOption(option =>
            option.setName('lagu')
                .setDescription('Judul lagu atau URL lagu yang ingin diputar')
                .setRequired(true)),
    async execute(interaction) {
        const query = interaction.options.getString('lagu');
        const channel = interaction.member.voice.channel;

        if (!channel) {
            return interaction.reply({ content: '❌ Anda harus berada di dalam voice channel untuk memutar lagu!', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const player = interaction.client.player;
            const res = await player.play(channel, query, {
                nodeOptions: {
                    metadata: interaction
                }
            });

            const content = `🎶 Mulai memutar **${res.track.title}**!`;
            await interaction.followUp({ content });
        } catch (e) {
            console.log(e);
            await interaction.followUp({ content: `❌ Terjadi kesalahan saat mencoba memutar musik: ${e.message}`, ephemeral: true });
        }
    },
};
