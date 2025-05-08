import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardPage from './components/pages/DashboardPage';
import KitchenDisplayPage from './components/pages/KitchenDisplayPage';
import InventoryPage from './components/pages/InventoryPage';
import OrdersPage from './components/pages/OrdersPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import SettingsPage from './components/pages/SettingsPage';
import Sidebar from './components/Sidebar';
import HookOrderTest from './components/HookOrderTest';
import FirebaseDirectForm from './components/FirebaseDirectForm';
import OrderCleanupUtility from './components/OrderCleanupUtility';
import FirebaseService from './services/FirebaseService';
import './App.css';

function App() {
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
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
              <Route path="/kitchen" element={<KitchenDisplayPage isLoading={isLoading} />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
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
            <FirebaseDirectForm onClose={() => setShowOrderForm(false)} />
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
    </Router>
  );
}

// Handle new orders from the order form
const handleNewOrder = async (orderData) => {
  console.log('Received new order:', orderData);
  try {
    // Save order to Firebase for persistence using the new FirebaseService
    console.log('Creating order through FirebaseService');
    const firebaseOrder = await FirebaseService.createOrder(orderData);
    console.log('New order saved to Firebase:', firebaseOrder);

    // No need to save to localStorage since we're using Firebase as single source of truth
    // Just update the state for immediate UI display until Firebase real-time update comes in
    return firebaseOrder;
  } catch (error) {
    console.error('Error creating new order through FirebaseService:', error);

    // Try direct Firestore access as a fallback
    try {
      console.log('Attempting to create order through direct Firestore access');
      const { collection, addDoc } = await import('firebase/firestore');
      // Save order to Firebase for persistence using the new FirebaseService
      console.log('Creating order through FirebaseService');
      const firebaseOrder = await FirebaseService.createOrder(orderData);
      console.log('New order saved to Firebase:', firebaseOrder);
      
      // No need to save to localStorage since we're using Firebase as single source of truth
      // Just update the state for immediate UI display until Firebase real-time update comes in
      setShowOrderForm(false);
      return firebaseOrder;
    } catch (error) {
      console.error('Error creating new order through FirebaseService:', error);
      
      // Try direct Firestore access as a fallback
      try {
        console.log('Attempting to create order through direct Firestore access');
        const { collection, addDoc } = await import('firebase/firestore');
        
        // Create a clean order object
        const orderId = `order-${Date.now()}`;
        const cleanOrder = {
          ...orderData,
          id: orderId,
          orderId: orderId,
          createdAt: orderData.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Add to Firestore directly
        const ordersCollection = collection(FirebaseService.db, 'orders');
        const docRef = await addDoc(ordersCollection, cleanOrder);
        console.log('Order created successfully via direct Firestore access, ID:', docRef.id);
        
        // Update the order with the new document ID
        const savedOrder = {
          ...cleanOrder,
          id: docRef.id
        };
        
        setShowOrderForm(false);
        return savedOrder;
      } catch (directError) {
        console.error('Complete failure creating order via all methods:', directError);
        alert('Could not create order. Please check console for details.');
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

    // Update in Firebase
    try {
      await FirebaseService.updateOrder(orderId, updatedFields);
      
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
      const result = await FirebaseService.updatePizzaStatus(orderId, pizzaIdx, isCooked);
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
      await FirebaseService.archiveOrder(orderId);
      
      // The archiveOrder function already handles the deletion of the original order
      // so we don't need a separate deleteOrder call
      
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

  export default App;
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
            <FirebaseDirectForm onClose={() => setShowOrderForm(false)} />
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
            <HookOrderTest 
              onClose={() => setShowTestForm(false)} 
            />
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;
