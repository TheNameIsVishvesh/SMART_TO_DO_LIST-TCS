const Task = require('../models/Task');

// GET /api/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'COMPLETED' });
    const pendingTasks = await Task.countDocuments({ status: { $in: ['TODO', 'IN_PROGRESS'] } });
    const overdueTasks = await Task.countDocuments({ status: 'OVERDUE' });
    const highPriorityTasks = await Task.countDocuments({ priority: 'HIGH', status: { $ne: 'COMPLETED' } });

    const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Aggregations
    const tasksByPriority = await Task.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const tasksByStatus = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const tasksByCategory = await Task.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Weekly completion (last 7 days completed tasks per day)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyCompletion = await Task.aggregate([
      { 
        $match: { 
          status: 'COMPLETED',
          completedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      highPriorityTasks,
      completionPercentage: completionPercentage.toFixed(2),
      tasksByPriority,
      tasksByStatus,
      tasksByCategory,
      weeklyCompletion
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/alerts
exports.getAlerts = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const overdueTasks = await Task.find({ status: 'OVERDUE' }).sort({ dueDate: 1 }).lean();
    
    const tasksDueToday = await Task.find({
      dueDate: { $gte: today, $lt: tomorrow },
      status: { $ne: 'COMPLETED' }
    }).sort({ priorityScore: -1 }).lean();

    const tasksDueTomorrow = await Task.find({
      dueDate: { $gte: tomorrow, $lt: dayAfterTomorrow },
      status: { $ne: 'COMPLETED' }
    }).sort({ priorityScore: -1 }).lean();

    const highPriorityIncompleteTasks = await Task.find({
      priority: 'HIGH',
      status: { $ne: 'COMPLETED' }
    }).sort({ dueDate: 1 }).lean();

    res.json({
      overdueTasks,
      tasksDueToday,
      tasksDueTomorrow,
      upcomingDeadlines: [...tasksDueToday, ...tasksDueTomorrow], // Combined for simplicity
      highPriorityIncompleteTasks
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
