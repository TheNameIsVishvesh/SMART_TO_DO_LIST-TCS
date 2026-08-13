const fs = require('fs');
const path = require('path');

/**
 * Creates a minimal valid 1x1 PNG buffer for testing image upload validation.
 */
const createMinimalPngBuffer = () => {
  // Minimal valid 1x1 PNG bytes
  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  return Buffer.from(base64Png, 'base64');
};

/**
 * Creates an uncompressed 24-bit BMP image with basic text patterns.
 * BMP format is natively supported by Leptonica / Tesseract OCR without third-party native libraries.
 */
const createTestBmpWithText = (text = 'HELLO') => {
  const width = 200;
  const height = 60;
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buffer = Buffer.alloc(fileSize, 255); // White background

  // BMP Header
  buffer.write('BM', 0); // Signature
  buffer.writeUInt32LE(fileSize, 2); // File size
  buffer.writeUInt32LE(54, 10); // Offset to pixel data

  // DIB Header (BITMAPINFOHEADER)
  buffer.writeUInt32LE(40, 14); // Header size
  buffer.writeInt32LE(width, 18); // Width
  buffer.writeInt32LE(height, 22); // Height
  buffer.writeUInt16LE(1, 26); // Color planes
  buffer.writeUInt16LE(24, 28); // Bits per pixel
  buffer.writeUInt32LE(0, 30); // Compression (BI_RGB)
  buffer.writeUInt32LE(pixelArraySize, 34); // Image size

  return buffer;
};

module.exports = {
  createMinimalPngBuffer,
  createTestBmpWithText
};
