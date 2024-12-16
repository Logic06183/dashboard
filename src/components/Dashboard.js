import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, Menu, Bell } from 'lucide-react';
import NavItem from './NavItem';
import StatsCard from './StatsCard';
import OrderForm from './OrderForm';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import OrdersPage from './pages/OrdersPage';
import SettingsPage from './pages/SettingsPage';
import useLocalStorage from '../hooks/useLocalStorage';
import CountdownTimer from './CountdownTimer';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orders, setOrders] = useLocalStorage('pizzaOrders', []);

  const handleNewOrder = (order) => {
    setOrders(prev => [order, ...prev]);
    setShowOrderForm(false);
  };

  const clearOrders = () => {
    setOrders([]);
  };

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300`}>
          <div className="p-4 flex items-center justify-between">
            {sidebarOpen && <h1 className="text-xl font-bold">John Dough's</h1>}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu size={24} />
            </button>
          </div>
          
          <nav className="mt-8">
            <NavItem to="/" icon={<LayoutDashboard />} label="Dashboard" expanded={sidebarOpen} />
            <NavItem to="/customers" icon={<Users />} label="Customers" expanded={sidebarOpen} />
            <NavItem to="/orders" icon={<FileText />} label="Orders" expanded={sidebarOpen} />
            <NavItem to="/settings" icon={<Settings />} label="Settings" expanded={sidebarOpen} />
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <header className="bg-white shadow-sm">
            <div className="flex items-center justify-between p-4">
              <h1 className="text-2xl font-semibold">Pizza Orders Dashboard</h1>
              <div className="flex items-center space-x-4">
                <button
                  onClick={clearOrders}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Clear Orders
                </button>
                <button
                  onClick={() => setShowOrderForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  New Order
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100 relative">
                  <Bell size={24} />
                  {orders.filter(o => o.status === 'pending').length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
              </div>
            </div>
          </header>

          <StatsCard 
            title="Some Title"
            value="123"
            change="+10%"
          />

          <Routes>
            <Route 
              path="/" 
              element={
                <DashboardPage 
                  orders={orders}
                  setOrders={setOrders}
                  showOrderForm={showOrderForm}
                  setShowOrderForm={setShowOrderForm}
                  handleNewOrder={handleNewOrder}
                />
              } 
            />
            <Route path="/customers" element={<CustomersPage orders={orders} />} />
            <Route path="/orders" element={<OrdersPage orders={orders} setOrders={setOrders} />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default Dashboard;