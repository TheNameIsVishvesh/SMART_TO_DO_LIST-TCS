const Task = require('../models/Task');
const dbFallbackService = require('./dbFallbackService');
const db = require('../utils/db');
const prioritySystem = require('../utils/prioritySystem');

function getAdapter() {
  if (db.isConnected()) {
    return {
      type: 'mongodb',
      find: async (query) => {
        // Automatically check and update overdue statuses before returning
        let tasks = await Task.find(query);
        let updatedAny = false;
        
        for (let task of tasks) {
          if (task.status !== 'COMPLETED' && task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'OVERDUE') {
            task.status = 'OVERDUE';
            // Recalculate priority details
            const priorityInfo = prioritySystem.calculatePriority(task);
            task.priorityScore = priorityInfo.score;
            task.priorityReason = priorityInfo.reason;
            await task.save();
            updatedAny = true;
          }
        }
        
        if (updatedAny) {
          tasks = await Task.find(query);
        }
        
        // Sort: default by due date ascending
        return tasks.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
      },
      findById: async (id) => Task.findById(id),
      create: async (data) => {
        const priorityInfo = prioritySystem.calculatePriority(data);
        const taskData = {
          ...data,
          priorityScore: priorityInfo.score,
          priorityReason: priorityInfo.reason
        };
        return Task.create(taskData);
      },
      findByIdAndUpdate: async (id, data, options = { new: true }) => {
        // If due date, status, priority, or duration changes, recalculate priority score
        const currentTask = await Task.findById(id);
        if (currentTask) {
          const mergedData = { ...currentTask.toObject(), ...data };
          if (mergedData.status !== 'COMPLETED' && mergedData.dueDate && new Date(mergedData.dueDate) < new Date()) {
            mergedData.status = 'OVERDUE';
          }
          const priorityInfo = prioritySystem.calculatePriority(mergedData);
          data.priorityScore = priorityInfo.score;
          data.priorityReason = priorityInfo.reason;
          if (data.status) {
            data.status = mergedData.status;
          }
        }
        return Task.findByIdAndUpdate(id, data, options);
      },
      findByIdAndDelete: async (id) => Task.findByIdAndDelete(id),
      deleteMany: async (query) => Task.deleteMany(query),
      insertMany: async (array) => {
        const processedArray = array.map(item => {
          if (item.status !== 'COMPLETED' && item.dueDate && new Date(item.dueDate) < new Date()) {
            item.status = 'OVERDUE';
          }
          const priorityInfo = prioritySystem.calculatePriority(item);
          return {
            ...item,
            priorityScore: priorityInfo.score,
            priorityReason: priorityInfo.reason
          };
        });
        return Task.insertMany(processedArray);
      }
    };
  } else {
    return {
      type: 'json_file',
      find: async (query) => {
        let tasks = await dbFallbackService.find(query);
        let updatedAny = false;
        
        for (let task of tasks) {
          if (task.status !== 'COMPLETED' && task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'OVERDUE') {
            task.status = 'OVERDUE';
            const priorityInfo = prioritySystem.calculatePriority(task);
            task.priorityScore = priorityInfo.score;
            task.priorityReason = priorityInfo.reason;
            await dbFallbackService.findByIdAndUpdate(task._id, task);
            updatedAny = true;
          }
        }
        
        if (updatedAny) {
          tasks = await dbFallbackService.find(query);
        }
        return tasks;
      },
      findById: async (id) => dbFallbackService.findById(id),
      create: async (data) => {
        const priorityInfo = prioritySystem.calculatePriority(data);
        const taskData = {
          ...data,
          priorityScore: priorityInfo.score,
          priorityReason: priorityInfo.reason
        };
        return dbFallbackService.create(taskData);
      },
      findByIdAndUpdate: async (id, data, options = { new: true }) => {
        const currentTask = await dbFallbackService.findById(id);
        if (currentTask) {
          const mergedData = { ...currentTask, ...data };
          if (mergedData.status !== 'COMPLETED' && mergedData.dueDate && new Date(mergedData.dueDate) < new Date()) {
            mergedData.status = 'OVERDUE';
          }
          const priorityInfo = prioritySystem.calculatePriority(mergedData);
          data.priorityScore = priorityInfo.score;
          data.priorityReason = priorityInfo.reason;
          if (data.status) {
            data.status = mergedData.status;
          }
        }
        return dbFallbackService.findByIdAndUpdate(id, data, options);
      },
      findByIdAndDelete: async (id) => dbFallbackService.findByIdAndDelete(id),
      deleteMany: async (query) => dbFallbackService.deleteMany(query),
      insertMany: async (array) => {
        const processedArray = array.map(item => {
          if (item.status !== 'COMPLETED' && item.dueDate && new Date(item.dueDate) < new Date()) {
            item.status = 'OVERDUE';
          }
          const priorityInfo = prioritySystem.calculatePriority(item);
          return {
            ...item,
            priorityScore: priorityInfo.score,
            priorityReason: priorityInfo.reason
          };
        });
        return dbFallbackService.insertMany(processedArray);
      }
    };
  }
}

const taskRepository = {
  find: async (query) => getAdapter().find(query),
  findById: async (id) => getAdapter().findById(id),
  create: async (data) => getAdapter().create(data),
  findByIdAndUpdate: async (id, data, options) => getAdapter().findByIdAndUpdate(id, data, options),
  findByIdAndDelete: async (id) => getAdapter().findByIdAndDelete(id),
  deleteMany: async (query) => getAdapter().deleteMany(query),
  insertMany: async (array) => getAdapter().insertMany(array),
  getDbMode: () => getAdapter().type
};

module.exports = taskRepository;
