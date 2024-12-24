import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const KitchenDisplay = ({ orders = [], onStatusChange }) => {
  const [urgentOrders, setUrgentOrders] = useState([]);
  const [normalOrders, setNormalOrders] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sort and categorize orders
  useEffect(() => {
    const activeOrders = orders.filter(order => 
      !['ready', 'delivered'].includes(order.status)
    );

    const sortedOrders = activeOrders.sort((a, b) => {
      const timeA = new Date(a.orderTime);
      const timeB = new Date(b.orderTime);
      return timeA - timeB;
    });

    const urgent = [];
    const normal = [];

    sortedOrders.forEach(order => {
      const orderTime = new Date(order.orderTime);
      const timeDiff = (currentTime - orderTime) / (1000 * 60); // in minutes

      if (timeDiff > 15) {
        urgent.push(order);
      } else {
        normal.push(order);
      }
    });

    setUrgentOrders(urgent);
    setNormalOrders(normal);
  }, [orders, currentTime]);

  const renderOrderCard = (order) => {
    const orderTime = new Date(order.orderTime);
    const waitTime = Math.floor((currentTime - orderTime) / (1000 * 60));
    const isUrgent = waitTime > 15;

    return (
      <motion.div
        key={order.orderId}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`bg-secondary rounded-lg p-4 shadow-lg border-l-4 ${
          isUrgent ? 'border-red-500' : 'border-yellow-500'
        } mb-4`}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-bold text-primary">{order.customerName}</h3>
            <p className="text-gray-400 text-sm">{order.phone}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">
              {orderTime.toLocaleTimeString()}
            </p>
            <p className={`text-sm font-bold ${
              isUrgent ? 'text-red-500' : 'text-yellow-500'
            }`}>
              {waitTime} min wait
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {order.items.map((item, index) => (
            <div key={index} className="bg-secondary-light rounded p-2">
              <div className="flex justify-between items-center">
                <span className="text-primary font-medium">
                  {item.quantity}x {item.pizzaType}
                </span>
                <span className="text-sm text-gray-400">
                  {item.size}
                </span>
              </div>
              {item.extraToppings && item.extraToppings.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Extra: {item.extraToppings.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-between items-center">
          <select
            value={order.status}
            onChange={(e) => onStatusChange(order.orderId, e.target.value)}
            className="bg-secondary-light text-primary rounded border border-secondary-dark px-3 py-1"
          >
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="in-oven">In Oven</option>
            <option value="ready">Ready</option>
          </select>
          <button
            onClick={() => onStatusChange(order.orderId, 'ready')}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-1 px-4 rounded"
          >
            Mark Ready
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-primary mb-8">Kitchen Display System</h1>
      
      {urgentOrders.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-red-500 mb-4">
            Urgent Orders ({urgentOrders.length})
          </h2>
          <AnimatePresence>
            {urgentOrders.map(order => renderOrderCard(order))}
          </AnimatePresence>
        </div>
      )}

      {normalOrders.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-yellow-500 mb-4">
            Normal Orders ({normalOrders.length})
          </h2>
          <AnimatePresence>
            {normalOrders.map(order => renderOrderCard(order))}
          </AnimatePresence>
        </div>
      )}

      {urgentOrders.length === 0 && normalOrders.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          <p className="text-2xl">No active orders</p>
          <p className="mt-2">New orders will appear here automatically</p>
        </div>
      )}
    </div>
  );
};

export default KitchenDisplay;
