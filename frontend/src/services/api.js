import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  getTasks: async (params = {}) => {
    return api.get('/tasks', { params });
  },
  getTaskById: async (id) => {
    return api.get(`/tasks/${id}`);
  },
  createTask: async (taskData) => {
    return api.post('/tasks', taskData);
  },
  updateTask: async (id, taskData) => {
    return api.put(`/tasks/${id}`, taskData);
  },
  deleteTask: async (id) => {
    return api.delete(`/tasks/${id}`);
  },
  completeTask: async (id) => {
    return api.post(`/tasks/${id}/complete`);
  },
  reopenTask: async (id) => {
    return api.post(`/tasks/${id}/reopen`);
  },
  getDashboardStats: async () => {
    const res = await api.get('/tasks');
    const tasks = res.data || [];
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const pending = tasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS' || t.status === 'IN PROGRESS').length;
    const overdue = tasks.filter(t => t.status === 'OVERDUE' || (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED')).length;
    const highPriority = tasks.filter(t => t.priority === 'HIGH').length;
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      data: {
        total,
        completed,
        pending,
        overdue,
        highPriority,
        completionPercentage,
        tasks
      }
    };
  }
};

export default api;
