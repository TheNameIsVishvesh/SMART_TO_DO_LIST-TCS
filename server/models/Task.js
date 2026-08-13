const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  }
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  tags: {
    type: [String],
    default: []
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  },
  priorityScore: {
    type: Number,
    default: 0
  },
  priorityReason: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['TODO', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'],
    default: 'TODO'
  },
  dueDate: {
    type: Date
  },
  estimatedMinutes: {
    type: Number,
    default: 30
  },
  completedAt: {
    type: Date
  },
  source: {
    type: String,
    default: 'manual'
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  extractedText: {
    type: String,
    default: ''
  },
  subtasks: [subtaskSchema]
}, {
  timestamps: true // Automatically creates createdAt and updatedAt
});

// Middleware to detect if a task is overdue before saving
taskSchema.pre('save', function(next) {
  if (this.status !== 'COMPLETED' && this.dueDate && this.dueDate < new Date()) {
    this.status = 'OVERDUE';
  }
  next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
