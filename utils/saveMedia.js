// utils/saveMedia.js
const fs = require("fs");
const path = require("path");

async function saveIncomingMediaToTemp(msg, extension) {
  try {
    const media = await msg.downloadMedia();
    if (!media) return null;

    // Create temp folder if not exists
    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Unique filename
    const filePath = path.join(tempDir, `${Date.now()}${extension}`);

    // Convert base64 to buffer and save
    fs.writeFileSync(filePath, Buffer.from(media.data, "base64"));
    return filePath;
  } catch (err) {
    console.error("❌ Error saving media:", err);
    return null;
  }
}

module.exports = saveIncomingMediaToTemp;
