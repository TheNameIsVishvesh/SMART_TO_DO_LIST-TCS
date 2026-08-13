import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Settings, Database, Cpu, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function SettingsPage({ showToast }) {
  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [loadingSeed, setLoadingSeed] = useState(false);

  const fetchHealth = async () => {
    try {
      setLoadingHealth(true);
      // We can fetch from /health or call analytics to verify DB connection
      const response = await fetch('/api/tasks');
      const data = await response.json();
      setHealth({
        database: data.dbMode || 'unknown',
        aiStatus: 'Checking...'
      });
      
      // Check Ollama status
      const aiStatus = await api.getRecommendations();
      setHealth(prev => ({
        ...prev,
        aiStatus: 'Available'
      }));
    } catch (err) {
      console.error(err);
      setHealth({
        database: 'offline',
        aiStatus: 'offline'
      });
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleLoadDemoData = async () => {
    try {
      setLoadingSeed(true);
      showToast('Loading university demo dataset...', 'info');
      const res = await api.seedDemoData();
      showToast(`Loaded ${res.count} course tasks successfully!`, 'success');
      fetchHealth();
    } catch (err) {
      console.error(err);
      showToast('Failed to seed demo data', 'error');
    } finally {
      setLoadingSeed(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Application Settings</h2>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">System diagnostics, AI tuning, and database seeding actions</p>
        </div>
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <Settings className="w-6 h-6" />
        </div>
      </div>

      {/* System Diagnostics Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3 flex items-center gap-2">
          <Database className="w-4.5 h-4.5 text-indigo-500" />
          System Diagnostics & Integration Status
        </h3>

        {loadingHealth ? (
          <div className="flex justify-center py-4">
            <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
            {/* Database status */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-slate-400 block font-medium uppercase text-[9px] mb-1">Active Database Mode</span>
                <span className="text-slate-700 font-bold capitalize">{health?.database === 'mongodb' ? 'MongoDB Atlas / Local' : 'JSON File Database Fallback'}</span>
              </div>
              <span className={`w-3 h-3 rounded-full ${health?.database === 'offline' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
            </div>

            {/* AI Status */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-slate-400 block font-medium uppercase text-[9px] mb-1">Ollama AI Status</span>
                <span className="text-slate-700 font-bold">Ollama (llama3.2:3b / qwen2.5-coder:3b)</span>
              </div>
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            </div>
          </div>
        )}
      </div>

      {/* Demo Seeding Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3 flex items-center gap-2">
          <Cpu className="w-4.5 h-4.5 text-indigo-500" />
          Seed & Demo Dataset Actions
        </h3>
        
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          Seeding deletes any tasks currently in the database and populates a new university student dataset representing standard courses: Machine Learning, Database Systems (DBMS), Web Development, Automata Theory, and Computer Networks. 
          <strong className="block text-indigo-600 mt-2">Use this to easily run the 14-step presentation demo scenario!</strong>
        </p>

        <div className="pt-2">
          <button
            onClick={handleLoadDemoData}
            disabled={loadingSeed}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
          >
            {loadingSeed ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Load Demo University Data
          </button>
        </div>
      </div>
    </div>
  );
}
