const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Bot berhasil terhubung dan siap! Login sebagai ${client.user.tag}`);
        client.user.setActivity('Menjaga server...', { type: 3 }); // type 3 = Watching / Menonton
    },
};
