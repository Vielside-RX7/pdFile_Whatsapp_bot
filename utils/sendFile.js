// utils/sendFile.js
const { MessageMedia } = require("whatsapp-web.js");
const fs = require("fs");

async function sendFile(client, chatId, filePath) {
  try {
    const media = MessageMedia.fromFilePath(filePath);
    await client.sendMessage(chatId, media);
  } catch (err) {
    console.error("❌ Error sending file:", err);
  }
}

module.exports = sendFile;
