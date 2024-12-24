import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DashboardPage from './components/pages/DashboardPage';
import KitchenDisplayPage from './components/pages/KitchenDisplayPage';
import Sidebar from './components/Sidebar';

function App() {
  const [orders, setOrders] = useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);

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
    setOrders(prev =>
      prev.map(order =>
        order.orderId === orderId
          ? { ...order, status: newStatus }
          : order
      )
    );
  };

  return (
    <Router>
      <div className="flex min-h-screen bg-secondary-dark text-primary">
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