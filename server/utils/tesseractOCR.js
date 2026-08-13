const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Perform OCR on an image file using local Tesseract installation.
 * @param {string} filePath - Absolute path to the image file.
 * @returns {Promise<string>} - Extracted text.
 */
function extractTextFromImage(filePath) {
  return new Promise((resolve, reject) => {
    const tesseractPath = process.env.TESSERACT_PATH || 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe';
    
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`Image file not found at path: ${filePath}`));
    }
    
    if (!fs.existsSync(tesseractPath)) {
      console.warn(`Tesseract OCR not found at ${tesseractPath}. Check path configuration.`);
      return reject(new Error('Tesseract OCR engine is not installed or path is incorrect. Please install Tesseract OCR.'));
    }

    // Execute Tesseract: tesseract <image_path> stdout
    // We pass stdout as the output file so it returns text directly
    execFile(tesseractPath, [filePath, 'stdout'], (error, stdout, stderr) => {
      if (error) {
        console.error('Tesseract OCR error:', error);
        return reject(new Error(`Tesseract OCR failed: ${error.message}`));
      }
      resolve(stdout.trim());
    });
  });
}

module.exports = {
  extractTextFromImage
};
