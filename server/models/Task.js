const mongoose = require('mongoose');

const SubtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false }
});

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
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
    default: 0
  },
  completedAt: {
    type: Date
  },
  source: {
    type: String,
    default: 'manual'
  },
  subtasks: {
    type: [SubtaskSchema],
    default: []
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  extractedText: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', TaskSchema);
