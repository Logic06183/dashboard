import React, { useState } from 'react';
import { LayoutDashboard, Users, FileText, Settings, Menu, Bell } from 'lucide-react';
import NavItem from './NavItem';
import StatsCard from './StatsCard';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300`}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">Dashboard</h1>}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={24} />
          </button>
        </div>
        
        <nav className="mt-8">
          <NavItem icon={<LayoutDashboard />} label="Dashboard" active={true} expanded={sidebarOpen} />
          <NavItem icon={<Users />} label="Users" expanded={sidebarOpen} />
          <NavItem icon={<FileText />} label="Reports" expanded={sidebarOpen} />
          <NavItem icon={<Settings />} label="Settings" expanded={sidebarOpen} />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-2xl font-semibold">Overview</h1>
            <button className="p-2 rounded-full hover:bg-gray-100 relative">
              <Bell size={24} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatsCard title="Total Users" value="1,234" change="+12%" />
            <StatsCard title="Revenue" value="$12,345" change="+8%" />
            <StatsCard title="Active Users" value="892" change="+5%" />
            <StatsCard title="Conversion Rate" value="2.4%" change="-1%" />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;