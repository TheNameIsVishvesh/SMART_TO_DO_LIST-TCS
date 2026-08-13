import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { PlusCircle, ArrowLeft, Calendar, Clock, Tag, BookOpen } from 'lucide-react';

export default function AddTask({ showToast }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Assignments');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [tagsInput, setTagsInput] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Task title is required', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      // Split tags comma-separated
      const tags = tagsInput
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

      const taskData = {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        dueDate: dueDate || null,
        estimatedMinutes: parseInt(estimatedMinutes, 10) || 0,
        tags,
        status: 'TODO',
        source: 'manual'
      };

      await api.createTask(taskData);
      showToast('Task created successfully!', 'success');
      navigate('/tasks');
    } catch (err) {
      console.error(err);
      showToast('Failed to create task', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex items-center gap-3">
        <Link
          to="/tasks"
          className="p-2 bg-white border border-slate-100 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Add New Task</h2>
          <p className="text-slate-500 text-xs mt-0.5">Manually record a university course activity</p>
        </div>
      </div>

      {/* Task Creation Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        {/* Task Title */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase block">Task Title</label>
          <input
            type="text"
            required
            placeholder="e.g., Database Normalization Assignment"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Task Description */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase block">Description</label>
          <textarea
            placeholder="Outline task details, grading criteria, resources needed..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
          />
        </div>

        {/* Category & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase block flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> Category / Subject
            </label>
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
              <option value="LOW" className="text-emerald-600 font-bold">LOW</option>
              <option value="MEDIUM" className="text-amber-600 font-bold">MEDIUM</option>
              <option value="HIGH" className="text-rose-600 font-bold">HIGH</option>
            </select>
          </div>
        </div>

        {/* Due Date & Estimated Duration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase block flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase block flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Est. Duration (Minutes)
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g., 90"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase block flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" /> Tags (Comma separated)
          </label>
          <input
            type="text"
            placeholder="e.g., sql, normalization, assignment"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
          <Link
            to="/tasks"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <PlusCircle className="w-4 h-4" />
            )}
            Save Task
          </button>
        </div>
      </form>
    </div>
  );
}
