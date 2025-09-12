import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardPage from './components/pages/DashboardPage';
import KitchenDisplayPage from './components/pages/KitchenDisplayPage';
import InventoryPage from './components/pages/InventoryPage';
import SimpleInventoryPage from './components/pages/SimpleInventoryPage';
import OrdersPage from './components/pages/OrdersPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import SettingsPage from './components/pages/SettingsPage';
import WasteManagementPage from './components/pages/WasteManagementPage';
import Sidebar from './components/Sidebar';
import HookOrderTest from './components/HookOrderTest';
import FirebaseDirectForm from './components/FirebaseDirectForm';
import OrderCleanupUtility from './components/OrderCleanupUtility';
import TestCustomerData from './components/TestCustomerData';
import FirebaseService from './services/FirebaseService';
import './App.css';

function App() {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [showCustomerTest, setShowCustomerTest] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use Firebase for real-time order updates
  useEffect(() => {
    console.log('Setting up Firebase order subscription');
    setIsLoading(true);
    const unsubscribe = FirebaseService.subscribeToOrders(() => {
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Toggle order form
  const toggleOrderForm = () => {
    setShowOrderForm(!showOrderForm);
  };

  // Toggle test form
  const toggleTestForm = () => {
    setShowTestForm(!showTestForm);
  };

  // Handle new orders from the order form
  const handleNewOrder = async (orderData) => {
    console.log('Received new order:', orderData);
    try {
      // Save order to Firebase
      await FirebaseService.addOrder(orderData);
    } catch (error) {
      console.error('Error saving order to Firebase:', error);
    }
  };

  // Handle status change
  const handleStatusChange = async (orderId, status) => {
    try {
      await FirebaseService.updateOrderStatus(orderId, status);
      console.log(`Order status updated to ${status}`);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // Handle pizza status change
  const handlePizzaStatusChange = async (orderId, pizzaIdx, isCooked) => {
    try {
      await FirebaseService.updatePizzaStatus(orderId, pizzaIdx, isCooked);
      console.log(`Pizza ${pizzaIdx} cooked status updated to ${isCooked}`);
    } catch (error) {
      console.error('Error updating pizza status:', error);
    }
  };

  // Archive an order
  const handleArchiveOrder = async (orderId) => {
    try {
      await FirebaseService.archiveOrder(orderId);
      console.log(`Order ${orderId} archived successfully`);
    } catch (error) {
      console.error(`Error archiving order ${orderId}:`, error);
    }
  };

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Sidebar
          onNewOrder={toggleOrderForm}
          onTestForm={toggleTestForm}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4">
            <Routes>
              <Route path="/" element={<DashboardPage isLoading={isLoading} />} />
              <Route path="/kitchen" element={<KitchenDisplayPage 
                isLoading={isLoading} 
                onStatusChange={handleStatusChange}
                onPizzaStatusChange={handlePizzaStatusChange}
                onArchiveOrder={handleArchiveOrder}
              />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/stock" element={<SimpleInventoryPage />} />
              <Route path="/orders" element={<OrdersPage 
                onStatusChange={handleStatusChange}
                onArchiveOrder={handleArchiveOrder}
              />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/waste" element={<WasteManagementPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/cleanup" element={<OrderCleanupUtility />} />
            </Routes>
          </main>
        </div>
      </div>

      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">New Order</h2>
              <button
                onClick={() => setShowOrderForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <FirebaseDirectForm 
              onClose={() => setShowOrderForm(false)}
              onSubmit={handleNewOrder} 
            />
          </div>
        </div>
      )}

      {showTestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Test Form</h2>
              <button
                onClick={() => setShowTestForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <HookOrderTest onClose={() => setShowTestForm(false)} />
          </div>
        </div>
      )}

      {showCustomerTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto">
            <TestCustomerData onClose={() => setShowCustomerTest(false)} />
          </div>
        </div>
      )}
      
      {/* Floating button to open customer test */}
      <button
        onClick={() => setShowCustomerTest(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-purple-700 z-40"
      >
        Test Customers
      </button>
    </Router>
  );
}

export default App;
