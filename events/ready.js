const { Events } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Bot berhasil terhubung dan siap! Login sebagai ${client.user.tag}`);
        client.user.setActivity('ngamen di voice channel', { type: 2 }); // type 2 = Listening

        // Auto-join ke voice channel default jika VOICE_CHANNEL_ID diisi di .env
        const voiceChannelId = process.env.VOICE_CHANNEL_ID;
        if (!voiceChannelId) {
            console.log('[Voice] VOICE_CHANNEL_ID tidak diset di .env, bot tidak auto-join.');
            return;
        }

        try {
            // Cari channel di semua guild yang terhubung
            for (const [, guild] of client.guilds.cache) {
                const channel = guild.channels.cache.get(voiceChannelId);
                if (channel && channel.isVoiceBased()) {
                    joinVoiceChannel({
                        channelId: channel.id,
                        guildId: guild.id,
                        adapterCreator: guild.voiceAdapterCreator,
                        selfDeaf: false,
                        selfMute: false,
                    });
                    console.log(`[Voice] Bot berhasil join ke channel: ${channel.name} di server: ${guild.name}`);
                }
            }
        } catch (err) {
            console.error('[Voice] Gagal auto-join voice channel:', err);
        }
    },
};
