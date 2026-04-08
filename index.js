require("dotenv").config();
// Paksa discord-player menggunakan module 'youtube-ext' atau 'play-dl' karena YoutubeJS/ytdl-core sedang usang/diblokir (mengatasi bug 'berhasil mencari tetapi tidak ada suaranya').
process.env.DP_FORCE_YTDL_MOD = "youtube-ext";

const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
} = require("discord.js");
const { Player } = require("discord-player");

// Inisialisasi Klien Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Setup Koleksi untuk Commands
client.commands = new Collection();

// Setup Discord-Player untuk Musik
client.player = new Player(client, {
  skipFFmpeg: false,
  connectionTimeout: 60000, // Timeout koneksi 60 detik (default 20 detik)
  defaultNodeOptions: {
    leaveOnEmpty: false,
    leaveOnEmptyCooldown: 0,
    leaveOnEnd: false,
    leaveOnEndCooldown: 0,
    leaveOnStop: false,
    leaveOnStopCooldown: 0,
    connectionTimeout: 60000, // Timeout per node
    selfDeaf: true,
    fetchBeforeQueued: true,
  },
  frequencyError: 100, // Retry jika audio error
  retryTime: 3000,
});

// Wajib: tambahkan error event listener agar tidak crash
client.player.events.on("error", (queue, error) => {
  console.error(
    `[Player Error] Server: ${queue.guild.name} | Error: ${error.message}`,
  );
});

client.player.events.on("playerError", (queue, error) => {
  console.error(
    `[Player Error] Gagal memutar lagu di ${queue.guild.name}: ${error.message}`,
  );
});

// Mengekstrak metadata Youtube dsb
(async () => {
  try {
    const { DefaultExtractors } = require("@discord-player/extractor");

    try {
      // YouTube extractor bawaan default (akan otomatis bridge ke youtube-ext/play-dl)
      const { YoutubeExtractor } = require("discord-player-youtube");
      await client.player.extractors.register(YoutubeExtractor, {});
      console.log("[Musik] YoutubeExtractor berhasil dimuat.");
    } catch (err) {
      console.warn("[Musik] YoutubeExtractor gagal dimuat:");
    }

    // Load semua default extractors (YouTube, Spotify, SoundCloud, dll)
    await client.player.extractors.loadMulti(DefaultExtractors);

    // Setup Spotify credentials jika tersedia
    if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
      try {
        const spotifyExtractor =
          client.player.extractors.get("SpotifyExtractor");
        if (spotifyExtractor) {
          spotifyExtractor.setCredentials({
            clientID: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
          });
          console.log("[Spotify] Credentials berhasil di-setup.");
        }
      } catch (err) {
        console.warn("[Spotify] Gagal setup credentials:", err.message);
      }
    }

    console.log("[Musik] Extractor berhasil dimuat.");
    console.log(
      "[Musik] Supported sources: YouTube, Spotify, SoundCloud, Apple Music, dan lebih banyak",
    );
  } catch (e) {
    console.warn("[Musik] Gagal memuat extractor:", e.message);
  }
})();

// === COMMAND HANDLER ===
const foldersPath = path.join(__dirname, "commands");
// Buat folder jika belum ada (hanya untuk memastikan agar tak error saat startup jika kosong)
if (!fs.existsSync(foldersPath)) fs.mkdirSync(foldersPath);

const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] Command di ${filePath} kehilangan property "data" atau "execute".`,
      );
    }
  }
}

// === EVENT HANDLER ===
const eventsPath = path.join(__dirname, "events");
if (!fs.existsSync(eventsPath)) fs.mkdirSync(eventsPath);
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// Event handler interaction akan dihandel oleh events/interactionCreate.js

client.login(process.env.DISCORD_TOKEN);
