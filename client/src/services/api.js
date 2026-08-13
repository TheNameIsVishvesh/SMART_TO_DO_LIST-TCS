import axios from 'axios';

// API base client setup. Dev requests are routed through Vite proxy config.
const apiClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Tasks CRUD operations
  getTasks: (params) => apiClient.get('/api/tasks', { params }).then(res => res.data),
  getTaskById: (id) => apiClient.get(`/api/tasks/${id}`).then(res => res.data),
  createTask: (data) => apiClient.post('/api/tasks', data).then(res => res.data),
  updateTask: (id, data) => apiClient.put(`/api/tasks/${id}`, data).then(res => res.data),
  deleteTask: (id) => apiClient.delete(`/api/tasks/${id}`).then(res => res.data),
  
  completeTask: (id) => apiClient.post(`/api/tasks/${id}/complete`).then(res => res.data),
  reopenTask: (id) => apiClient.post(`/api/tasks/${id}/reopen`).then(res => res.data),
  seedDemoData: () => apiClient.post('/api/tasks/seed').then(res => res.data),

  // File Uploads & Task Processing
  importCSV: (formData) => apiClient.post('/api/import/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data),
  
  importPDF: (formData) => apiClient.post('/api/import/pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data),
  
  importImage: (formData) => apiClient.post('/api/import/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data),
  
  confirmImport: (tasks) => apiClient.post('/api/import/confirm', { tasks }).then(res => res.data),

  // AI Services
  getRecommendations: () => apiClient.post('/api/ai/recommend').then(res => res.data),
  chatWithAI: (message) => apiClient.post('/api/ai/chat', { message }).then(res => res.data),
  generateSchedule: (hours) => apiClient.post('/api/ai/schedule', { availableHours: hours }).then(res => res.data),
  generateSubtasks: (taskId, title, description) => apiClient.post('/api/ai/subtasks', { taskId, title, description }).then(res => res.data),

  // Analytics
  getAnalytics: () => apiClient.get('/api/analytics').then(res => res.data),

  // Export Links (Return absolute download URLs)
  getExportCSVUrl: () => '/api/export/csv',
  getExportExcelUrl: () => '/api/export/excel',
  getExportPDFUrl: () => '/api/export/pdf'
};
