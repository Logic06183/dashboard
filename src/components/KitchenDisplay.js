import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const KitchenDisplay = ({ orders = [], onStatusChange }) => {
  const [highPriorityOrders, setHighPriorityOrders] = useState([]);
  const [mediumPriorityOrders, setMediumPriorityOrders] = useState([]);
  const [lowPriorityOrders, setLowPriorityOrders] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sort and categorize orders by urgency
  useEffect(() => {
    const activeOrders = orders.filter(order => 
      !['ready', 'delivered'].includes(order.status)
    );

    // First sort by platform - prioritize certain platforms
    const platformPriority = {
      'Uber': 1,
      'Mr Delivery': 2,
      'Bolt': 2,
      'Window': 3,
      'Other': 4
    };

    const sortedOrders = activeOrders.sort((a, b) => {
      // First sort by urgency if available
      if (a.urgency && b.urgency) {
        const urgencyPriority = { 'high': 1, 'medium': 2, 'low': 3 };
        if (urgencyPriority[a.urgency] !== urgencyPriority[b.urgency]) {
          return urgencyPriority[a.urgency] - urgencyPriority[b.urgency];
        }
      }
      
      // Then sort by platform priority
      const platformA = platformPriority[a.platform] || 5;
      const platformB = platformPriority[b.platform] || 5;
      if (platformA !== platformB) {
        return platformA - platformB;
      }
      
      // Finally sort by order time
      const timeA = new Date(a.orderTime);
      const timeB = new Date(b.orderTime);
      return timeA - timeB;
    });

    const highPriority = [];
    const mediumPriority = [];
    const lowPriority = [];

    sortedOrders.forEach(order => {
      // Use the urgency field from our new order form if available
      if (order.urgency) {
        if (order.urgency === 'high') {
          highPriority.push(order);
        } else if (order.urgency === 'medium') {
          mediumPriority.push(order);
        } else {
          lowPriority.push(order);
        }
        return;
      }
      
      // Fallback to time-based urgency if urgency field is not available
      const orderTime = new Date(order.orderTime);
      const timeDiff = (currentTime - orderTime) / (1000 * 60); // in minutes

      if (timeDiff > 20) {
        highPriority.push(order);
      } else if (timeDiff > 10) {
        mediumPriority.push(order);
      } else {
        lowPriority.push(order);
      }
    });

    setHighPriorityOrders(highPriority);
    setMediumPriorityOrders(mediumPriority);
    setLowPriorityOrders(lowPriority);
  }, [orders, currentTime]);

  const renderOrderCard = (order) => {
    const orderTime = new Date(order.orderTime);
    const waitTime = Math.floor((currentTime - orderTime) / (1000 * 60));
    
    // Determine border color based on urgency
    let borderColor = 'border-yellow-500';
    if (order.urgency === 'high' || waitTime > 20) {
      borderColor = 'border-red-500';
    } else if (order.urgency === 'medium' || waitTime > 10) {
      borderColor = 'border-orange-500';
    } else if (order.urgency === 'low') {
      borderColor = 'border-green-500';
    }

    return (
      <motion.div
        key={order.id || order.orderId}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`bg-secondary rounded-lg p-4 shadow-lg border-l-4 ${borderColor} mb-4`}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-primary">{order.platform || 'Walk-in'}</h3>
              {order.email && (
                <span className="text-sm text-gray-400">({order.email})</span>
              )}
            </div>
            <p className="text-gray-400 text-sm">
              Order Time: {orderTime.toLocaleTimeString()}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className={`px-2 py-1 rounded text-xs font-bold ${order.urgency === 'high' ? 'bg-red-500 text-white' : order.urgency === 'medium' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}`}>
                {order.prepTime ? `${order.prepTime} min` : `${waitTime} min wait`}
              </span>
              <span className="px-2 py-1 rounded bg-secondary-light text-primary text-xs font-bold">
                R{order.totalAmount?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {/* Handle both old format (items) and new format (pizzas) */}
          {(order.pizzas || order.items || []).map((item, index) => {
            // Determine if we're using the old or new format
            const pizzaType = item.pizzaType;
            const quantity = item.quantity || 1;
            const rowNumber = item.rowNumber || '';
            
            return (
              <div key={index} className="bg-secondary-light rounded p-2">
                <div className="flex justify-between items-center">
                  <span className="text-primary font-medium">
                    {quantity}x {pizzaType}
                  </span>
                  {rowNumber && (
                    <span className="text-sm bg-amber-600 text-white px-2 py-0.5 rounded">
                      Row {rowNumber}
                    </span>
                  )}
                </div>
                {item.extraToppings && (
                  <p className="text-sm text-gray-500 mt-1">
                    Extra: {item.extraToppings}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        
        {order.extraToppings && (
          <div className="mt-2 p-2 bg-secondary-light rounded">
            <p className="text-sm text-gray-300">
              <span className="font-bold">Notes:</span> {order.extraToppings}
            </p>
          </div>
        )}

        <div className="mt-4 flex justify-between items-center">
          <select
            value={order.status}
            onChange={(e) => onStatusChange(order.id || order.orderId, e.target.value)}
            className="bg-secondary-light text-primary rounded border border-secondary-dark px-3 py-1"
          >
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="in-oven">In Oven</option>
            <option value="ready">Ready</option>
            <option value="delivered">Delivered</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => onStatusChange(order.id || order.orderId, 'in-oven')}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-1 px-4 rounded"
            >
              In Oven
            </button>
            <button
              onClick={() => onStatusChange(order.id || order.orderId, 'ready')}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-4 rounded"
            >
              Ready
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Kitchen Display System</h1>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-bold">
            High: {highPriorityOrders.length}
          </div>
          <div className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm font-bold">
            Medium: {mediumPriorityOrders.length}
          </div>
          <div className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-bold">
            Low: {lowPriorityOrders.length}
          </div>
        </div>
      </div>
      
      {highPriorityOrders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center">
            <span className="inline-block w-4 h-4 bg-red-500 rounded-full mr-2"></span>
            High Priority Orders ({highPriorityOrders.length})
          </h2>
          <AnimatePresence>
            {highPriorityOrders.map(order => renderOrderCard(order))}
          </AnimatePresence>
        </div>
      )}

      {mediumPriorityOrders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-orange-500 mb-4 flex items-center">
            <span className="inline-block w-4 h-4 bg-orange-500 rounded-full mr-2"></span>
            Medium Priority Orders ({mediumPriorityOrders.length})
          </h2>
          <AnimatePresence>
            {mediumPriorityOrders.map(order => renderOrderCard(order))}
          </AnimatePresence>
        </div>
      )}

      {lowPriorityOrders.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-green-500 mb-4 flex items-center">
            <span className="inline-block w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            Low Priority Orders ({lowPriorityOrders.length})
          </h2>
          <AnimatePresence>
            {lowPriorityOrders.map(order => renderOrderCard(order))}
          </AnimatePresence>
        </div>
      )}

      {highPriorityOrders.length === 0 && mediumPriorityOrders.length === 0 && lowPriorityOrders.length === 0 && (
        <div className="text-center text-gray-400 py-12 bg-secondary-light rounded-lg">
          <p className="text-2xl">No active orders</p>
          <p className="mt-2">New orders will appear here automatically</p>
        </div>
      )}
    </div>
  );
};

export default KitchenDisplay;
