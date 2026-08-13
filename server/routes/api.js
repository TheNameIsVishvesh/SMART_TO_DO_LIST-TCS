const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to check supported types
const fileFilter = (req, file, cb) => {
  const filetypes = /csv|pdf|png|jpg|jpeg/i;
  const extname = filetypes.test(path.extname(file.originalname));
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only CSV, PDF, PNG, JPG, and JPEG files are supported!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Controllers
const taskController = require('../controllers/taskController');
const importController = require('../controllers/importController');
const aiController = require('../controllers/aiController');
const analyticsController = require('../controllers/analyticsController');
const exportController = require('../controllers/exportController');

// ----------------------------------------------------
// TASK CRUD ENDPOINTS
// ----------------------------------------------------
router.get('/tasks', taskController.getTasks);
router.post('/tasks', taskController.createTask);
router.get('/tasks/:id', taskController.getTaskById);
router.put('/tasks/:id', taskController.updateTask);
router.delete('/tasks/:id', taskController.deleteTask);

router.post('/tasks/:id/complete', taskController.completeTask);
router.post('/tasks/:id/reopen', taskController.reopenTask);
router.post('/tasks/seed', taskController.seedDemoData);

// ----------------------------------------------------
// IMPORT / FILE PROCESSING ENDPOINTS
// ----------------------------------------------------
router.post('/import/csv', upload.single('file'), importController.importCSV);
router.post('/import/pdf', upload.single('file'), importController.importPDF);
router.post('/import/image', upload.single('file'), importController.importImage);
router.post('/import/confirm', importController.confirmImport);

// ----------------------------------------------------
// AI SERVICES ENDPOINTS
// ----------------------------------------------------
router.post('/ai/recommend', aiController.recommendTasks);
router.post('/ai/chat', aiController.chatWithAssistant);
router.post('/ai/schedule', aiController.generateSmartSchedule);
router.post('/ai/subtasks', aiController.generateSubtasksForTask);

// ----------------------------------------------------
// ANALYTICS & ALERTS ENDPOINTS
// ----------------------------------------------------
router.get('/analytics', analyticsController.getAnalytics);

// ----------------------------------------------------
// EXPORT ENDPOINTS
// ----------------------------------------------------
router.get('/export/csv', exportController.exportCSV);
router.get('/export/excel', exportController.exportExcel);
router.get('/export/pdf', exportController.exportPDF);

module.exports = router;
