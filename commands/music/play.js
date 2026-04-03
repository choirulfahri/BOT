const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('musik')
        .setDescription('sip numpang ngamen')
        .addStringOption(option =>
            option.setName('lagu')
                .setDescription('Judul lagu atau URL lagu yang ingin diputar')
                .setRequired(true)),
    async execute(interaction) {
        const query = interaction.options.getString('lagu');
        const channel = interaction.member.voice.channel;

        if (!channel) {
            return interaction.reply({ content: 'yeh dongo di ke voice channel dulu', ephemeral: true });
        }

        await interaction.deferReply();

        try {
            const player = interaction.client.player;
            const res = await player.play(channel, query, {
                nodeOptions: {
                    metadata: interaction
                }
            });

            const content = `numpang ngamen bawain lagu${res.track.title}`;
            await interaction.followUp({ content });
        } catch (e) {
            console.log(e);
            await interaction.followUp({ content: `ada yang salah tapi apa ye ${e.message}`, ephemeral: true });
        }
    },
};
