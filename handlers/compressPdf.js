// handlers/compressPdf.js
const fs = require("fs-extra");
const { PDFDocument } = require("pdf-lib");
const path = require("path");
const os = require("os");

async function compressPdf(filePath) {
  if (!fs.existsSync(filePath)) throw new Error("PDF not found.");

  const pdfBytes = await fs.readFile(filePath);
  const pdf = await PDFDocument.load(pdfBytes);
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(pdf, pdf.getPageIndices());
  pages.forEach((page) => newPdf.addPage(page));

  const outPath = path.join(os.tmpdir(), `compressed_${Date.now()}.pdf`);
  const compressedBytes = await newPdf.save({ useObjectStreams: false }); // smaller file
  await fs.writeFile(outPath, compressedBytes);

  return outPath;
}

module.exports = compressPdf;
