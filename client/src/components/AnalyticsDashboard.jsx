import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Download, AlertCircle, CheckCircle, Clock, ListTodo } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const API_BASE_URL = 'http://localhost:5000/api'; // Adjust as per your environment

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, alertsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/analytics`),
        axios.get(`${API_BASE_URL}/alerts`)
      ]);
      setAnalytics(analyticsRes.data);
      setAlerts(alertsRes.data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format) => {
    window.open(`${API_BASE_URL}/export/${format}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 font-sans">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Analytics & Reports
          </h1>
          <p className="text-gray-400 mt-1">Smart To-Do List Assistant</p>
        </div>
        
        <div className="flex gap-3 mt-4 md:mt-0">
          <button 
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-rose-900/20"
          >
            <Download size={16} /> PDF
          </button>
          <button 
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20"
          >
            <Download size={16} /> Excel
          </button>
          <button 
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20"
          >
            <Download size={16} /> CSV
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Tasks" 
          value={analytics?.totalTasks || 0} 
          icon={<ListTodo className="text-blue-400" />} 
          bgColor="bg-blue-500/10" 
        />
        <StatCard 
          title="Completed" 
          value={analytics?.completedTasks || 0} 
          icon={<CheckCircle className="text-emerald-400" />} 
          bgColor="bg-emerald-500/10" 
        />
        <StatCard 
          title="Pending" 
          value={analytics?.pendingTasks || 0} 
          icon={<Clock className="text-amber-400" />} 
          bgColor="bg-amber-500/10" 
        />
        <StatCard 
          title="Completion Rate" 
          value={`${analytics?.completionPercentage || 0}%`} 
          icon={<AlertCircle className="text-purple-400" />} 
          bgColor="bg-purple-500/10" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-500 rounded-full inline-block"></span>
              Weekly Productivity
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.weeklyCompletion || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="_id" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#F3F4F6' }} 
                  />
                  <Line type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={3} dot={{ r: 4, fill: '#6366F1' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4">Task Status</h2>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.tasksByStatus || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="_id"
                    >
                      {analytics?.tasksByStatus?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4">Priority Distribution</h2>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics?.tasksByPriority || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="_id" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} cursor={{ fill: '#374151' }} />
                    <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl h-full flex flex-col">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <AlertCircle className="text-rose-500" />
              Smart Alerts
            </h2>
            
            <div className="space-y-6 flex-1 overflow-auto pr-2 custom-scrollbar">
              <AlertSection 
                title="Overdue Tasks" 
                count={alerts?.overdueTasks?.length || 0}
                items={alerts?.overdueTasks}
                color="rose"
              />
              <AlertSection 
                title="Due Today" 
                count={alerts?.tasksDueToday?.length || 0}
                items={alerts?.tasksDueToday}
                color="amber"
              />
              <AlertSection 
                title="High Priority Needs Attention" 
                count={alerts?.highPriorityIncompleteTasks?.length || 0}
                items={alerts?.highPriorityIncompleteTasks}
                color="indigo"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bgColor }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex items-center justify-between group hover:border-gray-700 transition-colors">
      <div>
        <p className="text-sm text-gray-400 font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold text-white group-hover:scale-105 transition-transform origin-left">{value}</p>
      </div>
      <div className={`p-4 rounded-xl ${bgColor}`}>
        {icon}
      </div>
    </div>
  );
}

function AlertSection({ title, count, items, color }) {
  if (!items || items.length === 0) return null;
  
  const colorMap = {
    rose: 'border-rose-500/30 bg-rose-500/5',
    amber: 'border-amber-500/30 bg-amber-500/5',
    indigo: 'border-indigo-500/30 bg-indigo-500/5'
  };

  const textMap = {
    rose: 'text-rose-400',
    amber: 'text-amber-400',
    indigo: 'text-indigo-400'
  };

  return (
    <div className={`border rounded-xl p-4 ${colorMap[color]}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`font-semibold ${textMap[color]}`}>{title}</h3>
        <span className={`text-xs font-bold px-2 py-1 rounded-full bg-gray-800 ${textMap[color]}`}>
          {count}
        </span>
      </div>
      <ul className="space-y-2">
        {items.slice(0, 5).map(task => (
          <li key={task._id} className="text-sm text-gray-300 flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-current mt-1.5 flex-shrink-0"></span>
            <span className="line-clamp-1">{task.title}</span>
          </li>
        ))}
        {count > 5 && (
          <li className="text-xs text-gray-500 italic text-center mt-2">
            + {count - 5} more
          </li>
        )}
      </ul>
    </div>
  );
}
