const taskRepository = require('../services/taskRepository');

const analyticsController = {
  // GET /api/analytics
  getAnalytics: async (req, res) => {
    try {
      const tasks = await taskRepository.find({});
      
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'COMPLETED').length;
      const pending = tasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length;
      const overdue = tasks.filter(t => t.status === 'OVERDUE').length;
      const highPriority = tasks.filter(t => t.status !== 'COMPLETED' && t.priority === 'HIGH').length;
      
      const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Group by Category
      const categories = {};
      tasks.forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + 1;
      });
      const categoryBreakdown = Object.keys(categories).map(cat => ({
        name: cat,
        value: categories[cat]
      }));

      // Group by Priority
      const priorityBreakdown = {
        HIGH: tasks.filter(t => t.priority === 'HIGH').length,
        MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
        LOW: tasks.filter(t => t.priority === 'LOW').length
      };

      // Group by Status
      const statusBreakdown = {
        TODO: tasks.filter(t => t.status === 'TODO').length,
        IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        COMPLETED: completed,
        OVERDUE: overdue
      };

      // Calculate Weekly Trend (Last 7 Days)
      const weeklyTrend = [];
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const dateString = date.toISOString().split('T')[0];
        const dayLabel = days[date.getDay()];

        // Find tasks created on this day
        const createdCount = tasks.filter(t => {
          const cDate = new Date(t.createdAt).toISOString().split('T')[0];
          return cDate === dateString;
        }).length;

        // Find tasks completed on this day
        const completedCount = tasks.filter(t => {
          if (!t.completedAt) return false;
          const compDate = new Date(t.completedAt).toISOString().split('T')[0];
          return compDate === dateString;
        }).length;

        weeklyTrend.push({
          day: dayLabel,
          date: dateString,
          created: createdCount,
          completed: completedCount
        });
      }

      // Today's focus and upcoming deadlines
      const todayString = new Date().toISOString().split('T')[0];
      const todayTasks = tasks.filter(t => {
        if (t.status === 'COMPLETED' || !t.dueDate) return false;
        const dDate = new Date(t.dueDate).toISOString().split('T')[0];
        return dDate === todayString;
      });

      const upcomingDeadlines = tasks
        .filter(t => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) >= new Date())
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5)
        .map(t => ({
          _id: t._id,
          title: t.title,
          dueDate: t.dueDate,
          priority: t.priority,
          category: t.category
        }));

      // High-risk overdue tasks list
      const overdueAlerts = tasks
        .filter(t => t.status === 'OVERDUE')
        .map(t => ({
          _id: t._id,
          title: t.title,
          dueDate: t.dueDate,
          priority: t.priority,
          estimatedMinutes: t.estimatedMinutes
        }));

      res.json({
        totalTasks: total,
        completedTasks: completed,
        pendingTasks: pending,
        overdueTasks: overdue,
        highPriorityTasks: highPriority,
        completionPercentage,
        categoryBreakdown,
        priorityBreakdown,
        statusBreakdown,
        weeklyTrend,
        todayTasksCount: todayTasks.length,
        upcomingDeadlines,
        overdueAlerts
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to calculate analytics', message: err.message });
    }
  }
};

module.exports = analyticsController;
