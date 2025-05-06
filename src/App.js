import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardPage from './components/pages/DashboardPage';
import KitchenDisplayPage from './components/pages/KitchenDisplayPage';
import InventoryPage from './components/pages/InventoryPage';
import OrdersPage from './components/pages/OrdersPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import Sidebar from './components/Sidebar';
import CustomOrderForm from './components/CustomOrderForm';
import { sampleOrders } from './sampleOrders';
import { useApi } from './hooks/useApi';
import * as LocalStorage from './utils/localStorage';
import * as FirebaseConfig from './firebase-config';
import './App.css';

function App() {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [apiOrders, setApiOrders, updateApiOrder, removeApiOrder, ordersLoading, resetApiOrders] = useApi('orders', []);
  const [archivedOrders, setArchivedOrders, updateArchivedOrder, removeArchivedOrder, archivesLoading, resetArchivedOrders] = useApi('archivedOrders', []);
  
  // Use state for orders with Firebase persistence
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize with Firebase orders and set up real-time updates
  useEffect(() => {
    console.log('Setting up Firebase order subscription');
    setIsLoading(true);
    
    // Initial load of orders
    const loadOrders = async () => {
      try {
        const firebaseOrders = await FirebaseConfig.getOrders();
        if (firebaseOrders && firebaseOrders.length > 0) {
          console.log('Loaded orders from Firebase:', firebaseOrders.length);
          setOrders(firebaseOrders);
        } else {
          // Try localStorage as backup
          const savedOrders = LocalStorage.loadOrders();
          if (savedOrders && savedOrders.length > 0) {
            console.log('Using saved orders from localStorage:', savedOrders.length);
            setOrders(savedOrders);
            
            // If we have localStorage orders but no Firebase orders, save them to Firebase
            savedOrders.forEach(async (order) => {
              try {
                await FirebaseConfig.saveOrder(order);
              } catch (err) {
                console.error('Error saving localStorage order to Firebase:', err);
              }
            });
          }
        }
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadOrders();
    
    // Set up real-time listener for Firebase updates
    const unsubscribe = FirebaseConfig.subscribeToOrders((updatedOrders) => {
      console.log('Received real-time order update from Firebase:', updatedOrders.length);
      setOrders(updatedOrders);
    });
    
    // Clean up subscription on unmount
    return () => unsubscribe();
  }, []);

  // Fetch orders on component mount and seed data if needed
  useEffect(() => {
    const initializeOrderData = async () => {
      try {
        // Only fetch from API or create sample data if we have no orders already
        if (orders.length === 0) {
          console.log('No orders found, initializing with sample data...');
          const initialOrders = [];
          
          // Generate several sample orders
          for (const order of sampleOrders) {
            try {
              // Try to save directly to Firebase first
              const newOrder = await FirebaseConfig.saveOrder(order);
              initialOrders.push(newOrder);
            } catch (error) {
              console.error('Error creating sample order:', error);
            }
          }
          
          if (initialOrders.length > 0) {
            console.log('Created sample orders:', initialOrders.length);
          }
        }
      } catch (error) {
        console.error('Error initializing order data:', error);
      }
    };
    
    initializeOrderData();
  }, [orders.length]); // Only run if orders array is empty

  // Clear all orders function used by Dashboard
  const clearAllOrders = async () => {
    try {
      // Clear from localStorage
      LocalStorage.clearStorage();
      
      // Clear from state
      setOrders([]);
      resetApiOrders();
      
      // Try to delete from Firebase
      const allOrders = await FirebaseConfig.getOrders();
      for (const order of allOrders) {
        try {
          await FirebaseConfig.deleteOrder(order.id);
        } catch (error) {
          console.error('Error deleting order from Firebase:', error);
        }
      }
      
      console.log('All orders have been cleared');
    } catch (error) {
      console.error('Error clearing orders:', error);
    }
  };

  // Handle new orders from the order form
  const handleNewOrder = async (orderData) => {
    console.log('Received new order:', orderData);
    try {
      // Save order to Firebase for persistence
      const firebaseOrder = await FirebaseConfig.saveOrder(orderData);
      console.log('New order saved to Firebase:', firebaseOrder);
      
      // Also save to localStorage as backup
      const updatedOrders = [...orders, firebaseOrder];
      LocalStorage.saveOrders(updatedOrders);
      
      setShowOrderForm(false);
      return firebaseOrder;
    } catch (error) {
      console.error('Error creating new order:', error);
      
      // Fallback to local storage only if Firebase fails
      try {
        // Generate a local ID
        const localOrder = {
          ...orderData,
          id: `local-${Date.now()}`,
          orderId: `LOCAL-${Date.now().toString().slice(-4)}`,
          _isLocal: true,
          createdAt: new Date().toISOString()
        };
        
        // Update local state
        const updatedOrders = [...orders, localOrder];
        setOrders(updatedOrders);
        LocalStorage.saveOrders(updatedOrders);
        
        console.log('Created local fallback order:', localOrder);
        setShowOrderForm(false);
        return localOrder;
      } catch (localError) {
        console.error('Complete failure creating order:', localError);
        return null;
      }
    }
  };

  // Handle order changes
  const handleStatusChange = async (orderId, status) => {
    // Find the order to update
    const orderToUpdate = orders.find(order => order.orderId === orderId || order.id === orderId);
    
    if (!orderToUpdate) {
      console.error(`Order with ID ${orderId} not found`);
      return;
    }
    
    console.log(`Changing status for order ${orderId}:`, status);
    
    // Determine what to update based on the status
    let updatedFields = {};
    
    if (typeof status === 'object' && (status.id || status.orderId)) {
      // If status is a complete order object, use it directly
      updatedFields = { ...status };
    } else if (typeof status === 'string') {
      // If status is a string, it's a status change
      updatedFields = {
        status: status,
        completed: status === 'delivered'
      };
    } else if (typeof status === 'boolean') {
      // If status is a boolean, it's a completion toggle
      updatedFields = {
        completed: status,
        status: status ? 'delivered' : 'pending'
      };
    } else if (typeof status === 'object') {
      // If status is an object with specific fields, update those fields
      updatedFields = { ...status };
    }
    
    try {
      // Update in Firebase
      await FirebaseConfig.updateOrder(orderId, updatedFields);
      
      // Also update in localStorage as backup
      const updatedOrders = orders.map(order => {
        if (order.id === orderId || order.orderId === orderId) {
          return { ...order, ...updatedFields };
        }
        return order;
      });
      
      LocalStorage.saveOrders(updatedOrders);
      
      // Also save pizza state if it exists
      if (updatedFields.cooked && Array.isArray(updatedFields.cooked)) {
        LocalStorage.savePizzaState(orderId, updatedFields.cooked, updatedFields.status);
      }
      
      return { id: orderId, ...updatedFields };
    } catch (error) {
      console.error('Error updating order status:', error);
      return null;
    }
  };

  // Handle updating pizza cooked status
  const handlePizzaStatusChange = async (orderId, pizzaIdx, isCooked) => {
    try {
      // Try to update pizza status in Firebase
      const result = await FirebaseConfig.updatePizzaStatus(orderId, pizzaIdx, isCooked);
      return result;
    } catch (error) {
      console.error('Error updating pizza status:', error);
      
      // Update in local state as fallback
      const orderToUpdate = orders.find(o => o.id === orderId || o.orderId === orderId);
      if (orderToUpdate) {
        const updatedPizzas = [...(orderToUpdate.pizzas || [])];
        if (updatedPizzas[pizzaIdx]) {
          updatedPizzas[pizzaIdx] = {
            ...updatedPizzas[pizzaIdx],
            isCooked: isCooked
          };
        }
        
        let cookedStatus = orderToUpdate.cooked || [];
        while (cookedStatus.length < updatedPizzas.length) {
          cookedStatus.push(false);
        }
        cookedStatus[pizzaIdx] = isCooked;
        
        const updatedOrder = {
          ...orderToUpdate,
          pizzas: updatedPizzas,
          cooked: cookedStatus
        };
        
        // Update orders array
        const updatedOrders = orders.map(order => {
          if (order.id === orderId || order.orderId === orderId) {
            return updatedOrder;
          }
          return order;
        });
        
        // Update state
        setOrders(updatedOrders);
        
        // Save to localStorage
        LocalStorage.saveOrders(updatedOrders);
        LocalStorage.savePizzaState(orderId, cookedStatus, orderToUpdate.status);
        
        return updatedOrder;
      }
      return null;
    }
  };

  // Archive an order
  const handleArchiveOrder = async (orderId) => {
    try {
      const orderToArchive = orders.find(o => o.id === orderId || o.orderId === orderId);
      if (!orderToArchive) {
        console.error(`Order ${orderId} not found for archiving`);
        return;
      }
      
      // Mark order as archived
      const archivedOrder = {
        ...orderToArchive,
        archived: true,
        archivedAt: new Date().toISOString()
      };
      
      // Save to archived collection in Firebase
      await FirebaseConfig.saveOrder({
        ...archivedOrder,
        collection: FirebaseConfig.ARCHIVED_ORDERS_COLLECTION
      });
      
      // Delete from active orders
      await FirebaseConfig.deleteOrder(orderId);
      
      // Update local state
      const updatedOrders = orders.filter(o => o.id !== orderId && o.orderId !== orderId);
      setOrders(updatedOrders);
      
      // Update localStorage
      LocalStorage.saveOrders(updatedOrders);
      
      console.log(`Order ${orderId} archived successfully`);
    } catch (error) {
      console.error(`Error archiving order ${orderId}:`, error);
    }
  };

  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Sidebar onNewOrder={() => setShowOrderForm(true)} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
            <Routes>
              <Route 
                path="/" 
                element={
                  <DashboardPage 
                    orders={orders} 
                    isLoading={isLoading}
                    onStatusChange={handleStatusChange}
                    onPizzaStatusChange={handlePizzaStatusChange}
                    onArchiveOrder={handleArchiveOrder}
                    clearAllOrders={clearAllOrders}
                  />
                } 
              />
              <Route 
                path="/kitchen" 
                element={
                  <KitchenDisplayPage 
                    orders={orders} 
                    isLoading={isLoading}
                    onPizzaStatusChange={handlePizzaStatusChange}
                  />
                } 
              />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/orders" element={<OrdersPage orders={orders} />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
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
            <CustomOrderForm 
              onSubmit={handleNewOrder} 
              onCancel={() => setShowOrderForm(false)} 
            />
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;
