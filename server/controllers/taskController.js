const Task = require('../models/Task');

// Helper to update overdue tasks dynamically
const updateOverdueTasks = async () => {
  const currentDate = new Date();
  await Task.updateMany(
    {
      status: { $in: ['TODO', 'IN_PROGRESS'] },
      dueDate: { $lt: currentDate }
    },
    {
      $set: { status: 'OVERDUE' }
    }
  );
};

// @desc    Get all tasks with filtering, search, and sorting
// @route   GET /api/tasks
const getTasks = async (req, res) => {
  try {
    // Update overdue tasks first
    await updateOverdueTasks();

    const { status, priority, category, deadline, search, sort } = req.query;

    let query = {};

    // Filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    // Search by title, description, or tags
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Deadline filter
    if (deadline) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (deadline === 'today') {
        query.dueDate = { $gte: today, $lt: tomorrow };
      } else if (deadline === 'upcoming') {
        query.dueDate = { $gte: tomorrow };
      } else if (deadline === 'overdue') {
        query.status = 'OVERDUE';
      }
    }

    // Sorting
    let sortObj = {};
    if (sort) {
      // sort can be 'deadline', 'priority', 'createdAt'
      // -deadline for descending
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortOrder = sort.startsWith('-') ? -1 : 1;

      if (sortField === 'deadline') sortObj.dueDate = sortOrder;
      else if (sortField === 'createdAt') sortObj.createdAt = sortOrder;
      else if (sortField === 'priority') {
        // Since priority is string, we can sort by priorityScore if frontend sets it,
        // or we use priorityScore as a proxy for sorting
        sortObj.priorityScore = sortOrder; 
      }
    } else {
      // Default sort
      sortObj.createdAt = -1;
    }

    const tasks = await Task.find(query).sort(sortObj);
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single task
// @route   GET /api/tasks/:id
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    // Check if overdue
    if (task.status !== 'COMPLETED' && task.dueDate && task.dueDate < new Date()) {
      task.status = 'OVERDUE';
      await task.save();
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
const createTask = async (req, res) => {
  try {
    // Map priority to priorityScore if not provided
    const taskData = { ...req.body };
    if (!taskData.priorityScore && taskData.priority) {
      if (taskData.priority === 'HIGH') taskData.priorityScore = 3;
      if (taskData.priority === 'MEDIUM') taskData.priorityScore = 2;
      if (taskData.priority === 'LOW') taskData.priorityScore = 1;
    }

    const task = await Task.create(taskData);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const taskData = { ...req.body };
    // Map priority to priorityScore if priority is updated and score is not
    if (!taskData.priorityScore && taskData.priority) {
      if (taskData.priority === 'HIGH') taskData.priorityScore = 3;
      if (taskData.priority === 'MEDIUM') taskData.priorityScore = 2;
      if (taskData.priority === 'LOW') taskData.priorityScore = 1;
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      taskData,
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.status(200).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.status(200).json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark task as completed
// @route   POST /api/tasks/:id/complete
const completeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.status = 'COMPLETED';
    task.completedAt = new Date();
    await task.save();

    res.status(200).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Reopen task
// @route   POST /api/tasks/:id/reopen
const reopenTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.status = 'TODO';
    task.completedAt = undefined;
    
    // Automatically detect if it's overdue
    if (task.dueDate && task.dueDate < new Date()) {
      task.status = 'OVERDUE';
    }

    await task.save();

    res.status(200).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  reopenTask
};
