const Task = require('../models/Task');
const { parseCSVFile } = require('../services/csvService');
const { extractTextFromPDF } = require('../services/pdfService');
const { extractTextFromImage } = require('../services/ocrService');
const { extractTasksFromText } = require('../services/aiExtractionService');
const { validateCandidateTaskList } = require('../services/taskValidationService');
const { cleanTempFile } = require('../middleware/uploadMiddleware');

/**
 * @desc    Import and validate CSV file (does NOT save to MongoDB)
 * @route   POST /api/import/csv
 */
const importCSV = async (req, res) => {
  const filePath = req.file?.path;
  try {
    if (!filePath) {
      return res.status(400).json({ success: false, message: 'Please upload a CSV file.' });
    }

    const result = await parseCSVFile(filePath);
    return res.status(200).json({
      success: true,
      validRows: result.validRows,
      invalidRows: result.invalidRows,
      totalRows: result.totalRows,
      validCount: result.validCount,
      invalidCount: result.invalidCount
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to process CSV file.'
    });
  } finally {
    cleanTempFile(filePath);
  }
};

/**
 * @desc    Extract text from PDF document
 * @route   POST /api/import/pdf
 */
const importPDF = async (req, res) => {
  const filePath = req.file?.path;
  try {
    if (!filePath) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF file.' });
    }

    const result = await extractTextFromPDF(filePath);
    return res.status(200).json({
      success: true,
      filename: req.file.originalname,
      extractedText: result.extractedText,
      pageCount: result.pageCount,
      info: result.info
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to extract text from PDF.'
    });
  } finally {
    cleanTempFile(filePath);
  }
};

/**
 * @desc    Extract text from Image using Tesseract OCR
 * @route   POST /api/import/image
 */
const importImage = async (req, res) => {
  const filePath = req.file?.path;
  try {
    if (!filePath) {
      return res.status(400).json({ success: false, message: 'Please upload an image file (PNG, JPG, JPEG).' });
    }

    const result = await extractTextFromImage(filePath);
    return res.status(200).json({
      success: true,
      filename: req.file.originalname,
      extractedText: result.extractedText,
      warning: result.warning
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to perform OCR on image.'
    });
  } finally {
    cleanTempFile(filePath);
  }
};

/**
 * @desc    Extract structured tasks from raw text using Gemma 3 4B via Ollama
 * @route   POST /api/import/extract-tasks
 */
const extractTasks = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Text field is required for AI task extraction.'
      });
    }

    const result = await extractTasksFromText(text);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'AI task extraction failed.'
    });
  }
};

/**
 * @desc    Review and approve candidate tasks (saves ONLY approved tasks to MongoDB)
 * @route   POST /api/import/review (or POST /api/import/approve)
 */
const reviewTasks = async (req, res) => {
  try {
    const { action = 'APPROVE', tasks, approvedTasks, rejectedTasks, defaultSource } = req.body;

    // Handle explicit rejection
    if (action === 'REJECT') {
      const rejectList = tasks || rejectedTasks || [];
      return res.status(200).json({
        success: true,
        message: `${rejectList.length} task(s) rejected and discarded without saving to MongoDB.`,
        rejectedCount: rejectList.length,
        savedCount: 0
      });
    }

    // Determine list of tasks to approve
    const rawCandidates = approvedTasks || tasks;

    if (!Array.isArray(rawCandidates) || rawCandidates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No tasks provided for approval.'
      });
    }

    // Filter out any tasks that are explicitly marked rejected in task objects
    const candidatesToValidate = rawCandidates.filter(t => {
      if (t.isApproved === false) return false;
      if (String(t.status).toUpperCase() === 'REJECTED') return false;
      return true;
    });

    if (candidatesToValidate.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All tasks were rejected or discarded. 0 tasks saved to MongoDB.',
        savedCount: 0
      });
    }

    // Validate candidates
    const validationResult = validateCandidateTaskList(candidatesToValidate);

    if (validationResult.validCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'None of the submitted candidate tasks passed validation.',
        invalidTasks: validationResult.invalidTasks
      });
    }

    // Format tasks for Mongoose Task schema
    const tasksToInsert = validationResult.validTasks.map(t => {
      let priorityScore = 2;
      if (t.priority === 'HIGH') priorityScore = 3;
      else if (t.priority === 'LOW') priorityScore = 1;

      return {
        title: t.title,
        description: t.description || '',
        category: t.category || 'General',
        tags: t.tags || [],
        priority: t.priority || 'MEDIUM',
        priorityScore,
        priorityReason: t.priorityReason || '',
        status: t.status || 'TODO',
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        estimatedMinutes: t.estimatedTime || t.estimatedMinutes || 30,
        source: t.source || defaultSource || 'manual_review',
        aiGenerated: t.aiGenerated !== undefined ? Boolean(t.aiGenerated) : false,
        extractedText: t.extractedText || ''
      };
    });

    const insertedDocs = await Task.insertMany(tasksToInsert);

    return res.status(201).json({
      success: true,
      message: `Successfully approved and created ${insertedDocs.length} task(s) in MongoDB.`,
      savedCount: insertedDocs.length,
      createdTasks: insertedDocs,
      invalidCount: validationResult.invalidCount,
      invalidTasks: validationResult.invalidTasks
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process task review.'
    });
  }
};

module.exports = {
  importCSV,
  importPDF,
  importImage,
  extractTasks,
  reviewTasks,
  approveTasks: reviewTasks // Alias
};
