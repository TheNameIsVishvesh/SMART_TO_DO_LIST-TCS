const PDFDocument = require('pdfkit');

/**
 * Creates a valid PDF buffer with given text for testing.
 * @param {string} text
 * @returns {Promise<Buffer>}
 */
const createTestPdfBuffer = (text) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(16).text(text, 100, 100);
    doc.end();
  });
};

module.exports = {
  createTestPdfBuffer
};
