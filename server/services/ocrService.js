const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Resolves the Tesseract OCR executable path from environment or common installation locations.
 */
const getTesseractPath = () => {
  if (process.env.TESSERACT_PATH && fs.existsSync(process.env.TESSERACT_PATH)) {
    return process.env.TESSERACT_PATH;
  }

  // Common Windows installation paths
  const commonPaths = [
    'C:\\Program Files\\Tesseract-OCR\\tesseract.exe',
    'C:\\Program Files (x86)\\Tesseract-OCR\\tesseract.exe',
    `${process.env.LOCALAPPDATA || ''}\\Programs\\Tesseract-OCR\\tesseract.exe`
  ];

  for (const p of commonPaths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }

  // Fallback to system PATH binary
  return 'tesseract';
};

/**
 * Performs OCR on an image file (PNG, JPG, JPEG) using local Tesseract executable.
 * @param {string} imagePath - Path to the image file on disk.
 * @param {object} options - Optional parameters (e.g. language).
 * @returns {Promise<{ extractedText: string }>}
 */
const extractTextFromImage = (imagePath, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!imagePath || !fs.existsSync(imagePath)) {
      return reject(new Error('Image file does not exist on disk.'));
    }

    const tesseractPath = getTesseractPath();
    const lang = options.lang || 'eng';
    
    // Arguments: input_file, output_base ('stdout' streams text to stdout), -l language
    const args = [imagePath, 'stdout', '-l', lang, '--psm', '3'];

    execFile(tesseractPath, args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        // If tesseract binary not found
        if (error.code === 'ENOENT') {
          return reject(new Error(`Tesseract executable not found at '${tesseractPath}'. Please configure TESSERACT_PATH in .env.`));
        }
        return reject(new Error(`Tesseract OCR processing failed: ${error.message} ${stderr || ''}`));
      }

      const text = (stdout || '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      if (!text || text.length === 0) {
        return resolve({
          extractedText: '',
          warning: 'OCR completed but no readable text was detected in the image.'
        });
      }

      resolve({
        extractedText: text
      });
    });
  });
};

module.exports = {
  extractTextFromImage,
  getTesseractPath
};
