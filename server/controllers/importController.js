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
      if (!req.file) {
        return res.status(400).json({ error: 'No CSV file uploaded' });
      }

      const tasks = [];
      const errors = [];
      let rowNum = 0;

      fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on('data', (row) => {
          rowNum++;
          // Standard columns: title, description, category, dueDate, priority, estimatedTime, status
          const title = row.title || row.Title || row.name || row.Name || '';
          const description = row.description || row.Description || '';
          const category = row.category || row.Category || 'General';
          const dueDate = row.dueDate || row.DueDate || row.due || row.Due || '';
          const priority = (row.priority || row.Priority || 'MEDIUM').toUpperCase();
          const estimatedTime = parseInt(row.estimatedTime || row.EstimatedTime || row.duration || row.durationMinutes || 0, 10);
          const status = (row.status || row.Status || 'TODO').toUpperCase();

          if (!title) {
            errors.push(`Row ${rowNum}: Title is missing.`);
            return;
          }

          tasks.push({
            title: title.trim(),
            description: description.trim(),
            category: category.trim(),
            dueDate: dueDate ? new Date(dueDate).toISOString().split('T')[0] : null,
            priority: ['LOW', 'MEDIUM', 'HIGH'].includes(priority) ? priority : 'MEDIUM',
            estimatedMinutes: isNaN(estimatedTime) ? 0 : estimatedTime,
            status: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'].includes(status) ? status : 'TODO',
            source: 'csv',
            aiGenerated: false
          });
        })
        .on('end', () => {
          // Cleanup temp file
          fs.unlinkSync(req.file.path);
          res.json({
            success: true,
            tasksCount: tasks.length,
            tasks,
            errors
          });
        })
        .on('error', (err) => {
          if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
          res.status(500).json({ error: 'Failed to parse CSV file', message: err.message });
        });
    } catch (err) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: 'Internal server error in CSV import', message: err.message });
    }
  },

  // POST /api/import/pdf
  importPDF: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file uploaded' });
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
        tasks: formattedTasks
      });
    } catch (err) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: 'Failed to process PDF', message: err.message });
    }
  },

  // POST /api/import/image
  importImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
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
        tasks: formattedTasks
      });
    } catch (err) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: 'Failed to process image OCR', message: err.message });
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
  }
};

module.exports = importController;
