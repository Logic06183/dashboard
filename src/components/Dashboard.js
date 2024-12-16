import React, { useState } from 'react';
import { LayoutDashboard, Users, FileText, Settings, Menu, Bell, PlusCircle } from 'lucide-react';
import NavItem from './NavItem';
import StatsCard from './StatsCard';
import OrderForm from './OrderForm';
import useLocalStorage from '../hooks/useLocalStorage';

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

  const getTotalSales = () => {
    const prices = { small: 10, medium: 15, large: 20 };
    return orders.reduce((total, order) => {
      return total + prices[order.size] + (order.toppings.length * 1.5);
    }, 0);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300`}>
        <div className="p-4 flex items-center justify-between">
          {sidebarOpen && <h1 className="text-xl font-bold">Pizza Dashboard</h1>}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={24} />
          </button>
        </div>
        
        <nav className="mt-8">
          <NavItem icon={<LayoutDashboard />} label="Dashboard" active={true} expanded={sidebarOpen} />
          <NavItem icon={<Users />} label="Customers" expanded={sidebarOpen} />
          <NavItem icon={<FileText />} label="Orders" expanded={sidebarOpen} />
          <NavItem icon={<Settings />} label="Settings" expanded={sidebarOpen} />
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
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                <PlusCircle size={20} />
                <span>New Order</span>
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 relative">
                <Bell size={24} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        <main className="p-8">
          {showOrderForm ? (
            <OrderForm onSubmit={handleNewOrder} />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                <StatsCard title="Total Orders" value={orders.length} change={`+${orders.length}`} />
                <StatsCard title="Total Sales" value={`$${getTotalSales()}`} />
                <StatsCard title="Pending Orders" value={orders.filter(o => o.status === 'pending').length} />
                <StatsCard title="Average Order Value" value={`$${orders.length ? (getTotalSales() / orders.length).toFixed(2) : '0'}`} />
              </div>

              <div className="bg-white rounded-xl shadow-sm">
                <h2 className="text-lg font-semibold p-4 border-b">Recent Orders</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toppings</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.map((order) => (
                        <tr key={order.orderId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderId}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customerName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{order.size}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{order.toppings.join(', ')}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;