const fs = require('fs');
const csvParser = require('csv-parser');
const pdfExtractor = require('../utils/pdfExtractor');
const tesseractOCR = require('../utils/tesseractOCR');
const ollamaService = require('../services/ollamaService');
const taskRepository = require('../services/taskRepository');

const importController = {
  // POST /api/import/csv
  importCSV: async (req, res) => {
    try {
      if (!req.file || req.file.size === 0) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          error: 'No CSV file uploaded or file is empty',
          message: 'No CSV file uploaded or file is empty'
        });
      }

      const csvService = require('../services/csvService');
      const result = await csvService.parseCSVFile(req.file.path);
      
      // Cleanup temp file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        tasksCount: result.validCount,
        tasks: result.validRows,
        errors: result.invalidRows.map(r => `Row ${r.row}: ${r.errors.join(', ')}`),
        validRows: result.validRows,
        invalidRows: result.invalidRows
      });
    } catch (err) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: 'Failed to parse CSV file', message: err.message });
    }
  },


  // POST /api/import/pdf
  importPDF: async (req, res) => {
    try {
      if (!req.file || req.file.size === 0) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          error: 'No PDF file uploaded or file is empty',
          message: 'No PDF file uploaded or file is empty'
        });
      }

      console.log(`Extracting text from PDF: ${req.file.path}...`);
      const extractedText = await pdfExtractor.extractTextFromPDF(req.file.path);
      
      console.log('Sending extracted text to Ollama/fallback for task mapping...');
      const tasks = await ollamaService.analyzeTasksText(extractedText);
      
      // Clean up extracted tasks and format them
      const formattedTasks = tasks.map(task => ({
        ...task,
        source: 'pdf',
        extractedText: extractedText.substring(0, 1000) // Keep snippet of origin text
      }));

      // Cleanup file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        extractedTextLength: extractedText.length,
        extractedText: extractedText,
        tasks: formattedTasks
      });
    } catch (err) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(400).json({ error: 'Failed to process PDF', message: err.message });
    }
  },

  // POST /api/import/image
  importImage: async (req, res) => {
    try {
      if (!req.file || req.file.size === 0) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          error: 'No image file uploaded or file is empty',
          message: 'No image file uploaded or file is empty'
        });
      }

      console.log(`Performing OCR on image: ${req.file.path}...`);
      const extractedText = await tesseractOCR.extractTextFromImage(req.file.path);
      
      console.log('Sending OCR text to Ollama/fallback for task mapping...');
      const tasks = await ollamaService.analyzeTasksText(extractedText);

      const formattedTasks = tasks.map(task => ({
        ...task,
        source: 'image',
        extractedText: extractedText.substring(0, 1000)
      }));

      // Cleanup file
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        extractedTextLength: extractedText.length,
        extractedText: extractedText,
        tasks: formattedTasks
      });
    } catch (err) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(400).json({ error: 'Failed to process image OCR', message: err.message });
    }
  },

  // POST /api/import/confirm
  confirmImport: async (req, res) => {
    try {
      const { tasks } = req.body;
      if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ error: 'No tasks to import' });
      }

      const importedTasks = await taskRepository.insertMany(tasks);
      res.status(201).json({
        success: true,
        count: importedTasks.length,
        tasks: importedTasks
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to finalize import', message: err.message });
    }
  },

  // POST /api/import/extract-tasks
  extractTasks: async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'No text provided for extraction' });
      }
      const aiExtractionService = require('../services/aiExtractionService');
      const result = await aiExtractionService.extractTasksFromText(text);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to extract tasks', message: err.message });
    }
  },

  // POST /api/import/review
  reviewTasks: async (req, res) => {
    try {
      const { action, tasks } = req.body;
      if (!tasks || !Array.isArray(tasks)) {
        return res.status(400).json({ error: 'No tasks provided for review' });
      }

      if (action === 'APPROVE') {
        const importedTasks = await taskRepository.insertMany(tasks);
        return res.status(201).json({
          success: true,
          savedCount: importedTasks.length,
          tasks: importedTasks
        });
      } else if (action === 'REJECT') {
        return res.status(200).json({
          success: true,
          message: 'Tasks rejected and discarded successfully.'
        });
      } else {
        return res.status(400).json({ error: 'Invalid action. Must be APPROVE or REJECT.' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to process task review', message: err.message });
    }
  }
};

module.exports = importController;


