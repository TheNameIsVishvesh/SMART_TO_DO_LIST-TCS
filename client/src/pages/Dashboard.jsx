import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ListTodo, 
  Flame, 
  Lightbulb, 
  ArrowRight,
  TrendingUp,
  Brain
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const PRIORITY_COLORS = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#10b981'
};

export default function Dashboard({ showToast }) {
  const [stats, setStats] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsData, recData] = await Promise.all([
        api.getAnalytics(),
        api.getRecommendations()
      ]);
      setStats(analyticsData);
      setRecommendation(recData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not connect to database server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCompleteTask = async (id, title) => {
    try {
      await api.completeTask(id);
      showToast(`Completed task: "${title}"`, 'success');
      fetchDashboardData();
    } catch (err) {
      showToast('Failed to complete task', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Loading productivity analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-lg mx-auto mt-12 shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-800">Connection Error</h3>
        <p className="text-slate-600 text-sm mt-1">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-800">University Portal</span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-3">Smart To-Do Assistant</h2>
          <p className="text-slate-300 text-sm mt-1">Your AI-powered productivity dashboard</p>
        </div>
        <div className="relative z-10 flex gap-3">
          <Link
            to="/add-task"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200"
          >
            Create Task
          </Link>
          <Link
            to="/import"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition-all duration-200"
          >
            Import Document
          </Link>
        </div>
        {/* Subtle background decoration */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
            <ListTodo className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block">Total Tasks</span>
            <span className="text-2xl font-bold text-slate-800">{stats.totalTasks}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block">Completed</span>
            <span className="text-2xl font-bold text-slate-800">{stats.completedTasks}</span>
            <span className="text-xs font-semibold text-emerald-600 block mt-0.5">{stats.completionPercentage}% rate</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block">Pending</span>
            <span className="text-2xl font-bold text-slate-800">{stats.pendingTasks}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-rose-50 text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 block">Overdue</span>
            <span className="text-2xl font-bold text-slate-800">{stats.overdueTasks}</span>
            {stats.overdueTasks > 0 && <span className="text-xs text-rose-500 font-medium block mt-0.5">Needs action</span>}
          </div>
        </div>
      </div>

      {/* Main Focus and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Recommendations Card */}
        <div className="lg:col-span-2 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-800 font-bold mb-4">
              <Brain className="w-6 h-6 text-indigo-600" />
              <h3 className="text-lg">AI Recommendation Engine</h3>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed mb-5 font-medium">
              "{recommendation?.recommendation || 'No recommendations generated yet. Try loading demo database.'}"
            </p>
            
            {recommendation?.focusTask && (
              <div className="bg-white p-4 rounded-xl border border-indigo-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase">{recommendation.focusTask.category}</span>
                  <h4 className="font-bold text-slate-800 text-base">{recommendation.focusTask.title}</h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded font-semibold">Priority Score: {recommendation.focusTask.priorityScore}</span>
                    <span className="text-xs text-slate-500">• Due: {new Date(recommendation.focusTask.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleCompleteTask(recommendation.focusTask._id, recommendation.focusTask.title)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Complete
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-5 pt-4 border-t border-indigo-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Transparent scoring based on proximity, effort, status & importance</span>
            <Link to="/schedule" className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1">
              Build Smart Schedule <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Today's Focus Card */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-600 font-bold mb-4">
              <Flame className="w-5 h-5 text-rose-500" />
              <h3 className="text-lg text-slate-800">Today's Focus</h3>
            </div>
            
            {stats.todayTasksCount === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-30" />
                <p className="text-slate-500 text-sm font-medium">No tasks deadline is set for today.</p>
                <Link to="/tasks" className="text-indigo-600 hover:underline text-xs font-bold mt-1 inline-block">Browse upcoming tasks</Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-600 text-sm">You have <strong className="text-indigo-600">{stats.todayTasksCount}</strong> tasks due today. Finish them before the deadline expires!</p>
                <Link to="/tasks?dueDate=today" className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors block text-center border border-slate-100">
                  View Today's Tasks
                </Link>
              </div>
            )}
          </div>

          <div className="mt-6 p-3 bg-amber-50 border border-amber-100 rounded-xl flex gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-normal">
              <strong>Tip:</strong> Complete short items first to build momentum, or schedule large assignments using the Smart Scheduler.
            </p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Productivity Trend */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              Weekly Productivity Trend
            </h3>
            <span className="text-xs text-slate-400 font-semibold">Tasks Completed vs Created</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.weeklyTrend}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} name="Completed" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="created" stroke="#6366f1" strokeWidth={2} name="Created" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Chart */}
        <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4">Tasks by Category</h3>
          <div className="h-64 flex flex-col md:flex-row items-center justify-between">
            {stats.categoryBreakdown.length === 0 ? (
              <p className="text-slate-400 text-sm font-medium mx-auto">No categories found. Load seed data.</p>
            ) : (
              <>
                <div className="w-full md:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {stats.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 space-y-1.5 max-h-56 overflow-y-auto pl-4">
                  {stats.categoryBreakdown.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span className="truncate max-w-32">{entry.name}</span>
                      </div>
                      <span className="font-bold text-slate-800">{entry.value} task(s)</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines Row */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4">Upcoming Deadlines & Timeline</h3>
        {stats.upcomingDeadlines.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6 font-medium">No upcoming deadlines scheduled!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs">
                  <th className="py-3 px-4">Task Name</th>
                  <th className="py-3 px-4">Subject Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.upcomingDeadlines.map((task) => (
                  <tr key={task._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <Link to={`/task/${task._id}`} className="font-bold text-slate-700 hover:text-indigo-600 transition-colors">
                        {task.title}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-semibold">
                        {task.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span 
                        className="px-2 py-0.5 rounded text-xs font-bold"
                        style={{ color: PRIORITY_COLORS[task.priority], backgroundColor: `${PRIORITY_COLORS[task.priority]}15` }}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(task.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleCompleteTask(task._id, task.title)}
                        className="px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-all"
                      >
                        Done
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
