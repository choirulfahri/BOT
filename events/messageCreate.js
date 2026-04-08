const {
  Events,
  EmbedBuilder,
  PermissionsBitField,
  ChannelType,
} = require("discord.js");
const { useQueue, QueueRepeatMode } = require("discord-player");
const { joinVoiceChannel } = require("@discordjs/voice");
const voiceStateEvent = require("./voiceStateUpdate");

// =====================================================
// DAFTAR KATA KASAR - Tambahkan kata baru di sini
// Format: huruf kecil semua
// =====================================================
const badWords = [
  // Umum
  "anjing",
  "anj",
  "anjg",
  "babi",
  "b4b1",
  "bangsat",
  "bgst",
  "bngst",
  "goblok",
  "g0bl0k",
  "gblk",
  "tolol",
  "tlol",
  "bodoh",
  "bodo",
  "idiot",
  "kampret",
  "keparat",
  "bajingan",
  "bedebah",
  "sialan",
  "brengsek",
  // Kasar
  "kontol",
  "kntl",
  "memek",
  "mmk",
  "ngentot",
  "ngt",
  "jancok",
  "jncok",
  "cuki",
  "cukimai",
  "asu",
  "celeng",
  "jembut",
  "jmbt",
  "pukimai",
  "pendo",
  "lolok",
  "maklu lonte",
  "bitch",
  "zuya",
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
    await message.author
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Kak Kamu Di kick dari server " + message.guild.name)
            .setDescription(embedDesc)
            .addFields({ name: "📋 Alasan", value: reason })
            .setTimestamp(),
        ],
      })
      .catch(() => {});

    // Delay 2 detik biar user sempat baca DM
    setTimeout(async () => {
      try {
        const member = message.guild.members.cache.get(message.author.id);
        if (member && member.kickable) {
          await member.kick(reason);
          console.log(
            `[AutoKick] ${message.author.tag} dikick. Alasan: ${reason}`,
          );
        }
      } catch (e) {
        console.error("Gagal auto-kick:", e);
      }
    }, 2000);
  } catch (e) {
    console.error("Gagal proses kick:", e);
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
    // CEK MENTION BOT - Semua command via chat natural
    // =====================================================
    const botMentioned = message.mentions.has(client.user);
    if (botMentioned) {
      // Helper: hapus pesan user + kirim konfirmasi yang auto-delete
      const autoReply = async (text) => {
        await message.delete().catch(() => {});
        const reply = await message.channel.send(
          `<@${message.author.id}> ${text}`,
        );
        setTimeout(() => reply.delete().catch(() => {}), 5000);
      };
      // === GABUNG KE VOICE CHANNEL ===
      if (/(sini|gabung|masuk|join|ke sini|kemari)/i.test(contentLower)) {
        const vc = message.member.voice.channel;
        if (!vc) return autoReply("kamu harus masuk voice channel dulu bro");
        const botVc = message.guild.members.me.voice.channel;
        if (botVc && botVc.id === vc.id)
          return autoReply(`Halo aku udah di voice nih kak **${vc.name}**`);
        joinVoiceChannel({
          channelId: vc.id,
          guildId: message.guild.id,
          adapterCreator: message.guild.voiceAdapterCreator,
          selfDeaf: false,
        });
        return autoReply(`sip gue gabung ke **${vc.name}** 🎙️`);
      }

      // === PUTAR MUSIK ===
      if (/(putar|play|musik|lagu|cari)/i.test(contentLower)) {
        const vc = message.member.voice.channel;
        if (!vc)
          return message.reply(
            "Kak masuk voice channel dulu ya kalau mau putar lagu :)",
          );
        let query = message.content
          .replace(/<@!?\d+>/g, "")
          .replace(/\*\*|__|\*|_/g, "")
          .trim();

        // Ekstrak bagian setelah command keyword
        const commandMatch = query.match(
          /(putar|play|musik|lagu|cari)\s+(.+)/i,
        );
        if (commandMatch) {
          query = commandMatch[2].trim();
        } else {
          query = query.replace(/(putar|play|musik|lagu|cari)/i, "").trim();
        }

        // Clean mention format apapun
        query = query.replace(/@[\w\-\s.#]+/g, "").trim();

        // Strip query parameters dari URL jika ada
        if (query.includes("://") && !query.includes("youtube.com/watch")) {
          query = query.split("?si=")[0].trim();
          query = query.split("&si=")[0].trim();
        }

        if (!query)
          return message.reply(
            "Kak mau putar lagu apa? kaya: `tag aku putar Hindia`",
          );
        try {
          const res = await client.player.play(vc, query, {
            nodeOptions: {
              leaveOnEmpty: false,
              leaveOnEnd: false,
              leaveOnStop: false,
              metadata: message,
            },
          });
          return message.reply(`Aku nyanyi ya kak **${res.track.title}** 🎵`);
        } catch (e) {
          return message.reply(
            `Kak kaynaya aku gak bisa nyanyiin itu deh: ${e.message}`,
          );
        }
      }

      // === STOP MUSIK ===
      if (/(stop|berhenti|cabut|udahan)/i.test(contentLower)) {
        const queue = useQueue(message.guild.id);
        if (!queue || !queue.isPlaying())
          return message.reply(
            "Kak gak bisa stop lagu kalau gak ada yang diputar :)",
          );
        queue.tracks.clear();
        queue.node.stop();
        return message.reply(
          "Aku berhenti nyanyi nih kak ?, Suara ku gak enak ya ?",
        );
      }

      // === SKIP LAGU ===
      if (/(skip|lewatin|next|lanjut)/i.test(contentLower)) {
        const queue = useQueue(message.guild.id);
        if (!queue || !queue.isPlaying())
          return message.reply(
            "Kak gak bisa skip lagu kalau gak ada yang diputar :)",
          );
        queue.node.skip();
        return message.reply(
          "Ok kak aku skip lagunya, semoga lagunya sama suara ku cocok sama selera kakak ya :)",
        );
      }

      // === PAUSE ===
      if (/(pause|tahan|jeda)/i.test(contentLower)) {
        const queue = useQueue(message.guild.id);
        if (!queue || !queue.isPlaying())
          return message.reply(
            "Kak gak bisa pause lagu kalau gak ada yang diputar :)",
          );
        if (queue.node.isPaused())
          return message.reply(
            "yaudah aku berhenti nyanyi dulu ya kak, jangan lama lama nanti gak asik :D",
          );
        queue.node.pause();
        return message.reply(
          "aku berhenti nyanyi dulu ya kak, kalau mau denger lagi tinggal bilang lanjut :)",
        );
      }

      // === RESUME ===
      if (/(resume|lanjutin|terusin|lanjutkan)/i.test(contentLower)) {
        const queue = useQueue(message.guild.id);
        if (!queue) return message.reply("Kak belum reuest lagu ke aku");
        if (!queue.node.isPaused())
          return message.reply(
            "aku kan udah nyanyi, gak perlu dilanjutkan lagi :D",
          );
        queue.node.resume();
        return message.reply("Ok aku lanjut nyanyi ya kak :)");
      }

      // === VOLUME ===
      const volMatch = contentLower.match(/volume\s*(\d+)/);
      if (volMatch) {
        const queue = useQueue(message.guild.id);
        if (!queue || !queue.isPlaying())
          return message.reply("Kak gak ada lagu yang lagi diputar :)");
        const vol = Math.min(100, Math.max(1, parseInt(volMatch[1])));
        queue.node.setVolume(vol);
        const emoji = vol > 66 ? "🔊" : vol > 33 ? "🔉" : "🔈";
        return message.reply(`${emoji} Ok suara ku sekarang **${vol}%**`);
      }

      // === ANTRIAN / QUEUE ===
      if (/(antrian|queue|list lagu|daftar lagu)/i.test(contentLower)) {
        const queue = useQueue(message.guild.id);
        if (!queue || !queue.isPlaying())
          return message.reply("Kak gak ada lagu yang lagi aku nyanyiin :)");
        const tracks = queue.tracks.toArray();
        const cur = queue.currentTrack;
        const list =
          tracks.length > 0
            ? tracks
                .slice(0, 10)
                .map((t, i) => `\`${i + 1}.\` **${t.title}**`)
                .join("\n")
            : "*tidak ada antrian*";
        return message.reply(
          `🎵 **Sekarang:** ${cur.title}\n\n📋 **Antrian:**\n${list}`,
        );
      }

      // === NOWPLAYING ===
      if (
        /(lagu apa|lagi play|putar apa|nowplaying|sekarang)/i.test(contentLower)
      ) {
        const queue = useQueue(message.guild.id);
        if (!queue || !queue.isPlaying())
          return message.reply("Kak gak ada lagu yang lagi aku nyanyiin :)");
        const track = queue.currentTrack;
        return message.reply(
          `🎵 Lagi putar: **${track.title}** - ${track.author} (${track.duration})`,
        );
      }

      // === LOOP ===
      if (/(loop|ulangin|repeat)/i.test(contentLower)) {
        const queue = useQueue(message.guild.id);
        if (!queue || !queue.isPlaying())
          return message.reply("Kak gak ada lagu yang lagi aku nyanyiin :)");
        if (queue.repeatMode === QueueRepeatMode.OFF) {
          queue.setRepeatMode(QueueRepeatMode.TRACK);
          return message.reply("Aku nyanyiin terus ya kak! (loop 1 lagu)");
        } else if (queue.repeatMode === QueueRepeatMode.TRACK) {
          queue.setRepeatMode(QueueRepeatMode.QUEUE);
          return message.reply(
            "Aku nyanyiin terus semua lagu yang ada di antrian ya kak! (loop antrian)",
          );
        } else {
          queue.setRepeatMode(QueueRepeatMode.OFF);
          return message.reply("Oke kak aku gak nyanyiin ulang lagi ya :)");
        }
      }

      // === LIRIK ===
      if (/(lirik|lyrics|kata-kata)/i.test(contentLower)) {
        const queue = useQueue(message.guild.id);
        if (!queue || !queue.isPlaying()) {
          return message.reply(
            "Kak gak ada lagu yang diputar untuk cari lirik ",
          );
        }
        const track = queue.currentTrack;
        return message.reply(
          `Untuk lirik lagu **${track.title}**, gunakan command /lirik ya kak! (atau mention aku dengan 'lirik')`,
        );
      }

      // === SEARCH LAGU ===
      if (/(cari|search|nyari)/i.test(contentLower)) {
        const vc = message.member.voice.channel;
        if (!vc) {
          return message.reply("Kak masuk voice channel dulu ya!");
        }
        const query = message.content
          .replace(/<@!?\d+>/g, "")
          .replace(/(cari|search|nyari)/i, "")
          .trim();
        if (!query) {
          return message.reply(
            "Mau cari lagu apa kak? Contoh: `tag aku cari Kaela`",
          );
        }
        return message.reply(
          `Untuk cari lagu dengan dropdown, gunakan command /cari ${query} ya kak! 🎵`,
        );
      }

      // === KICK USER ===
      if (/(kick|keluarin|usir)/i.test(contentLower)) {
        if (
          !message.member.permissions.has(PermissionsBitField.Flags.KickMembers)
        )
          return autoReply("kamu ga punya izin kick member bro");
        const target = message.mentions.members
          .filter((m) => !m.user.bot && m.id !== message.author.id)
          .first();
        if (!target) return autoReply("kak tag dulu siapa yang mau dikick");
        if (!target.kickable)
          return autoReply(
            "Aku gak bisa kick dia kak dia developer ku, Aku takut sama dia",
          );
        await target.kick("dia nakal ya ?");
        return autoReply(
          `sip **${target.user.username}** udah dikick ya kak :)`,
        );
      }

      // === HAPUS PESAN / CLEAR ===
      const hapusMatch = contentLower.match(/(hapus|clear|bersihkan)\s*(\d+)/);
      if (hapusMatch) {
        if (
          !message.member.permissions.has(
            PermissionsBitField.Flags.ManageMessages,
          )
        )
          return autoReply(
            "Kakak gak dikasih izin developer nih buat hapus pesan :D",
          );
        const amount = Math.min(100, parseInt(hapusMatch[2]));
        await message.channel.bulkDelete(amount + 1, true).catch(() => {});
        const notif = await message.channel.send(
          `sip ${amount} udah aku hapus ya kak :)`,
        );
        setTimeout(() => notif.delete().catch(() => {}), 3000);
        return;
      }

      // === AJAK MAIN ===
      if (/(ajakin|ajak|nyariin|nyari|panggilin|panggil)/i.test(contentLower)) {
        const targetUser = message.mentions.users.filter((u) => !u.bot).first();
        if (!targetUser)
          return autoReply("di tag temen ya kak kalau ingin ngajak main :)");
        const mainIndex = contentLower.indexOf("ayo main");
        const gameName =
          mainIndex !== -1
            ? message.content
                .slice(mainIndex + 8)
                .replace(/<[^>]+>/g, "")
                .trim()
            : "game";
        try {
          await targetUser.send(
            `**${message.author.username}** dari server **${message.guild.name}** Dicariin buat main bareng nih kak **${gameName || "game"}**!`,
          );
          return autoReply(
            `Ok kak sudah aku dm ya **${targetUser.username}** buat diajak main **${gameName || "game"}** Semoga Happy Terus Ya main gamenya! :)`,
          );
        } catch (err) {
          return autoReply(
            err.code === 50007
              ? `gagal DM **${targetUser.username}**, DM-nya dikunci`
              : "ada error nih, coba lagi",
          );
        }
      }

      // === DM TEMAN ===
      if (/(dm|kirimin pesan|kasih tau|pesan ke|pm)/i.test(contentLower)) {
        const targetUser = message.mentions.users
          .filter((u) => !u.bot && u.id !== message.author.id)
          .first();
        if (!targetUser)
          return autoReply(
            "Kak di tag dulu ya temennya kalau mau dikirimin pesan :)",
          );

        // Ambil isi pesan (buang semua mention dan keyword)
        const pesanDM = message.content
          .replace(/<@!?\d+>/g, "") // buang semua mention
          .replace(
            /(dm|kirimin pesan|kasih tau|pesan ke|pm)\s*(ke|si|buat)?/gi,
            "",
          ) // buang keyword dan kata sambung
          .trim();

        if (!pesanDM) return autoReply("Isi pesannya apa kak, kaya 'lope yu'?");

        try {
          await targetUser.send(
            `Kak kamu dapat pesan nih dari **${message.author.username}** (Server: **${message.guild.name}**):\n\n${pesanDM}`,
          );
          return autoReply(
            `Aku udah kirim ya kak pesan nya **${targetUser.username}**!`,
          );
        } catch (err) {
          return autoReply(
            err.code === 50007
              ? `❌ gagal DM **${targetUser.username}**, DM-nya dikunci nih`
              : "ada error, coba lagi kak",
          );
        }
      }

      // === PRIVATE VOICE CHANNEL ===
      if (
        /(private|room|kamar|vc privat|private room|private vc|ruangan)/i.test(
          contentLower,
        )
      ) {
        const requester = message.member;
        const invitedMembers = message.mentions.members.filter(
          (m) => !m.user.bot && m.id !== message.author.id,
        );

        const permissionOverwrites = [
          {
            id: message.guild.id,
            deny: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.Connect,
            ],
          },
          {
            id: message.guild.members.me.id,
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
          permissionOverwrites.push({
            id: member.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.Connect,
              PermissionsBitField.Flags.Speak,
            ],
          });
        });

        let customName = message.content
          .replace(/<@!?\d+>/g, "") // buang semua mention
          .replace(
            /(buat|bikin|private|room|kamar|vc privat|private room|private vc|ruangan)/gi,
            "",
          ) // buang kata kunci
          .trim();

        if (!customName) {
          customName = `ini room kakak-${requester.user.username}`;
        }

        try {
          const privateChannel = await message.guild.channels.create({
            name: `${customName}`,
            type: ChannelType.GuildVoice,
            parent: requester.voice.channel?.parentId || null,
            permissionOverwrites,
            userLimit: 1 + invitedMembers.size,
            reason: "Room dibuat admin",
          });

          voiceStateEvent.getPrivateChannels().set(privateChannel.id, {
            ownerId: requester.id,
            createdAt: Date.now(),
          });

          if (requester.voice.channel) {
            await requester.voice.setChannel(privateChannel).catch(() => {});
          }

          let inviteUrl = "";
          try {
            const invite = await privateChannel.createInvite({
              maxAge: 0, // Tidak expired sampai channel terhapus
              maxUses: 0, // Unlimited atau bisa sesuai jumlah yg diinvite
            });
            inviteUrl = invite.url;
          } catch (err) {
            console.error("gagal buat invite link kak maaf:", err.message);
          }

          const inviteNames = [];
          for (const [, member] of invitedMembers) {
            inviteNames.push(member.user.username);
            try {
              const msgLink = inviteUrl
                ? `\n\nKlik link ini ya kak untuk masuk roomnya: ${inviteUrl}`
                : "";
              await member.send(
                `**${message.author.username}** kak kamu diundang ke private room di server **${message.guild.name}**!\nMasuk ke sini ya kak: **${privateChannel.name}**${msgLink}`,
              );
            } catch {}
          }

          const siapa =
            inviteNames.length > 0
              ? `bersama ${inviteNames.join(", ")}`
              : "tanpa undangan tambahan";
          return autoReply(
            `private room **${privateChannel.name}** udah dibuat ya kak ${siapa} langsung masuk aja.`,
          );
        } catch (err) {
          console.error(
            "[PrivateVC] duhh gagal buat private room kak maaf, coba lagi ya:",
            err.message,
          );
          return autoReply(
            "aduh kak gagal buat private room, coba lagi ya :) atau chatt developer kalau error terus :D",
          );
        }
      }

      // Jika tidak ada keyword yang cocok
      return autoReply(
        "Hmmm kakak mau aku ngapain ya? aku bisa diajak main, putar musik, buat private room, atau kamu bisa minta tolong ke aku dengan chat natural kaya 'tag aku putar Hindia' atau 'tag aku buat private room sama @temen' :)",
      );
    }

    const isPhishing = phishingPatterns.some((pattern) =>
      pattern.test(message.content),
    );

    if (isPhishing) {
      // Hapus pesan phishing
      await message.delete().catch((err) => {
        if (err.code === 10008) return; // pesan sudah dihapus
        if (err.code === 50013)
          return console.error(
            "Developer ini phising gabisa hapus nih bagaimana si sebell!!!",
          );
        console.error("[Phishing] Gagal hapus pesan:", err.message);
      });

      // Kirim embed peringatan phishing di channel
      const phishEmbed = new EmbedBuilder()
        .setColor(0x8b0000) // Merah gelap
        .setTitle("Kakak semua hati hati ada phising !!!")
        .setDescription(
          `<@${message.author.id}> kakak gaboleh ngirim link phising atau scam di server ya kak, kamu aku kick ya :)`,
        )
        .addFields(
          {
            name: "Jenis Pelanggaran",
            value: "Phishing / Link Scam",
            inline: true,
          },
          { name: "Tindakan", value: "Kick Otomatis", inline: true },
        )
        .setThumbnail(message.author.displayAvatarURL())
        .setFooter({ text: "Kakak Semua Jangan Klik Link Sembarang ya" })
        .setTimestamp();

      const phishMsg = await message.channel.send({ embeds: [phishEmbed] });

      // Hapus pesan peringatan phishing setelah 15 detik
      setTimeout(() => phishMsg.delete().catch(() => {}), 15000);

      // Langsung kick
      await kickUser(
        message,
        "Mengirim konten phishing/scam di server",
        "Aku Kick ya kak karena kamu ngirim konten phising atau scam di server, hati hati ya jangan sampai kejadian lagi, semoga kamu bisa belajar dari kesalahan ini :)",
      );

      return; // Berhenti, tidak perlu cek badword lagi
    }

    const foundWord = badWords.find((word) => contentLower.includes(word));

    if (foundWord) {
      try {
        const botMember = message.guild.members.me;
        const hasPermission = message.channel
          .permissionsFor(botMember)
          .has("ManageMessages");

        if (!hasPermission) {
          console.error(
            `[BadWord] duhh kakak developer ada yang ngomong kasar nih gabisa aku hapus #${message.channel.name}!.`,
          );
        } else {
          // Hapus pesan kata kasar
          await message.delete().catch((err) => {
            if (err.code === 10008) return; // pesan sudah dihapus lebih dulu
            console.error(
              "[BadWord] Gagal hapus pesan (code " + err.code + "):",
              err.message,
            );
          });
          console.log(
            `[BadWord] Pesan dari kakak ini ${message.author.tag} dihapus. Kata: "${foundWord}"`,
          );
        }
        // Tambah hitungan peringatan
        const userId = message.author.id;
        const currentWarnings = (warningCount.get(userId) || 0) + 1;
        warningCount.set(userId, currentWarnings);

        // Tentukan warna dan pesan berdasarkan jumlah pelanggaran
        let color, title, description;

        if (currentWarnings >= 3) {
          color = 0xff0000;
          title = "Udah kak jangan ngomong kasar terus !!";
          description = `Kakak ini udah yang **${currentWarnings}** kali ya ngomong kasarnya !!`;
        } else if (currentWarnings === 2) {
          color = 0xff8c00;
          title = "kak jangan gitu dong";
          description = `Kakak ini udah yang **${currentWarnings}** kali ya ngomong kasarnya !!`;
        } else {
          color = 0xffd700;
          title = "Kak jangan gomong gitu ya";
          description = `Kakak baik jangan kaya gitu ya `;
        }

        // Kirim peringatan (teks biasa)
        const warningMessage = await message.channel.send(
          `**${title}**\n<@${message.author.id}>, ${description} (Pelanggaran ke-${currentWarnings})`,
        );

        // Hapus pesan peringatan setelah 8 detik
        setTimeout(() => {
          warningMessage.delete().catch(() => {});
        }, 8000);
      } catch (error) {
        console.error("Gagal memproses pesan kata kasar:", error);
      }
    }
  },
};
