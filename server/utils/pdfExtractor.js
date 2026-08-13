const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * Extracts text content from a PDF file buffer.
 * @param {string} filePath - Absolute path to the PDF file.
 * @returns {Promise<string>} - Extracted text.
 */
async function extractTextFromPDF(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file not found at path: ${filePath}`);
    }
    
    const dataBuffer = fs.readFileSync(filePath);
    const parsedData = await pdfParse(dataBuffer);
    return parsedData.text.trim();
  } catch (err) {
    console.error('PDF text extraction error:', err);
    throw new Error(`PDF extraction failed: ${err.message}`);
  }
}

module.exports = {
  extractTextFromPDF
};
