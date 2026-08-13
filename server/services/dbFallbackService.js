const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');

// Ensure data directory and file exist
function initializeFileStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

function readTasks() {
  initializeFileStore();
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading JSON fallback database:', err);
    return [];
  }
}

function writeTasks(tasks) {
  initializeFileStore();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing JSON fallback database:', err);
    return false;
  }
}

const dbFallbackService = {
  find: async (filter = {}) => {
    let tasks = readTasks();
    
    // Simple filter matching
    if (Object.keys(filter).length > 0) {
      tasks = tasks.filter(task => {
        for (const key in filter) {
          if (filter[key] !== undefined) {
            // Basic handle for string/boolean/date matching
            if (key === 'status' && task.status !== filter.status) return false;
            if (key === 'priority' && task.priority !== filter.priority) return false;
            if (key === 'category' && task.category !== filter.category) return false;
          }
        }
        return true;
      });
    }
    
    // Sort: default by due date ascending
    return tasks.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  },

  findById: async (id) => {
    const tasks = readTasks();
    return tasks.find(task => task._id === id.toString()) || null;
  },

  create: async (taskData) => {
    const tasks = readTasks();
    const newTask = {
      _id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subtasks: [],
      tags: [],
      status: 'TODO',
      ...taskData
    };
    
    tasks.push(newTask);
    writeTasks(tasks);
    return newTask;
  },

  findByIdAndUpdate: async (id, updateData, options = { new: true }) => {
    const tasks = readTasks();
    const index = tasks.findIndex(task => task._id === id.toString());
    if (index === -1) return null;

    tasks[index] = {
      ...tasks[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    writeTasks(tasks);
    return tasks[index];
  },

  findByIdAndDelete: async (id) => {
    const tasks = readTasks();
    const index = tasks.findIndex(task => task._id === id.toString());
    if (index === -1) return null;
    
    const deletedTask = tasks[index];
    tasks.splice(index, 1);
    writeTasks(tasks);
    return deletedTask;
  },

  deleteMany: async (filter = {}) => {
    if (Object.keys(filter).length === 0) {
      writeTasks([]);
      return { deletedCount: readTasks().length };
    }
    const tasks = readTasks();
    const remaining = tasks.filter(task => {
      for (const key in filter) {
        if (task[key] === filter[key]) return false;
      }
      return true;
    });
    const deletedCount = tasks.length - remaining.length;
    writeTasks(remaining);
    return { deletedCount };
  },

  insertMany: async (tasksArray) => {
    const tasks = readTasks();
    const formatted = tasksArray.map(taskData => ({
      _id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subtasks: [],
      tags: [],
      status: 'TODO',
      ...taskData
    }));
    const newTasks = [...tasks, ...formatted];
    writeTasks(newTasks);
    return formatted;
  }
};

module.exports = dbFallbackService;
