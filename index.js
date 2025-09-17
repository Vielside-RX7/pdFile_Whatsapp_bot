// index.js
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

// Utils
const saveIncomingMediaToTemp = require("./utils/saveMedia");
const sendFile = require("./utils/sendFile");

// Handlers
const mergePdfs = require("./handlers/mergePdfs");
const splitPdf = require("./handlers/splitPdf");
const compressPdf = require("./handlers/compressPdf");
const pdfToImages = require("./handlers/pdfToImages");
const imagesToPdf = require("./handlers/imagesToPdf");

// Store sessions for multi-step commands
const sessions = {};

// Create WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] },
});

// Show QR for login
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("📲 Scan this QR code with WhatsApp (Linked Devices).");
});

client.on("authenticated", () => console.log("🔑 Authenticated successfully!"));
client.on("auth_failure", (msg) => console.error("❌ Auth failure:", msg));
client.on("ready", () => console.log("✅ Bot is ready!"));
client.on("disconnected", (reason) => console.log("⚠️ Disconnected:", reason));

// Handle incoming messages
client.on("message", async (msg) => {
  const chatId = msg.from;
  const text = msg.body?.toLowerCase()?.trim() || "";

  try {
    // === HELP ===
    if (text === "pdf") {
      return client.sendMessage(
        chatId,
        `🤖 *PDF Bot Commands:*\n\n` +
          `📸 *img2pdf* → Convert multiple images into a single PDF\n` +
          `📄 *merge* → Merge multiple PDFs into one\n` +
          `✂️ *split* → Split a PDF into individual pages\n` +
          `🗜️ *compress* → Compress a PDF file\n` +
          `🖼️ *pdf2img* → Convert PDF pages into images\n\n` +
          `👉 Example: Send "merge", then upload PDFs one by one, type "done" when finished.`
      );
    }

    // === START SESSIONS ===
    if (["img2pdf", "merge"].includes(text)) {
      sessions[chatId] = { command: text, files: [] };
      const msgText =
        text === "img2pdf"
          ? "📸 Send me images one by one. Type 'done' when finished."
          : "📄 Send PDFs one by one. Type 'done' when finished.";
      return client.sendMessage(chatId, msgText);
    }

    // === HANDLE SESSION UPLOADS ===
    const session = sessions[chatId];
    if (session) {
      if (text === "done") {
        if (!session.files.length) {
          await client.sendMessage(chatId, "⚠️ No files received. Session cancelled.");
        } else {
          let outFile;
          if (session.command === "img2pdf") {
            outFile = await imagesToPdf(session.files);
          } else if (session.command === "merge") {
            if (session.files.length < 2) {
              return client.sendMessage(chatId, "⚠️ Need at least 2 PDFs to merge.");
            }
            outFile = await mergePdfs(session.files);
          }

          if (outFile) await sendFile(client, chatId, outFile);
        }
        delete sessions[chatId];
        return;
      }

      // Save uploaded media
      if (msg.hasMedia) {
        let ext = ".tmp";
        if (session.command === "img2pdf" && msg.type === "image") ext = ".jpg";
        if (session.command === "merge" && msg.type === "document") ext = ".pdf";
        const filePath = await saveIncomingMediaToTemp(msg, ext);
        if (filePath) {
          session.files.push(filePath);
          const confirmText =
            session.command === "img2pdf"
              ? "✅ Image added. Send more or type 'done'."
              : "📥 PDF added. Send more or type 'done'.";
          await client.sendMessage(chatId, confirmText);
        }
        return;
      }
    }

    // === ONE-SHOT COMMANDS ON PDF ===
    if (msg.hasMedia && msg.type === "document" && msg._data.mimetype === "application/pdf") {
      const pdfPath = await saveIncomingMediaToTemp(msg, ".pdf");

      if (text.includes("split")) {
        const splitFiles = await splitPdf(pdfPath);
        for (const f of splitFiles) await sendFile(client, chatId, f);
        return;
      }

      if (text.includes("compress")) {
        const compressed = await compressPdf(pdfPath);
        await sendFile(client, chatId, compressed);
        return;
      }

      if (text.includes("pdf2img")) {
        const images = await pdfToImages(pdfPath);
        for (const img of images) await sendFile(client, chatId, img);
        return;
      }
    }

  } catch (err) {
    console.error("❌ Error handling message:", err);
    await client.sendMessage(chatId, "⚠️ Something went wrong. Please try again.");
  }
});

// Start the bot
client.initialize();
