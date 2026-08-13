const taskRepository = require('../services/taskRepository');

// Helper to format due date
function getRelativeDate(daysOffset) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

const getDemoTasks = () => [
  {
    title: 'Semester Presentation',
    description: 'Prepare slides and practice speech for the final Capstone project defense.',
    category: 'Exams',
    tags: ['capstone', 'presentation'],
    priority: 'HIGH',
    status: 'TODO',
    dueDate: getRelativeDate(0), // due today
    estimatedMinutes: 120,
    source: 'manual'
  },
  {
    title: 'DBMS Assignment',
    description: 'Write SQL queries for database normalization and index optimization.',
    category: 'Assignments',
    tags: ['sql', 'dbms'],
    priority: 'HIGH',
    status: 'TODO',
    dueDate: getRelativeDate(1), // due tomorrow
    estimatedMinutes: 90,
    source: 'manual'
  },
  {
    title: 'Internal Exam Preparation',
    description: 'Revise Unit 1 to 3 of the Software Engineering syllabus and prepare formula sheets.',
    category: 'Exams',
    tags: ['exams', 'se'],
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: getRelativeDate(-1), // overdue
    estimatedMinutes: 150,
    source: 'manual'
  },
  {
    title: 'Machine Learning Assignment',
    description: 'Implement linear regression, gradient descent, and cross-validation from scratch in Python.',
    category: 'Assignments',
    tags: ['python', 'ml'],
    priority: 'HIGH',
    status: 'TODO',
    dueDate: getRelativeDate(2),
    estimatedMinutes: 120,
    source: 'manual'
  },
  {
    title: 'C++ Practical Lab',
    description: 'Implement templates, virtual functions, and class inheritance problems for Lab 5.',
    category: 'Lab Work',
    tags: ['cpp', 'oop'],
    priority: 'LOW',
    status: 'TODO',
    dueDate: getRelativeDate(3),
    estimatedMinutes: 90,
    source: 'manual'
  },
  {
    title: 'Automata Theory Assignment',
    description: 'Design DFAs/NFAs that accept specific binary formats and minimize states.',
    category: 'Assignments',
    tags: ['toc', 'math'],
    priority: 'LOW',
    status: 'TODO',
    dueDate: getRelativeDate(4),
    estimatedMinutes: 60,
    source: 'manual'
  },
  {
    title: 'Web Development Project',
    description: 'Build a MERN stack task coordinator with React, Tailwind, and Express API.',
    category: 'Projects',
    tags: ['mern', 'web'],
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    dueDate: getRelativeDate(7),
    estimatedMinutes: 300,
    source: 'manual',
    subtasks: [
      { title: 'Define API routes and controllers', completed: true },
      { title: 'Set up database schema models', completed: true },
      { title: 'Build React UI components', completed: false },
      { title: 'Integrate Tailwind styling and dashboard charts', completed: false }
    ]
  },
  {
    title: 'Computer Networks Quiz',
    description: 'Review OSI model layer functionalities, socket programming, and IP subnetting exercises.',
    category: 'Exams',
    tags: ['networks', 'quiz'],
    priority: 'MEDIUM',
    status: 'COMPLETED',
    dueDate: getRelativeDate(-2), // completed past task
    completedAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    estimatedMinutes: 60,
    source: 'manual'
  }
];

const taskController = {
  // GET /api/tasks
  getTasks: async (req, res) => {
    try {
      const { priority, status, category, search, sort } = req.query;
      let filter = {};

      if (priority) filter.priority = priority;
      if (status) filter.status = status;
      if (category) filter.category = category;

      let tasks = await taskRepository.find(filter);

      // Perform client-side text search (on Name, Description, Category, Tags, Priority, Status)
      if (search) {
        const query = search.toLowerCase();
        tasks = tasks.filter(task => {
          return (
            (task.title && task.title.toLowerCase().includes(query)) ||
            (task.description && task.description.toLowerCase().includes(query)) ||
            (task.category && task.category.toLowerCase().includes(query)) ||
            (task.priority && task.priority.toLowerCase().includes(query)) ||
            (task.status && task.status.toLowerCase().includes(query)) ||
            (task.tags && task.tags.some(tag => tag.toLowerCase().includes(query)))
          );
        });
      }

      // Sort logic
      if (sort) {
        if (sort === 'priorityScore') {
          tasks.sort((a, b) => b.priorityScore - a.priorityScore);
        } else if (sort === 'dueDate') {
          tasks.sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
          });
        } else if (sort === 'estimatedMinutes') {
          tasks.sort((a, b) => b.estimatedMinutes - a.estimatedMinutes);
        } else if (sort === 'createdAt') {
          tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
      }

      res.json({
        dbMode: taskRepository.getDbMode(),
        count: tasks.length,
        tasks
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve tasks', message: err.message });
    }
  },

  // GET /api/tasks/:id
  getTaskById: async (req, res) => {
    try {
      const task = await taskRepository.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve task', message: err.message });
    }
  },

  // POST /api/tasks
  createTask: async (req, res) => {
    try {
      const task = await taskRepository.create(req.body);
      res.status(201).json(task);
    } catch (err) {
      res.status(400).json({ error: 'Failed to create task', message: err.message });
    }
  },

  // PUT /api/tasks/:id
  updateTask: async (req, res) => {
    try {
      const updatedTask = await taskRepository.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!updatedTask) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(updatedTask);
    } catch (err) {
      res.status(400).json({ error: 'Failed to update task', message: err.message });
    }
  },

  // DELETE /api/tasks/:id
  deleteTask: async (req, res) => {
    try {
      const deletedTask = await taskRepository.findByIdAndDelete(req.params.id);
      if (!deletedTask) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json({ message: 'Task deleted successfully', task: deletedTask });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete task', message: err.message });
    }
  },

  // POST /api/tasks/:id/complete
  completeTask: async (req, res) => {
    try {
      const task = await taskRepository.findByIdAndUpdate(
        req.params.id,
        {
          status: 'COMPLETED',
          completedAt: new Date().toISOString()
        },
        { new: true }
      );
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    } catch (err) {
      res.status(400).json({ error: 'Failed to complete task', message: err.message });
    }
  },

  // POST /api/tasks/:id/reopen
  reopenTask: async (req, res) => {
    try {
      // Deduce status based on due date
      const taskObj = await taskRepository.findById(req.params.id);
      if (!taskObj) {
        return res.status(404).json({ error: 'Task not found' });
      }

      let status = 'TODO';
      if (taskObj.dueDate && new Date(taskObj.dueDate) < new Date()) {
        status = 'OVERDUE';
      }

      const task = await taskRepository.findByIdAndUpdate(
        req.params.id,
        {
          status: status,
          completedAt: null
        },
        { new: true }
      );
      res.json(task);
    } catch (err) {
      res.status(400).json({ error: 'Failed to reopen task', message: err.message });
    }
  },

  // POST /api/tasks/seed
  seedDemoData: async (req, res) => {
    try {
      // Clear existing tasks
      await taskRepository.deleteMany({});
      
      // Load student tasks
      const seeded = await taskRepository.insertMany(getDemoTasks());
      
      res.json({
        message: 'Demo dataset loaded successfully',
        count: seeded.length,
        tasks: seeded
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to seed demo database', message: err.message });
    }
  }
};

module.exports = taskController;
module.exports.getDemoTasks = getDemoTasks;
