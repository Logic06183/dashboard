import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { MdDashboard, MdPeople, MdDescription, MdSettings, MdMenu, MdNotifications, MdInventory } from 'react-icons/md';
import NavItem from './NavItem';
import StatsCard from './StatsCard';
import OrderForm from './OrderForm';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import OrdersPage from './pages/OrdersPage';
import SettingsPage from './pages/SettingsPage';
import InventoryPage from './pages/InventoryPage';
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

  const sidebarItems = [
    {
      name: 'Dashboard',
      icon: <MdDashboard className="w-6 h-6" />,
      path: '/',
    },
    {
      name: 'Customers',
      icon: <MdPeople className="w-6 h-6" />,
      path: '/customers',
    },
    {
      name: 'Orders',
      icon: <MdDescription className="w-6 h-6" />,
      path: '/orders',
    },
    {
      name: 'Inventory',
      icon: <MdInventory className="w-6 h-6" />,
      path: '/inventory',
    },
    {
      name: 'Settings',
      icon: <MdSettings className="w-6 h-6" />,
      path: '/settings',
    },
  ];

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
              <MdMenu size={24} />
            </button>
          </div>
          
          <nav className="mt-8">
            {sidebarItems.map((item, index) => (
              <NavItem key={index} to={item.path} icon={item.icon} label={item.name} expanded={sidebarOpen} />
            ))}
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
                  <MdNotifications size={24} />
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

          {showOrderForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" style={{position: 'fixed', zIndex: 9999}}>
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
                <OrderForm 
                  onSubmit={handleNewOrder} 
                  orders={orders}
                  setShowOrderForm={setShowOrderForm}
                />
              </div>
            </div>
          )}

          <Routes>
            <Route 
              path="/" 
              element={(
                <DashboardPage 
                  orders={orders}
                  setOrders={setOrders}
                  showOrderForm={showOrderForm}
                  setShowOrderForm={setShowOrderForm}
                  handleNewOrder={handleNewOrder}
                />
              )} 
            />
            <Route path="/customers" element={<CustomersPage orders={orders} />} />
            <Route path="/orders" element={<OrdersPage orders={orders} setOrders={setOrders} />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default Dashboard;