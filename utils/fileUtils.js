const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

/**
 * Compress using Ghostscript (`gs`)
 * macOS: brew install ghostscript
 * Linux: apt-get install ghostscript
 */
function which(cmd) {
  return new Promise(resolve => {
    const ps = spawn(process.platform === 'win32' ? 'where' : 'which', [cmd]);
    ps.on('close', code => resolve(code === 0));
  });
}

module.exports = async function compressPdf(sourcePath) {
  const hasGS = await which('gs');
  if (!hasGS) throw new Error('Ghostscript not installed');

  const outPath = path.join(__dirname, `../tmp/compressed_${Date.now()}.pdf`);
  await fs.ensureDir(path.dirname(outPath));

  const args = [
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.5',
    '-dPDFSETTINGS=/ebook',   // /screen (smaller), /ebook (balanced), /printer (higher)
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    `-sOutputFile=${outPath}`,
    sourcePath,
  ];

  await new Promise((resolve, reject) => {
    const gs = spawn('gs', args);
    gs.on('error', reject);
    gs.on('close', code => (code === 0 ? resolve() : reject(new Error('gs failed'))));
  });

  return outPath;
};
