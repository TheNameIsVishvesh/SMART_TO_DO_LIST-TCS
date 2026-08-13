const fs = require('fs');
const { extractText } = require('unpdf');

/**
 * Extracts and cleans text content from a PDF document.
 * @param {string} filePath - Absolute path to the temporary PDF file.
 * @returns {Promise<{ extractedText: string, pageCount: number, info: object }>}
 */
const extractTextFromPDF = async (filePath) => {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('PDF file does not exist on disk.');
  }

  const dataBuffer = fs.readFileSync(filePath);
  
  if (dataBuffer.length === 0) {
    throw new Error('PDF file is empty (0 bytes).');
  }

  try {
    const uint8Array = new Uint8Array(dataBuffer);
    const { text, totalPages, info } = await extractText(uint8Array);

    let rawText = '';
    if (Array.isArray(text)) {
      rawText = text.join('\n\n');
    } else if (typeof text === 'string') {
      rawText = text;
    }

    // Normalize text: clean whitespace, eliminate excessive blank lines
    let normalized = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!normalized || normalized.length === 0) {
      throw new Error('PDF does not contain any extractable text (it may be a scanned image only or empty).');
    }

    return {
      extractedText: normalized,
      pageCount: totalPages || 1,
      info: info || {}
    };
  } catch (err) {
    if (err.message && err.message.toLowerCase().includes('password')) {
      throw new Error('Password-protected PDF files cannot be processed.');
    }
    throw new Error(`PDF extraction failed: ${err.message}`);
  }
};

module.exports = {
  extractTextFromPDF
};
