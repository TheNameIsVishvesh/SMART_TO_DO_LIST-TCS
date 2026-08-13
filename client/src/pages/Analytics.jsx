import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { LineChart as ChartIcon, CheckSquare, Clock, AlertTriangle, CircleDot } from 'lucide-react';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const PRIORITY_COLORS = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#10b981'
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-semibold">Generating database insights...</p>
      </div>
    );
  }

  const priorityData = [
    { name: 'High', value: data.priorityBreakdown.HIGH },
    { name: 'Medium', value: data.priorityBreakdown.MEDIUM },
    { name: 'Low', value: data.priorityBreakdown.LOW }
  ];

  const statusData = [
    { name: 'Todo', value: data.statusBreakdown.TODO },
    { name: 'In Progress', value: data.statusBreakdown.IN_PROGRESS },
    { name: 'Completed', value: data.statusBreakdown.COMPLETED },
    { name: 'Overdue', value: data.statusBreakdown.OVERDUE }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Productivity Analytics</h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">Deep-dive metrics and charts for study activities</p>
        </div>
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <ChartIcon className="w-6 h-6" />
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <CircleDot className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Completion Rate</span>
            <span className="text-xl font-extrabold text-slate-800">{data.completionPercentage}%</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Done Tasks</span>
            <span className="text-xl font-extrabold text-slate-800">{data.completedTasks}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Pending Tasks</span>
            <span className="text-xl font-extrabold text-slate-800">{data.pendingTasks}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Overdue Tasks</span>
            <span className="text-xl font-extrabold text-slate-800">{data.overdueTasks}</span>
          </div>
        </div>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Productivity Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Historical Progression (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.weeklyTrend}>
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

        {/* Priority Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Tasks by Priority (Pie)</h3>
          <div className="h-64 flex items-center justify-around">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill={PRIORITY_COLORS.HIGH} />
                    <Cell fill={PRIORITY_COLORS.MEDIUM} />
                    <Cell fill={PRIORITY_COLORS.LOW} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="w-3 h-3 rounded bg-red-500"></span> High Priority
                </span>
                <span className="font-bold text-slate-800">{data.priorityBreakdown.HIGH}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="w-3 h-3 rounded bg-amber-500"></span> Medium Priority
                </span>
                <span className="font-bold text-slate-800">{data.priorityBreakdown.MEDIUM}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="w-3 h-3 rounded bg-emerald-500"></span> Low Priority
                </span>
                <span className="font-bold text-slate-800">{data.priorityBreakdown.LOW}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Breakdown Bar chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Tasks by Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, index) => {
                    const statusColors = ['#94a3b8', '#3b82f6', '#10b981', '#ef4444'];
                    return <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Bar chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Syllabus Subject Breakdown</h3>
          <div className="h-64">
            {data.categoryBreakdown.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-20 font-medium">No tasks logged in database.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.categoryBreakdown} layout="vertical">
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={15}>
                    {data.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
