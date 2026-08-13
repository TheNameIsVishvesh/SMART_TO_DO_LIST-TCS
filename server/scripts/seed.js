require('dotenv').config();
const db = require('../utils/db');
const taskRepository = require('../services/taskRepository');
const { getDemoTasks } = require('../controllers/taskController');

async function seed() {
  try {
    console.log('Seeding demo database...');
    await db.connectDB();
    
    // Clear current database
    await taskRepository.deleteMany({});
    console.log('Cleared existing tasks.');

    // Seed tasks
    const tasks = getDemoTasks();
    const result = await taskRepository.insertMany(tasks);
    console.log(`Successfully seeded ${result.length} demo university tasks.`);
    
    process.exit(0);
  } catch (err) {
    console.error('Seeding script failed:', err);
    process.exit(1);
  }
}

seed();
