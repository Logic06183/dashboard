import React, { useState, useEffect } from 'react';
import * as LocalStorage from '../utils/localStorage';

const CustomerTracking = ({ orders = [] }) => {
  // Single source of truth - don't duplicate the orders from props
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  
  // Apply saved state to orders for display purposes only
  const getEnhancedOrders = () => {
    if (!orders || !orders.length) return [];
    
    try {
      const savedStates = localStorage.getItem('pizzaCooked');
      if (!savedStates) return orders;
      
      const parsedStates = JSON.parse(savedStates);
      
      return orders.map(order => {
        const orderId = order.id || order.orderId;
        const savedOrder = parsedStates[orderId];
        
        if (savedOrder) {
          return {
            ...order,
            status: savedOrder.status || order.status,
            cooked: savedOrder.cooked || order.cooked
          };
        }
        return order;
      });
    } catch (error) {
      console.error('Error enhancing orders with saved state:', error);
      return orders;
    }
  };
  
  // Set up event listeners - runs only once on mount
  useEffect(() => {
    const handleOrderUpdate = () => {
      // Just force a re-render by updating timestamp
      setLastUpdateTime(Date.now());
    };
    
    // Set up event listeners
    window.addEventListener('order-updated', handleOrderUpdate);
    window.addEventListener('order-status-updated', handleOrderUpdate);
    window.addEventListener('force-render', handleOrderUpdate);
    
    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('order-updated', handleOrderUpdate);
      window.removeEventListener('order-status-updated', handleOrderUpdate);
      window.removeEventListener('force-render', handleOrderUpdate);
    };
  }, []); // Empty dependency array - runs once on mount
  const getOrderStatus = (status) => {
    const statusSteps = {
      'pending': 1,
      'preparing': 2,
      'in-oven': 3,
      'ready': 4,
      'delivered': 5
    };

    const statusColors = {
      'pending': 'bg-yellow-500',
      'preparing': 'bg-blue-500',
      'in-oven': 'bg-orange-500',
      'ready': 'bg-green-500',
      'delivered': 'bg-gray-500'
    };

    return {
      step: statusSteps[status] || 1,
      color: statusColors[status] || 'bg-gray-500'
    };
  };

  // Get the orders with enhanced state for rendering
  const enhancedOrders = getEnhancedOrders();
  
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold">Track Your Order</h2>
        <p className="text-gray-500 mt-4">No active orders to track</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Track Your Order</h2>
      {enhancedOrders.map((order) => (
        <div key={order.orderId} className="mb-8 last:mb-0">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="font-medium">Order #{order.orderId}</p>
              <p className="text-sm text-gray-500">{new Date(order.orderTime).toLocaleString()}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-white text-sm ${getOrderStatus(order.status).color}`}>
              {order.status}
            </span>
          </div>
          
          <div className="relative">
            <div className="flex justify-between mb-2">
              <span>Order Placed</span>
              <span>Preparing</span>
              <span>In Oven</span>
              <span>Ready</span>
              <span>Delivered</span>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
              <div
                style={{ width: `${(getOrderStatus(order.status).step / 5) * 100}%` }}
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${getOrderStatus(order.status).color}`}
              ></div>
            </div>
          </div>

          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-2">Order Details</h3>
            
            {/* Display pizzas from the new order format */}
            {order.pizzas && order.pizzas.length > 0 ? (
              <div className="space-y-2">
                {order.pizzas.map((pizza, idx) => (
                  <div key={idx} className="text-sm">
                    <p>{pizza.quantity}x {pizza.pizzaType}</p>
                  </div>
                ))}
              </div>
            ) : (
              /* Fallback to old format */
              <p>{order.pizzaType} {order.size && `(${order.size})`}</p>
            )}
            
            {/* Handle extraToppings as either string or array */}
            {order.extraToppings && (
              <p className="text-sm text-gray-600">
                Extra Toppings: {Array.isArray(order.extraToppings) ? order.extraToppings.join(', ') : order.extraToppings}
              </p>
            )}
            
            {/* Only show address if it exists */}
            {order.address && (
              <p className="text-sm text-gray-600 mt-2">Delivery to: {order.address}</p>
            )}
            
            {/* Show platform if it exists */}
            {order.platform && (
              <p className="text-sm text-gray-600 mt-2">Platform: {order.platform}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CustomerTracking;