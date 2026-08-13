const mongoose = require('mongoose');

let isMongoConnected = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI environment variable is missing. Falling back to local JSON database.');
    isMongoConnected = false;
    return false;
  }

  try {
    console.log(`Connecting to MongoDB at: ${uri}...`);
    // Connect with a 5-second timeout so it doesn't hang indefinitely if MongoDB is offline
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    
    isMongoConnected = true;
    console.log('Successfully connected to MongoDB.');
    return true;
  } catch (err) {
    console.error('MongoDB connection failed. Database operations will fall back to local JSON storage.', err.message);
    isMongoConnected = false;
    return false;
  }
}

// Listen to connection changes
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Switching database layer to JSON fallback.');
  isMongoConnected = false;
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB reconnected.');
  isMongoConnected = true;
});

module.exports = {
  connectDB,
  isConnected: () => isMongoConnected
};
