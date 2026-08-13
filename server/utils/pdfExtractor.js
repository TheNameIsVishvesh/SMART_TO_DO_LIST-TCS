const fs = require('fs');
const { extractText } = require('unpdf');

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
    if (dataBuffer.length === 0) {
      throw new Error('PDF file is empty (0 bytes).');
    }

    const uint8Array = new Uint8Array(dataBuffer);
    const { text } = await extractText(uint8Array);

    let rawText = '';
    if (Array.isArray(text)) {
      rawText = text.join('\n\n');
    } else if (typeof text === 'string') {
      rawText = text;
    }

    return rawText.trim();
  } catch (err) {
    console.error('PDF text extraction error:', err);
    throw new Error(`PDF extraction failed: ${err.message}`);
  }
}

module.exports = {
  extractTextFromPDF
};

