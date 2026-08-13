import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import AllTasks from './pages/AllTasks';
import Placeholder from './pages/Placeholder';
import { Calendar, Bot, Import, BarChart3, FileText, Bell } from 'lucide-react';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="tasks" element={<AllTasks />} />
        <Route path="schedule" element={
          <Placeholder 
            title="Smart Schedule" 
            description="View and manage your tasks on a calendar view. This area will integrate with the backend scheduling engine."
            icon={Calendar} 
          />
        } />
        <Route path="ai-assistant" element={
          <Placeholder 
            title="AI Assistant" 
            description="Chat with your smart assistant to manage tasks naturally. Pending AI integration."
            icon={Bot} 
          />
        } />
        <Route path="import" element={
          <Placeholder 
            title="Import Tasks" 
            description="Import your tasks from other tools like Notion, Trello, or CSV files."
            icon={Import} 
          />
        } />
        <Route path="analytics" element={
          <Placeholder 
            title="Analytics" 
            description="Deep dive into your productivity metrics and trends over time."
            icon={BarChart3} 
          />
        } />
        <Route path="reports" element={
          <Placeholder 
            title="Reports" 
            description="Generate and download detailed reports of your tasks and time tracking."
            icon={FileText} 
          />
        } />
        <Route path="alerts" element={
          <Placeholder 
            title="Alerts" 
            description="Manage your notification preferences and view recent system alerts."
            icon={Bell} 
          />
        } />
      </Route>
    </Routes>
  );
}

export default App;
