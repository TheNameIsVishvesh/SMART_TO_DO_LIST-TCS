import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  BookOpen, 
  Tag, 
  Edit, 
  Trash2, 
  CheckCircle,
  Plus,
  Sparkles,
  CheckSquare,
  Square,
  FileText
} from 'lucide-react';

const PRIORITY_COLORS = {
  HIGH: 'text-rose-600 bg-rose-50 border-rose-100',
  MEDIUM: 'text-amber-600 bg-amber-50 border-amber-100',
  LOW: 'text-emerald-600 bg-emerald-50 border-emerald-100'
};

export default function TaskDetails({ showToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Edit form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [tagsInput, setTagsInput] = useState('');

  // Subtask inputs
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const fetchTask = async () => {
    try {
      setLoading(true);
      const data = await api.getTaskById(id);
      setTask(data);
      
      // Seed form values
      setTitle(data.title || '');
      setDescription(data.description || '');
      setCategory(data.category || 'General');
      setPriority(data.priority || 'MEDIUM');
      setDueDate(data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : '');
      setEstimatedMinutes(data.estimatedMinutes || 0);
      setTagsInput(data.tags ? data.tags.join(', ') : '');
    } catch (err) {
      console.error(err);
      showToast('Error loading task details', 'error');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

      const updateData = {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        dueDate: dueDate || null,
        estimatedMinutes: parseInt(estimatedMinutes, 10) || 0,
        tags
      };

      await api.updateTask(id, updateData);
      showToast('Task updated successfully!', 'success');
      setEditing(false);
      fetchTask();
    } catch (err) {
      console.error(err);
      showToast('Failed to update task', 'error');
    }
  };

  const handleToggleStatus = async () => {
    try {
      if (task.status === 'COMPLETED') {
        await api.reopenTask(task._id);
        showToast('Task reopened', 'info');
      } else {
        await api.completeTask(task._id);
        showToast('Task marked as completed', 'success');
      }
      fetchTask();
    } catch (err) {
      showToast('Error updating status', 'error');
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm(`Are you sure you want to delete this task?`)) return;
    try {
      await api.deleteTask(id);
      showToast('Task deleted successfully', 'info');
      navigate('/tasks');
    } catch (err) {
      showToast('Error deleting task', 'error');
    }
  };

  // Subtask management
  const handleToggleSubtask = async (subtaskId) => {
    try {
      const updatedSubtasks = task.subtasks.map(sub => {
        if (sub._id === subtaskId) {
          return { ...sub, completed: !sub.completed };
        }
        return sub;
      });
      await api.updateTask(id, { subtasks: updatedSubtasks });
      fetchTask();
    } catch (err) {
      showToast('Failed to toggle subtask', 'error');
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    try {
      const updatedSubtasks = [...(task.subtasks || []), { title: newSubtaskTitle.trim(), completed: false }];
      await api.updateTask(id, { subtasks: updatedSubtasks });
      setNewSubtaskTitle('');
      fetchTask();
      showToast('Subtask added!', 'success');
    } catch (err) {
      showToast('Failed to add subtask', 'error');
    }
  };

  const handleGenerateAISubtasks = async () => {
    try {
      setAiLoading(true);
      showToast('AI breaking task into smaller steps...', 'info');
      await api.generateSubtasks(id);
      showToast('AI generated subtasks successfully!', 'success');
      fetchTask();
    } catch (err) {
      console.error(err);
      showToast('AI was unable to generate subtasks. Using rule fallback.', 'warning');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-semibold">Fetching task details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Back button */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/tasks"
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Task Overview</h2>
            <p className="text-slate-400 text-[10px] font-semibold tracking-wide uppercase">Course: {task.category}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(!editing)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <Edit className="w-3.5 h-3.5" /> {editing ? 'Cancel Edit' : 'Edit Task'}
          </button>
          <button
            onClick={handleDeleteTask}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl border border-rose-100 transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      </div>

      {editing ? (
        /* EDITING MODE FORM */
        <form onSubmit={handleUpdateTask} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase block">Task Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase block">Category / Subject</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Assignments">Assignments</option>
                <option value="Exams">Exams</option>
                <option value="Projects">Projects</option>
                <option value="Lab Work">Lab Work</option>
                <option value="Revision">Revision</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase block">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase block">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase block">Est. Duration (Mins)</label>
              <input
                type="number"
                min="0"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase block">Tags (comma separated)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        /* DETAIL VIEW MODE */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 border rounded-lg text-xs font-bold tracking-wide uppercase ${PRIORITY_COLORS[task.priority]}`}>
                  {task.priority} Priority
                </span>
                <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-2.5 py-1 rounded-lg uppercase">
                  Status: {task.status}
                </span>
              </div>
              
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight leading-tight">
                {task.title}
              </h1>

              {task.description ? (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</h4>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line font-medium">
                    {task.description}
                  </p>
                </div>
              ) : (
                <p className="text-slate-400 text-xs italic">No description provided for this task.</p>
              )}

              {/* Tags row */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-slate-400 text-xs font-semibold"><Tag className="w-3.5 h-3.5 inline mr-1" /> Tags:</span>
                  {task.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-xs font-bold">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Subtasks checklist Section */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-500" />
                  Subtasks & Execution Steps
                </h3>
                <button
                  onClick={handleGenerateAISubtasks}
                  disabled={aiLoading}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 border border-indigo-100"
                >
                  {aiLoading ? (
                    <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  AI Break Down
                </button>
              </div>

              {/* Subtasks checklist list */}
              {(!task.subtasks || task.subtasks.length === 0) ? (
                <p className="text-slate-400 text-xs italic py-4 text-center">No subtasks recorded. Click "AI Break Down" to automatically generate milestones.</p>
              ) : (
                <div className="space-y-2.5">
                  {task.subtasks.map((sub) => (
                    <div 
                      key={sub._id || sub.title}
                      onClick={() => handleToggleSubtask(sub._id)}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 cursor-pointer transition-colors ${
                        sub.completed ? 'bg-emerald-50/30 border-emerald-100 text-slate-400' : 'bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      {sub.completed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                      <span className={`text-xs font-medium ${sub.completed ? 'line-through' : 'text-slate-700'}`}>
                        {sub.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Manual Add Subtask Form */}
              <form onSubmit={handleAddSubtask} className="flex gap-2 pt-3">
                <input
                  type="text"
                  placeholder="Add custom execution step..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-0.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </form>
            </div>

            {/* Extracted text block (OCR/PDF) */}
            {task.extractedText && (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" /> Extracted Origin Text Snippet
                </h4>
                <div className="bg-white p-3 rounded-lg border border-slate-200 text-slate-500 text-xs font-mono max-h-36 overflow-y-auto whitespace-pre-wrap">
                  {task.extractedText}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar / Stats details */}
          <div className="space-y-6">
            {/* Smart Score explanation */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Smart Score Details</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">{task.priorityScore}</span>
                <span className="text-slate-400 text-sm">/ 120 pts</span>
              </div>
              
              <div className="space-y-3 pt-2 border-t border-slate-800 text-xs text-slate-300">
                <div>
                  <strong className="block text-slate-400 font-semibold mb-0.5">Scoring Explanation:</strong>
                  <p className="leading-relaxed font-medium text-white">{task.priorityReason || 'Calculated score values.'}</p>
                </div>
              </div>

              {task.status !== 'COMPLETED' ? (
                <button
                  onClick={handleToggleStatus}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" /> Complete Task
                </button>
              ) : (
                <button
                  onClick={handleToggleStatus}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" /> Reopen Task
                </button>
              )}
            </div>

            {/* Basic Schedule stats details */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-xs font-medium text-slate-600">
              <h3 className="font-bold text-slate-800 pb-2 border-b border-slate-50 text-sm">Task Metadata</h3>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Due Date:</span>
                <span className="font-bold text-slate-700">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Est. Duration:</span>
                <span className="font-bold text-slate-700">{task.estimatedMinutes} minutes</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Import Source:</span>
                <span className="font-bold text-indigo-600 capitalize">{task.source || 'manual'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Created On:</span>
                <span className="text-slate-500">{new Date(task.createdAt).toLocaleDateString()}</span>
              </div>

              {task.completedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Completed On:</span>
                  <span className="text-emerald-600 font-bold">{new Date(task.completedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
