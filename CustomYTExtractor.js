const { BaseExtractor } = require("discord-player");
const ytext = require("youtube-ext");

class CustomYTExtractor extends BaseExtractor {
    static identifier = "custom-yt-ext";
    
    async activate() {
        this.protocols = ["ytsearch", "youtube"];
    }

    async validate(query) {
        return query.includes("youtube.com/watch") || query.includes("youtu.be");
    }

    async getRelatedTracks(track) {
        return this.createResponse(null, []);
    }

    async handle(query, context) {
        try {
            const data = await ytext.videoInfo(query);
            if (!data) return this.createResponse(null, []);
            return this.createResponse(null, [{
                title: data.title,
                duration: data.duration.isCustom ? 0 : data.duration.lengthSec * 1000,
                thumbnail: data.thumbnail?.url,
                url: data.url,
                views: data.viewCount,
                author: data.channel?.name,
                description: data.description,
                source: "youtube"
            }]);
        } catch (e) {
            return this.createResponse(null, []);
        }
    }

    async stream(info) {
        // Find best audio format
       const data = await ytext.videoInfo(info.url);
       const formats = data.formats.filter(f => f.hasAudio && !f.hasVideo);
       const bestFormat = formats.sort((a,b) => b.audioBitrate - a.audioBitrate)[0] || data.formats.find(f => f.hasAudio);
       return bestFormat.url;
    }
}
module.exports = CustomYTExtractor;
