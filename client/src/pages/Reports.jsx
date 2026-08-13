import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { FileSpreadsheet, FileText, Download, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

export default function Reports({ showToast }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = (format) => {
    showToast(`Downloading study report as ${format.toUpperCase()}...`, 'info');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-semibold">Preparing productivity metrics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Reports and Exports</h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">Export university task logs and progress figures for submission</p>
        </div>
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Statistics card */}
        <div className="md:col-span-1 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-xs font-semibold text-slate-500">
          <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">Task Summary</h3>
          
          <div className="flex justify-between">
            <span>Total Tasks Logged:</span>
            <span className="text-slate-800 font-bold">{stats.totalTasks}</span>
          </div>
          <div className="flex justify-between">
            <span>Completed Tasks:</span>
            <span className="text-emerald-600 font-bold">{stats.completedTasks} ({stats.completionPercentage}%)</span>
          </div>
          <div className="flex justify-between">
            <span>Pending Tasks:</span>
            <span className="text-amber-600 font-bold">{stats.pendingTasks}</span>
          </div>
          <div className="flex justify-between text-rose-600">
            <span>Overdue Tasks:</span>
            <span className="font-extrabold">{stats.overdueTasks}</span>
          </div>
          <div className="flex justify-between">
            <span>Urgent High Priority:</span>
            <span className="text-rose-500 font-bold">{stats.highPriorityTasks}</span>
          </div>
        </div>

        {/* Export options */}
        <div className="md:col-span-2 space-y-4">
          {/* PDF export */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Productivity Analytics Report (PDF)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Generates a stylized PDF containing completion stats and full task registry table</p>
              </div>
            </div>
            <a
              href={api.getExportPDFUrl()}
              onClick={() => handleDownload('pdf')}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-600/10 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Download PDF
            </a>
          </div>

          {/* Excel export */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Excel Compatible Sheet (CSV)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Exports task files with a UTF-8 BOM prefix ensuring proper column rendering in MS Excel</p>
              </div>
            </div>
            <a
              href={api.getExportExcelUrl()}
              onClick={() => handleDownload('excel')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/10 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Download XLS
            </a>
          </div>

          {/* CSV export */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Standard CSV Tasks Backup</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Standard comma-separated value database dump of raw course tasks for migrations</p>
              </div>
            </div>
            <a
              href={api.getExportCSVUrl()}
              onClick={() => handleDownload('csv')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Export CSV
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
