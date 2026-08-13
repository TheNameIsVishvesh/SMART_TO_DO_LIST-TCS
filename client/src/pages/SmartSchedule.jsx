import React, { useState } from 'react';
import { api } from '../services/api';
import { CalendarRange, Sparkles, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function SmartSchedule({ showToast }) {
  const [hours, setHours] = useState(6);
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);

  const handleGenerateSchedule = async () => {
    try {
      setLoading(true);
      const res = await api.generateSchedule(hours);
      setScheduleData(res);
      showToast('Study schedule generated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to generate smart schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSchedule = async () => {
    if (!scheduleData || !scheduleData.schedule || scheduleData.schedule.length === 0) return;
    
    try {
      setApplying(true);
      // For each task in the schedule, mark it as 'IN_PROGRESS'
      const updatePromises = scheduleData.schedule.map(item => {
        if (item.taskId) {
          return api.updateTask(item.taskId, { status: 'IN_PROGRESS' });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      showToast("Schedule accepted! Selected tasks set to 'In Progress'.", 'success');
    } catch (err) {
      console.error(err);
      showToast('Error applying schedule to tasks', 'error');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Smart Scheduler</h2>
          <p className="text-slate-500 text-xs mt-0.5">Let AI build a time-boxed study routine based on task scores</p>
        </div>
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <CalendarRange className="w-6 h-6" />
        </div>
      </div>

      {/* Inputs Configuration card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 flex-1">
            <label className="text-xs font-bold text-slate-500 uppercase block">Available Study Hours Today</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="2"
                max="12"
                step="1"
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="bg-slate-100 px-3 py-1 border border-slate-200 text-slate-700 font-bold rounded-lg text-sm flex-shrink-0">
                {hours} Hours
              </span>
            </div>
          </div>

          <button
            onClick={handleGenerateSchedule}
            disabled={loading}
            className="w-full md:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate Study Plan
          </button>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 flex gap-2">
          <Clock className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
          <p>
            The scheduling engine prioritizes incomplete assignments based on their urgency, estimated effort, and overdue flag. It also schedules 15-minute breaks in between tasks to maintain focus.
          </p>
        </div>
      </div>

      {/* Generated Schedule Timeline output */}
      {scheduleData && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">Recommended Daily Study Timeline</h3>
              <p className="text-xs text-slate-400 mt-0.5">Date: {new Date(scheduleData.date).toLocaleDateString()} | Total study time: {Math.round(scheduleData.totalAllocatedMinutes / 60)} hrs</p>
            </div>
            
            <button
              onClick={handleAcceptSchedule}
              disabled={applying || scheduleData.schedule.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              Accept Schedule
            </button>
          </div>

          {scheduleData.schedule.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2 opacity-50" />
              <h4 className="text-sm font-bold text-slate-700">No tasks to schedule</h4>
              <p className="text-slate-500 text-xs mt-1">You have no incomplete or pending tasks to schedule today!</p>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-slate-150 space-y-8 py-2">
              {scheduleData.schedule.map((item, index) => (
                <div key={index} className="relative">
                  {/* Bullet point node */}
                  <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white bg-indigo-500 ring-4 ring-indigo-50 flex-shrink-0"></span>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:border-indigo-150 hover:bg-indigo-50/10 transition-all duration-200">
                    <div>
                      <span className="text-xs text-indigo-600 font-bold block mb-1">{item.timeSlot} ({item.durationMinutes}m)</span>
                      <h4 className="font-extrabold text-slate-800 text-sm">{item.taskTitle}</h4>
                      <div className="flex gap-1.5 mt-2">
                        <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-500 rounded text-[10px] font-semibold uppercase">{item.category}</span>
                        <span className={`px-2 py-0.5 border rounded text-[10px] font-bold ${item.priority === 'HIGH' ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-slate-500 bg-white border-slate-200'}`}>{item.priority}</span>
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs text-slate-400 font-semibold">Break follows</span>
                      <span className="block text-[10px] text-slate-400">15 minutes resting window</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
