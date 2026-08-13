import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { BellRing, AlertTriangle, AlertCircle, Calendar, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Alerts({ showToast }) {
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalytics();
      setAlerts(res);
    } catch (err) {
      console.error(err);
      showToast('Error loading alerts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-semibold">Scanning task schedules for alerts...</p>
      </div>
    );
  }

  // Filter tasks based on alert types
  const overdueAlerts = alerts.overdueAlerts || [];
  const upcomingDeadlines = alerts.upcomingDeadlines || [];
  
  // Categorize deadlines: Due Today, Due Tomorrow, or soon
  const todayString = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowString = tomorrow.toISOString().split('T')[0];

  const dueToday = upcomingDeadlines.filter(t => {
    const dStr = new Date(t.dueDate).toISOString().split('T')[0];
    return dStr === todayString;
  });

  const dueTomorrow = upcomingDeadlines.filter(t => {
    const dStr = new Date(t.dueDate).toISOString().split('T')[0];
    return dStr === tomorrowString;
  });

  const soonTasks = upcomingDeadlines.filter(t => {
    const dStr = new Date(t.dueDate).toISOString().split('T')[0];
    return dStr !== todayString && dStr !== tomorrowString;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Alerts & Notification Center</h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">Critical warnings and approaching study deadlines</p>
        </div>
        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl relative">
          <BellRing className="w-6 h-6 animate-swing" />
          {(overdueAlerts.length > 0 || dueToday.length > 0) && (
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
          )}
        </div>
      </div>

      {/* Grid displays */}
      <div className="space-y-6">
        {/* OVERDUE ALERTS (RED BOX) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-rose-600 flex items-center gap-2 border-b border-slate-50 pb-3">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            Overdue Tasks Requiring Immediate Action ({overdueAlerts.length})
          </h3>
          
          {overdueAlerts.length === 0 ? (
            <p className="text-slate-400 text-xs italic py-2">Fantastic! You have no overdue assignments.</p>
          ) : (
            <div className="space-y-3">
              {overdueAlerts.map(t => (
                <div key={t._id} className="p-4 bg-rose-50/40 border border-rose-100 rounded-xl flex justify-between items-center gap-3">
                  <div>
                    <Link to={`/task/${t._id}`} className="font-extrabold text-slate-800 text-xs hover:text-indigo-600 transition-colors block">
                      {t.title}
                    </Link>
                    <span className="text-[10px] text-rose-600 font-semibold mt-1 block">
                      Due was: {new Date(t.dueDate).toLocaleDateString()} ({Math.ceil((new Date() - new Date(t.dueDate)) / (1000 * 60 * 60 * 24))} days overdue)
                    </span>
                  </div>
                  <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold">{t.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DUE TODAY ALERTS (AMBER BOX) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-amber-600 flex items-center gap-2 border-b border-slate-50 pb-3">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            Due Today - Critical Timelines ({dueToday.length})
          </h3>
          
          {dueToday.length === 0 ? (
            <p className="text-slate-400 text-xs italic py-2">No tasks are scheduled for submission today.</p>
          ) : (
            <div className="space-y-3">
              {dueToday.map(t => (
                <div key={t._id} className="p-4 bg-amber-50/40 border border-amber-100 rounded-xl flex justify-between items-center gap-3">
                  <div>
                    <Link to={`/task/${t._id}`} className="font-extrabold text-slate-800 text-xs hover:text-indigo-600 transition-colors block">
                      {t.title}
                    </Link>
                    <span className="text-[10px] text-amber-700 font-semibold mt-1 block">
                      Category: {t.category} | Estimated time: {t.estimatedMinutes}m
                    </span>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold">{t.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DUE TOMORROW ALERTS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-indigo-600 flex items-center gap-2 border-b border-slate-50 pb-3">
            <Calendar className="w-5 h-5 text-indigo-500" />
            Due Tomorrow - Upcoming Submissions ({dueTomorrow.length})
          </h3>
          
          {dueTomorrow.length === 0 ? (
            <p className="text-slate-400 text-xs italic py-2">No tasks are due tomorrow. You are ahead of schedule!</p>
          ) : (
            <div className="space-y-3">
              {dueTomorrow.map(t => (
                <div key={t._id} className="p-4 bg-indigo-50/20 border border-indigo-100 rounded-xl flex justify-between items-center gap-3">
                  <div>
                    <Link to={`/task/${t._id}`} className="font-extrabold text-slate-800 text-xs hover:text-indigo-600 transition-colors block">
                      {t.title}
                    </Link>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Category: {t.category} | Estimated: {t.estimatedMinutes}m
                    </span>
                  </div>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">{t.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* HIGH PRIORITY INCOMPLETE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2 border-b border-slate-50 pb-3">
            <AlertTriangle className="w-5 h-5 text-slate-400" />
            High Priority Pending Tasks ({soonTasks.length})
          </h3>
          
          {soonTasks.length === 0 ? (
            <p className="text-slate-400 text-xs italic py-2">No upcoming high priority tasks pending.</p>
          ) : (
            <div className="space-y-3">
              {soonTasks.map(t => (
                <div key={t._id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center gap-3">
                  <div>
                    <Link to={`/task/${t._id}`} className="font-extrabold text-slate-800 text-xs hover:text-indigo-600 transition-colors block">
                      {t.title}
                    </Link>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Due: {new Date(t.dueDate).toLocaleDateString()} | Subject: {t.category}
                    </span>
                  </div>
                  <span className="text-xs bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded font-bold">{t.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
