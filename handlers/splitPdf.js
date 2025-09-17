// handlers/splitPdf.js
const fs = require("fs-extra");
const { PDFDocument } = require("pdf-lib");
const path = require("path");
const os = require("os");

async function splitPdf(filePath) {
  if (!fs.existsSync(filePath)) throw new Error("PDF not found.");

  const pdfBytes = await fs.readFile(filePath);
  const pdf = await PDFDocument.load(pdfBytes);
  const splitFiles = [];

  for (let i = 0; i < pdf.getPageCount(); i++) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(pdf, [i]);
    newPdf.addPage(copiedPage);

    const outPath = path.join(os.tmpdir(), `split_${i + 1}_${Date.now()}.pdf`);
    const newPdfBytes = await newPdf.save();
    await fs.writeFile(outPath, newPdfBytes);
    splitFiles.push(outPath);
  }

  return splitFiles;
}

module.exports = splitPdf;
