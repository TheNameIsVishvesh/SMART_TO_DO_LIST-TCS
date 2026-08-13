const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure temporary uploads directory exists
const tempDir = path.join(__dirname, '..', 'uploads', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Allowed extensions and MIME types
const ALLOWED_EXTENSIONS = new Set(['.csv', '.pdf', '.png', '.jpg', '.jpeg']);
const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.ps1', '.vbs', '.js', '.mjs',
  '.jar', '.msi', '.com', '.scr', '.pif', '.hta', '.cpl', '.wsf', '.php',
  '.py', '.pl', '.rb', '.dll', '.so', '.dylib', '.bin'
]);

const ALLOWED_MIME_TYPES = new Set([
  'text/csv',
  'application/vnd.ms-excel',
  'application/csv',
  'text/plain',
  'text/x-csv',
  'application/x-csv',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/pjpeg',
  'image/jpg'
]);

// Configure disk storage with randomized filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, randomName);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Reject executable or dangerous file extensions immediately
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return cb(new Error(`Security Alert: Executable or dangerous file type '${ext}' is strictly prohibited.`), false);
  }

  // Verify allowed extension
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error(`Unsupported file extension '${ext}'. Allowed types: .csv, .pdf, .png, .jpg, .jpeg`), false);
  }

  // Verify MIME type
  if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
    // For text/csv or text/plain fallback when extension is csv
    if (ext === '.csv' && (file.mimetype.startsWith('text/') || file.mimetype === 'application/octet-stream')) {
      return cb(null, true);
    }
    return cb(new Error(`Invalid MIME type '${file.mimetype}'. File type does not match supported formats.`), false);
  }

  cb(null, true);
};

// Max file size in bytes
const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10);
const limits = {
  fileSize: maxFileSizeMB * 1024 * 1024 // e.g. 10MB
};

const upload = multer({
  storage,
  fileFilter,
  limits
});

// Safe cleanup helper
const cleanTempFile = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`Failed to delete temp file ${filePath}:`, err.message);
  }
};

// Middleware wrapper for single file upload with standard error handling
const handleSingleUpload = (fieldName = 'file') => {
  const multerSingle = upload.single(fieldName);

  return (req, res, next) => {
    multerSingle(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: `File size exceeds the limit of ${maxFileSizeMB}MB.`
            });
          }
          return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed.'
        });
      }

      // Check if file was provided
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded. Please attach a file.'
        });
      }

      // Check for 0-byte / empty file
      if (req.file.size === 0) {
        cleanTempFile(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Uploaded file is empty (0 bytes).'
        });
      }

      next();
    });
  };
};

module.exports = {
  upload,
  handleSingleUpload,
  cleanTempFile,
  ALLOWED_EXTENSIONS
};
