const express = require('express');
const router = express.Router();
const { handleSingleUpload } = require('../middleware/uploadMiddleware');
const {
  importCSV,
  importPDF,
  importImage,
  extractTasks,
  reviewTasks
} = require('../controllers/importController');

// 1. CSV Import (Parses and validates, does not save to MongoDB)
router.post('/csv', handleSingleUpload('file'), importCSV);

// 2. PDF Text Extraction
router.post('/pdf', handleSingleUpload('file'), importPDF);

// 3. Image OCR Text Extraction (PNG, JPG, JPEG using local Tesseract)
router.post('/image', handleSingleUpload('file'), importImage);

// 4. AI Structured Task Extraction from Raw Text (using Gemma 3 4B via Ollama)
router.post('/extract-tasks', extractTasks);

// 5. Review & Approval Workflow (Only approved tasks are inserted into MongoDB; supports EDIT, APPROVE, REJECT)
router.post('/review', reviewTasks);
router.post('/approve', reviewTasks);

module.exports = router;
