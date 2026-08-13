import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';

// Pages
import Dashboard from './pages/Dashboard';
import AllTasks from './pages/AllTasks';
import AddTask from './pages/AddTask';
import TaskDetails from './pages/TaskDetails';
import SmartSchedule from './pages/SmartSchedule';
import AIAssistant from './pages/AIAssistant';
import ImportTasks from './pages/ImportTasks';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';

export default function App() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  return (
    <Router>
      <div className="flex bg-slate-50 min-h-screen">
        {/* Sidebar Navigation */}
        <Sidebar />
        
        {/* Main Content Area */}
        <main className="flex-1 ml-64 p-8 min-h-screen overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard showToast={showToast} />} />
              <Route path="/tasks" element={<AllTasks showToast={showToast} />} />
              <Route path="/add-task" element={<AddTask showToast={showToast} />} />
              <Route path="/task/:id" element={<TaskDetails showToast={showToast} />} />
              <Route path="/schedule" element={<SmartSchedule showToast={showToast} />} />
              <Route path="/ai-assistant" element={<AIAssistant showToast={showToast} />} />
              <Route path="/import" element={<ImportTasks showToast={showToast} />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/reports" element={<Reports showToast={showToast} />} />
              <Route path="/alerts" element={<Alerts showToast={showToast} />} />
              <Route path="/settings" element={<Settings showToast={showToast} />} />
            </Routes>
          </div>
        </main>

        {/* Global Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={closeToast}
          />
        )}
      </div>
    </Router>
  );
}
