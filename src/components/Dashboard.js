import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { MdDashboard, MdPeople, MdDescription, MdSettings, MdMenu, MdNotifications, MdInventory, MdHistory } from 'react-icons/md';
import NavItem from './NavItem';
import StatsCard from './StatsCard';
import FirebaseDirectForm from './FirebaseDirectForm';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import OrdersPage from './pages/OrdersPage';
import SettingsPage from './pages/SettingsPage';
import InventoryPage from './pages/InventoryPage';
// Switch from Firestore to API-based data fetching
import { useApi } from '../hooks/useApi';
import CountdownTimer from './CountdownTimer';
import { shouldArchiveOrders, archiveCompletedOrders, getArchivedOrders } from '../services/OrderArchiveService';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orders, addOrder, updateOrder, removeOrder, ordersLoading] = useApi('orders', []);
  const [archivedOrders, addArchivedOrder, updateArchivedOrder, removeArchivedOrder, archivesLoading] = useApi('archivedOrders', []);
  const [showArchiveNotification, setShowArchiveNotification] = useState(false);
  const [archiveCount, setArchiveCount] = useState(0);
  
  // Check for archiving needs on component mount and at regular intervals
  useEffect(() => {
    // DISABLED: Initial archiving check and automatic archiving
    // Comment: We've disabled all archiving as it was causing orders to disappear
    console.log('Automatic order archiving disabled to prevent losing orders');
    
    // This function is now empty - will be re-enabled later after fixing the issues
    const noOpIntervalId = setInterval(() => {
      // Empty interval - no archiving
    }, 24 * 60 * 60 * 1000); // Only check once a day
      
    return () => clearInterval(noOpIntervalId);
  }, []);
  
  // Function to check if orders should be archived and perform archiving
  const checkAndArchiveOrders = async () => {
    // Check if it's time to archive (2 AM check)
    if (await shouldArchiveOrders()) {
      // Archive completed/delivered orders
      const result = await archiveCompletedOrders(orders);
      const archivedItems = result.archivedOrders;
      
      if (archivedItems.length > 0) {
        // Firestore will automatically update our state through the useFirestore hook
        // No need to call setOrders here as it happens through the Firestore subscription
        
        // Show notification about archived orders
        setArchiveCount(archivedItems.length);
        setShowArchiveNotification(true);
        
        // Auto-dismiss notification after 10 seconds
        setTimeout(() => {
          setShowArchiveNotification(false);
        }, 10000);
      }
    }
  };
  
  // Load archived orders
  const loadArchivedOrders = async () => {
    // Archived orders are already loaded via the useFirestore hook
    // No need to do anything here as Firestore subscription handles this
    console.log('Archived orders loaded:', archivedOrders.length);
  };

  useEffect(() => {
    loadArchivedOrders();
  }, [orders]); // Refresh when active orders change (as archiving may have occurred)

  const handleNewOrder = (order) => {
    addOrder(order);
    setShowOrderForm(false);
  };

  const clearOrders = async () => {
    if (window.confirm('Are you sure you want to clear all active orders? This cannot be undone.')) {
      try {
        // First archive all orders instead of just deleting them
        const result = await archiveCompletedOrders(orders);
        
        // Show notification
        if (orders.length > 0) {
          setArchiveCount(orders.length);
          setShowArchiveNotification(true);
          
          // Auto-dismiss notification after 10 seconds
          setTimeout(() => {
            setShowArchiveNotification(false);
          }, 10000);
        }
      } catch (error) {
        console.error('Error clearing orders:', error);
        alert('There was an error clearing the orders. Please try again.');
      }
    }
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
      name: 'Analytics',
      icon: <MdHistory className="w-6 h-6" />,
      path: '/analytics',
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
                <div className="relative">
                  <button className="p-2 rounded-full hover:bg-gray-100 relative">
                    <MdNotifications size={24} />
                    {orders.filter(o => o.status === 'pending').length > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>
                  
                  {/* Notification for archived orders */}
                  {showArchiveNotification && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg py-2 px-3 z-50 border border-gray-200">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 pt-0.5">
                          <MdHistory className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="ml-3 w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            Orders Archived
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {archiveCount} orders from yesterday have been archived. They are still available in analytics.
                          </p>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex">
                          <button
                            onClick={() => setShowArchiveNotification(false)}
                            className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500"
                          >
                            <span className="sr-only">Close</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
                <FirebaseDirectForm 
                  onClose={() => setShowOrderForm(false)}
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
                  addOrder={addOrder}
                 updateOrder={updateOrder}
                 removeOrder={removeOrder}
                  showOrderForm={showOrderForm}
                  setShowOrderForm={setShowOrderForm}
                  handleNewOrder={handleNewOrder}
                />
              )} 
            />
            <Route path="/customers" element={<CustomersPage orders={orders} />} />
            <Route path="/orders" element={<OrdersPage orders={orders} addOrder={addOrder} updateOrder={updateOrder} removeOrder={removeOrder} archivedOrders={archivedOrders} />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route 
              path="/analytics" 
              element={<SettingsPage archivedOrders={archivedOrders} allOrders={[...orders, ...archivedOrders]} />} 
            />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default Dashboard;