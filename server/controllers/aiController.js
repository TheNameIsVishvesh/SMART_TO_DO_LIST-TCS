const taskRepository = require('../services/taskRepository');
const ollamaService = require('../services/ollamaService');
const prioritySystem = require('../utils/prioritySystem');

const aiController = {
  // POST /api/ai/recommend
  recommendTasks: async (req, res) => {
    try {
      const tasks = await taskRepository.find({});
      const incomplete = tasks.filter(t => t.status !== 'COMPLETED');
      
      if (incomplete.length === 0) {
        return res.json({
          topRecommendedTask: null,
          reason: 'No pending tasks left.',
          urgency: 'LOW',
          suggestedNextSteps: [],
          // Backward compatibility fields
          recommendation: 'You have completed all your tasks! Great job.',
          focusTask: null,
          tasksOrdered: []
        });
      }

      // Generate recommendation using the AI service (or rule fallback)
      const recommendationResult = await ollamaService.recommend(tasks);

      // Sort by priorityScore descending for compatibility list
      const ordered = [...incomplete].sort((a, b) => b.priorityScore - a.priorityScore);

      res.json({
        topRecommendedTask: recommendationResult.topRecommendedTask,
        reason: recommendationResult.reason,
        urgency: recommendationResult.urgency,
        suggestedNextSteps: recommendationResult.suggestedNextSteps,
        
        // Backward compatibility fields
        recommendation: recommendationResult.reason,
        focusTask: recommendationResult.topRecommendedTask,
        tasksOrdered: ordered.map(t => ({
          _id: t._id,
          title: t.title,
          category: t.category,
          priority: t.priority,
          priorityScore: t.priorityScore,
          dueDate: t.dueDate,
          estimatedMinutes: t.estimatedMinutes,
          reason: t.priorityReason
        }))
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate recommendations', message: err.message });
    }
  },

  // POST /api/ai/chat
  chatWithAssistant: async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message content is required' });
      }

      const tasks = await taskRepository.find({});
      const reply = await ollamaService.chat(message, tasks);
      const isOnline = await ollamaService.isAvailable();
      
      res.json({
        reply: reply,
        aiUsed: isOnline,
        ollamaModel: isOnline ? ollamaService.getActiveModel() : 'offline-fallback'
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to communicate with AI assistant', message: err.message });
    }
  },

  // POST /api/ai/schedule
  generateSmartSchedule: async (req, res) => {
    try {
      const { availableHours, availableTime } = req.body;
      
      let hours = 6;
      if (availableHours !== undefined) {
        hours = parseFloat(availableHours);
      } else if (availableTime !== undefined) {
        const timeVal = parseFloat(availableTime);
        // If it's a large value, assume it's in minutes (e.g. > 24)
        if (timeVal > 24) {
          hours = timeVal / 60;
        } else {
          hours = timeVal;
        }
      }

      if (isNaN(hours) || hours <= 0) {
        return res.status(400).json({ error: 'Valid availableTime or availableHours is required' });
      }
      
      const tasks = await taskRepository.find({});
      const scheduleResult = await ollamaService.generateSchedule(tasks, hours);
      
      res.json(scheduleResult);
    } catch (err) {
      res.status(500).json({ error: 'Failed to generate smart schedule', message: err.message });
    }
  },

  // POST /api/ai/subtasks
  generateSubtasksForTask: async (req, res) => {
    try {
      const { taskId, title, description } = req.body;
      let taskTitle = title;
      let taskDesc = description;

      if (taskId) {
        const task = await taskRepository.findById(taskId);
        if (task) {
          taskTitle = task.title;
          taskDesc = task.description;
        }
      }

      if (!taskTitle) {
        return res.status(400).json({ error: 'Task Title is required to generate subtasks' });
      }

      const subtasks = await ollamaService.generateSubtasks(taskTitle, taskDesc);
      
      // If taskId was passed, update the subtasks in the database
      if (taskId) {
        // Validate subtasks array
        if (Array.isArray(subtasks)) {
          // Verify subtask elements to prevent db corruption
          const validatedSubtasks = subtasks.map(sub => ({
            title: typeof sub.title === 'string' ? sub.title.substring(0, 100) : 'Subtask Step',
            completed: !!sub.completed
          }));
          await taskRepository.findByIdAndUpdate(taskId, { subtasks: validatedSubtasks });
        }
      }

      res.json({
        taskId,
        taskTitle,
        subtasks
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to break task into subtasks', message: err.message });
    }
  }
};

module.exports = aiController;
