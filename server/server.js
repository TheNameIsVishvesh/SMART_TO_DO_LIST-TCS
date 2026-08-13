require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./utils/db');
const apiRoutes = require('./routes/api');

const app = express();

const PORT = process.env.PORT || 5000;

// Enable CORS for frontend communication
app.use(cors({
  origin: '*', // Allow all origins for dev/demo ease
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: db.isConnected() ? 'mongodb' : 'json_file_fallback',
    ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2:3b'
  });
});

// Serve frontend build in production mode if dist folder exists
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  // If request is an API request, let it go to 404
  if (req.path.startsWith('/api')) {
    return next();
  }
  // Otherwise, serve index.html for React Router
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      // In development or if client isn't built, return simple greeting
      res.status(200).send('Smart To-Do List Assistant API Server is running. Frontend not found or not built.');
    }
  });
});

// Custom Error Handling Middleware (No Stack Traces)
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.message);
  
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    status = 400;
    message = 'File size limit exceeded. Maximum size allowed is 10MB.';
  } else if (err.message && (err.message.includes('supported') || err.message.includes('prohibited') || err.message.includes('Security'))) {
    status = 400;
    message = 'Security Alert: Unsupported or prohibited file type.';
  }

  res.status(status).json({
    error: true,
    message: message
  });
});

// Initialize database connection and boot server
async function startServer() {
  await db.connectDB();
  
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`  Smart To-Do List Assistant Server running on:  `);
    console.log(`  🚀 http://localhost:${PORT}                      `);
    console.log(`==================================================`);
  });
}

startServer();

