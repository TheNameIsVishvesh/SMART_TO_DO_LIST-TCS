import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle, 
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  Plus
} from 'lucide-react';

const PRIORITY_COLORS = {
  HIGH: 'bg-rose-50 text-rose-600 border-rose-100',
  MEDIUM: 'bg-amber-50 text-amber-600 border-amber-100',
  LOW: 'bg-emerald-50 text-emerald-600 border-emerald-100'
};

const STATUS_COLORS = {
  TODO: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-100',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  OVERDUE: 'bg-rose-50 text-rose-700 border-rose-100'
};

export default function AllTasks({ showToast }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortField, setSortField] = useState('priorityScore');
  const [categories, setCategories] = useState([]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {
        priority: priorityFilter || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        search: search || undefined,
        sort: sortField
      };
      
      const res = await api.getTasks(params);
      setTasks(res.tasks || []);
      
      // Extract unique categories for filter select dropdown
      const allRes = await api.getTasks({});
      const uniqueCats = [...new Set(allRes.tasks.map(t => t.category))].filter(Boolean);
      setCategories(uniqueCats);
    } catch (err) {
      console.error(err);
      showToast('Error loading tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for search debouncing or simple change
    const delayDebounceFn = setTimeout(() => {
      fetchTasks();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, priorityFilter, statusFilter, categoryFilter, sortField]);

  const handleToggleStatus = async (task) => {
    try {
      if (task.status === 'COMPLETED') {
        await api.reopenTask(task._id);
        showToast(`Reopened task: "${task.title}"`, 'info');
      } else {
        await api.completeTask(task._id);
        showToast(`Completed task: "${task.title}"`, 'success');
      }
      fetchTasks();
    } catch (err) {
      showToast('Failed to update task status', 'error');
    }
  };

  const handleDeleteTask = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete task "${title}"?`)) return;
    try {
      await api.deleteTask(id);
      showToast(`Deleted task: "${title}"`, 'info');
      fetchTasks();
    } catch (err) {
      showToast('Failed to delete task', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Button */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800">All Tasks & Schedule</h2>
          <p className="text-slate-500 text-xs mt-0.5">Manage, filter, and track all university assignments</p>
        </div>
        <Link
          to="/add-task"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Task
        </Link>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search by title, description, category or tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-600 font-semibold"
            >
              <option value="priorityScore">Sort by Smart Score</option>
              <option value="dueDate">Sort by Due Date</option>
              <option value="estimatedMinutes">Sort by Duration</option>
              <option value="createdAt">Sort by Date Created</option>
            </select>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-150 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5" /> Filters
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none font-semibold text-slate-600"
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none font-semibold text-slate-600"
          >
            <option value="">All Statuses</option>
            <option value="TODO">Todo</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="OVERDUE">Overdue</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none font-semibold text-slate-600"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {(priorityFilter || statusFilter || categoryFilter || search) && (
            <button
              onClick={() => {
                setPriorityFilter('');
                setStatusFilter('');
                setCategoryFilter('');
                setSearch('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold transition-all px-2 py-1.5"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Task List Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-semibold">Updating task records...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <ListTodo className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No tasks found</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto mt-1">Try resetting filters, searching for a different term, or load demo data in Settings.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs bg-slate-50/50">
                  <th className="py-3 px-4 w-12 text-center">Status</th>
                  <th className="py-3 px-4">Task Title & Details</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4 text-center">Duration</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Smart Score</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr key={task._id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Toggle Status Column */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(task)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-indigo-600 text-transparent hover:text-indigo-600 bg-white'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </td>

                    {/* Task Title & Tags */}
                    <td className="py-4 px-4 max-w-xs md:max-w-md">
                      <div>
                        <Link 
                          to={`/task/${task._id}`} 
                          className={`font-bold hover:text-indigo-600 transition-colors block text-slate-800 ${
                            task.status === 'COMPLETED' ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {task.title}
                        </Link>
                        {task.description && (
                          <p className="text-slate-400 text-xs truncate mt-0.5 max-w-sm font-medium">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-wider ${PRIORITY_COLORS[task.priority]}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[task.status]}`}>
                            {task.status}
                          </span>
                          {task.tags && task.tags.map((tag) => (
                            <span key={tag} className="px-1.5 py-0.2 bg-slate-100 text-slate-500 rounded text-[10px] font-semibold">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 bg-indigo-50/70 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">
                        {task.category}
                      </span>
                    </td>

                    {/* Estimated Duration */}
                    <td className="py-4 px-4 text-center text-slate-600 font-semibold text-xs">
                      {task.estimatedMinutes ? `${task.estimatedMinutes}m` : '0m'}
                    </td>

                    {/* Due Date */}
                    <td className="py-4 px-4 text-slate-500 text-xs font-medium">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                    </td>

                    {/* Priority Score */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 text-sm">{task.priorityScore}</span>
                        {task.priorityReason && (
                          <span className="text-[10px] text-slate-400 font-medium truncate max-w-40" title={task.priorityReason}>
                            {task.priorityReason}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/task/${task._id}`}
                          className="p-1.5 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteTask(task._id, task.title)}
                          className="p-1.5 bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-100 rounded-lg transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
