import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  PlusCircle,
  CalendarRange,
  MessageSquareCode,
  FileUp,
  LineChart,
  FileSpreadsheet,
  BellRing,
  Settings,
  BrainCircuit
} from 'lucide-react';

export default function Sidebar() {
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'All Tasks', path: '/tasks', icon: ListTodo },
    { name: 'Add Task', path: '/add-task', icon: PlusCircle },
    { name: 'Smart Schedule', path: '/schedule', icon: CalendarRange },
    { name: 'AI Assistant', path: '/ai-assistant', icon: MessageSquareCode },
    { name: 'Import Tasks', path: '/import', icon: FileUp },
    { name: 'Analytics', path: '/analytics', icon: LineChart },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { name: 'Alerts', path: '/alerts', icon: BellRing },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800">
      {/* Title / Logo header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <BrainCircuit className="w-8 h-8 text-indigo-400 animate-pulse" />
        <div>
          <h1 className="font-bold text-lg tracking-tight text-white">Smart To-Do</h1>
          <span className="text-xs text-indigo-400 font-semibold tracking-wider uppercase">TCS | CHARUSAT</span>
        </div>
      </div>
      
      {/* Navigation Items */}
      <nav className="flex-1 p-4 overflow-y-auto space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer information */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="text-center text-xs text-slate-500">
          <p className="font-semibold text-slate-400">Use Case 23: Smart To-Do</p>
          <p className="mt-1">© 2026 University Submission</p>
        </div>
      </div>
    </aside>
  );
}
