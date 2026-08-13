import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Calendar, Bot, Import, BarChart3, FileText, Bell, Search, Menu, User } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'All Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Smart Schedule', href: '/schedule', icon: Calendar },
    { name: 'AI Assistant', href: '/ai-assistant', icon: Bot },
    { name: 'Import Tasks', href: '/import', icon: Import },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Alerts', href: '/alerts', icon: Bell },
  ];

  return (
    <div className="flex h-screen bg-secondary">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 bg-black/50 transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)} />
      
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center px-6 border-b">
          <CheckSquare className="h-6 w-6 text-primary mr-2" />
          <span className="text-lg font-bold">Smart To-Do</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} aria-hidden="true" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topnav */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 sm:px-6">
          <div className="flex items-center">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground lg:hidden mr-4"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full rounded-md border bg-background pl-9 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-muted-foreground hover:text-foreground relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
            </button>
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
              <User className="h-4 w-4" />
            </div>
          </div>
        </header>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-auto bg-background/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
