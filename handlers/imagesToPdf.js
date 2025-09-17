// handlers/imagesToPdf.js
const fs = require("fs-extra");
const { PDFDocument } = require("pdf-lib");
const path = require("path");
const os = require("os");
const sharp = require("sharp");

async function imagesToPdf(filePaths = []) {
  if (!filePaths.length) throw new Error("No images provided.");

  const pdfDoc = await PDFDocument.create();

  for (const imgPath of filePaths) {
    if (!fs.existsSync(imgPath)) continue;
    const imgBytes = await fs.readFile(imgPath);
    const image = await sharp(imgBytes).png().toBuffer();

    const imgPdf = await pdfDoc.embedPng(image);
    const page = pdfDoc.addPage([imgPdf.width, imgPdf.height]);
    page.drawImage(imgPdf, { x: 0, y: 0, width: imgPdf.width, height: imgPdf.height });
  }

  const outPath = path.join(os.tmpdir(), `img2pdf_${Date.now()}.pdf`);
  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(outPath, pdfBytes);

  return outPath;
}

module.exports = imagesToPdf;
