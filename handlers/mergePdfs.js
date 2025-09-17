// handlers/mergePdfs.js
const fs = require("fs-extra");
const { PDFDocument } = require("pdf-lib");
const path = require("path");
const os = require("os");

async function mergePdfs(filePaths = []) {
  if (!filePaths.length) throw new Error("No PDF files provided.");

  const mergedPdf = await PDFDocument.create();

  for (const pdfPath of filePaths) {
    if (!fs.existsSync(pdfPath)) continue;
    const pdfBytes = await fs.readFile(pdfPath);
    const pdf = await PDFDocument.load(pdfBytes);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    pages.forEach((page) => mergedPdf.addPage(page));
  }

  const outPath = path.join(os.tmpdir(), `merged_${Date.now()}.pdf`);
  const mergedBytes = await mergedPdf.save();
  await fs.writeFile(outPath, mergedBytes);

  return outPath;
}

module.exports = mergePdfs;
