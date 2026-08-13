import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Plus, Search, Filter, Edit, Trash2, CheckCircle, Circle, Clock } from 'lucide-react';

export default function AllTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await apiService.getTasks();
      setTasks(res.data || []);
    } catch (e) {
      console.error(e);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const taskData = {
      title,
      description,
      priority,
      category: category || 'General',
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
    };

    const taskId = editingTask ? (editingTask._id || editingTask.id) : null;

    if (taskId) {
      await apiService.updateTask(taskId, taskData);
    } else {
      await apiService.createTask(taskData);
    }
    setIsModalOpen(false);
    resetForm();
    fetchTasks();
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setTitle(task.title || '');
    setDescription(task.description || '');
    setPriority(task.priority || 'MEDIUM');
    setCategory(task.category || '');
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    setIsModalOpen(true);
  };

  const handleDelete = async (task) => {
    const id = task._id || task.id;
    if (confirm('Are you sure you want to delete this task?')) {
      await apiService.deleteTask(id);
      fetchTasks();
    }
  };

  const toggleStatus = async (task) => {
    const id = task._id || task.id;
    if (task.status === 'COMPLETED') {
      await apiService.reopenTask(id);
    } else {
      await apiService.completeTask(id);
    }
    fetchTasks();
  };

  const resetForm = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setCategory('');
    setDueDate('');
  };

  const openNewTaskModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = (t.title || '').toLowerCase().includes(search.toLowerCase()) || 
                          (t.description || '').toLowerCase().includes(search.toLowerCase()) ||
                          (t.category || '').toLowerCase().includes(search.toLowerCase());
    
    let matchesStatus = true;
    if (filterStatus === 'OVERDUE') {
      matchesStatus = t.status === 'OVERDUE' || (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED');
    } else if (['HIGH', 'MEDIUM', 'LOW'].includes(filterStatus)) {
      matchesStatus = t.priority === filterStatus;
    } else if (filterStatus === 'IN_PROGRESS' || filterStatus === 'IN PROGRESS') {
      matchesStatus = t.status === 'IN_PROGRESS' || t.status === 'IN PROGRESS';
    } else if (filterStatus !== 'ALL') {
      matchesStatus = t.status === filterStatus;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">All Tasks</h1>
        <Button onClick={openNewTaskModal}><Plus className="mr-2 h-4 w-4" /> Add Task</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg shadow-sm border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks by title, description, category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-md border border-input bg-background pl-9 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Tasks</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="OVERDUE">Overdue</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center p-12 border border-dashed rounded-lg bg-card">
          <h3 className="text-lg font-medium">No tasks found</h3>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map(task => {
            const taskId = task._id || task.id;
            return (
              <div key={taskId} className={`flex items-start justify-between p-4 bg-card border rounded-lg shadow-sm transition-all hover:shadow-md ${task.status === 'COMPLETED' ? 'opacity-70' : ''}`}>
                <div className="flex items-start space-x-4">
                  <button onClick={() => toggleStatus(task)} className="mt-1">
                    {task.status === 'COMPLETED' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                  </button>
                  <div>
                    <h3 className={`font-medium ${task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</h3>
                    {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Badge variant={task.priority === 'HIGH' ? 'destructive' : task.priority === 'MEDIUM' ? 'warning' : 'secondary'}>
                        {task.priority || 'MEDIUM'}
                      </Badge>
                      <Badge variant={task.status === 'COMPLETED' ? 'success' : task.status === 'OVERDUE' ? 'destructive' : 'outline'}>
                        {task.status === 'IN_PROGRESS' ? 'IN PROGRESS' : task.status}
                      </Badge>
                      {task.category && <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">{task.category}</span>}
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(task)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(task)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTask ? "Edit Task" : "Add Task"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Task title" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary h-24" placeholder="Task description"></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. Frontend" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save Task</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
