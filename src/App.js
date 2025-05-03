import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardPage from './components/pages/DashboardPage';
import KitchenDisplayPage from './components/pages/KitchenDisplayPage';
import Sidebar from './components/Sidebar';
import { sampleOrders } from './sampleOrders';
import './App.css';

function App() {
  const [orders, setOrders] = useState(sampleOrders);
  const [showOrderForm, setShowOrderForm] = useState(false);
  
  // Set document title
  useEffect(() => {
    document.title = "John Dough's Sourdough Pizzeria Dashboard";
    
    // Listen for order-updated events (used for forcing re-renders)
    const handleOrderUpdated = (event) => {
      if (event.detail && event.detail.orders) {
        setOrders(event.detail.orders);
      }
    };
    
    window.addEventListener('order-updated', handleOrderUpdated);
    
    return () => {
      window.removeEventListener('order-updated', handleOrderUpdated);
    };
  }, []);

  const handleNewOrder = (orderData) => {
    const newOrder = {
      ...orderData,
      orderId: `ORDER-${Date.now()}`,
      orderTime: new Date().toISOString(),
      status: 'pending'
    };
    setOrders(prev => [...prev, newOrder]);
    setShowOrderForm(false);
  };

  const handleStatusChange = (orderId, newStatus) => {
    setOrders(prev => {
      const updatedOrders = prev.map(order => {
        if (order.orderId === orderId || order.id === orderId) {
          // If newStatus is a complete order object, use it directly
          if (typeof newStatus === 'object' && (newStatus.id || newStatus.orderId)) {
            return newStatus;
          }
          // If newStatus is a string, it's a status change
          else if (typeof newStatus === 'string') {
            return { 
              ...order, 
              status: newStatus,
              completed: newStatus === 'delivered' ? true : false
            };
          }
          // If newStatus is a boolean, it's a completion toggle
          else if (typeof newStatus === 'boolean') {
            return { 
              ...order, 
              completed: newStatus,
              status: newStatus ? 'delivered' : 'pending'
            };
          }
          // If newStatus is an object with specific fields, update those fields
          else if (typeof newStatus === 'object') {
            return { ...order, ...newStatus };
          }
          return order;
        }
        return order;
      });
      
      return updatedOrders;
    });
    
    // Force a re-render after a short delay
    setTimeout(() => {
      const event = new CustomEvent('force-render', { detail: { timestamp: Date.now() } });
      window.dispatchEvent(event);
    }, 50);
  };

  return (
    <Router>
      <div className="flex min-h-screen bg-secondary-dark text-primary" style={{ '--color-primary': '#e76f51', '--color-secondary': '#2a2d3e' }}>
        <Sidebar />
        <div className="flex-1">
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
                  handleStatusChange={handleStatusChange}
                />
              } 
            />
            <Route 
              path="/kitchen" 
              element={
                <KitchenDisplayPage 
                  orders={orders}
                  onStatusChange={handleStatusChange}
                />
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;