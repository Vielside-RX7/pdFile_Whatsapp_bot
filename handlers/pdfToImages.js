// handlers/pdfToImages.js
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const { fromPath } = require("pdf2pic");

async function pdfToImages(filePath) {
  if (!fs.existsSync(filePath)) throw new Error("PDF not found.");

  const images = [];
  const options = {
    density: 150,
    format: "png",
    width: 1240,
    height: 1754,
  };

  const storeAsImage = fromPath(filePath, options);
  const pdfData = await fs.readFile(filePath);
  const numPages = (await storeAsImage(1, { savePath: os.tmpdir() })).length || 1;

  for (let i = 1; i <= numPages; i++) {
    const imagePath = path.join(os.tmpdir(), `pdfpage_${i}_${Date.now()}.png`);
    await storeAsImage(i, { savePath: imagePath });
    images.push(imagePath);
  }

  return images;
}

module.exports = pdfToImages;
