import React, { useState, useEffect, useMemo } from 'react';
import OrderManagement from '../OrderManagement';

const OrdersPage = ({ orders, setOrders }) => {
  const [showCompleted, setShowCompleted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);
  
  // Check if an order is completed (all pizzas cooked)
  const isOrderCompleted = (order) => {
    if (!order || !order.cooked || !Array.isArray(order.cooked) || !order.pizzas) return false;
    return order.cooked.every(status => status) && order.cooked.length === order.pizzas.length;
  };

  // Get all orders sorted by urgency and completion status
  const sortedOrders = useMemo(() => {
    // Only show orders from today by default (unless showing completed/archived)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    // Filter orders based on date and completed status
    const filteredOrders = orders.filter(order => {
      const isCompleted = isOrderCompleted(order) || order.status === 'delivered' || order.status === 'ready';
      const orderDate = new Date(order.orderTime);
      
      // Only display completed orders if the toggle is on
      if (isCompleted && !showCompleted) return false;
      
      // Always show today's orders
      if (orderDate >= todayStart) return true;
      
      // For past orders, only show if viewing completed
      return showCompleted;
    });
    
    return filteredOrders.sort((a, b) => {
      // First separate pending and completed orders
      const aCompleted = isOrderCompleted(a) || a.status === 'delivered' || a.status === 'ready';
      const bCompleted = isOrderCompleted(b) || b.status === 'delivered' || b.status === 'ready';
      
      if (aCompleted && !bCompleted) return 1; // Move completed to bottom
      if (!aCompleted && bCompleted) return -1; // Move pending to top
      
      // Then sort by due time
      const timeA = a.dueTime ? new Date(a.dueTime) : new Date(a.orderTime);
      const timeB = b.dueTime ? new Date(b.dueTime) : new Date(b.orderTime);
      return timeA - timeB;
    });
  }, [orders, showCompleted, currentTime]);

  // Group orders by priority and completion status
  const groupedOrders = useMemo(() => {
    const groups = {
      late: [],    // Past due time
      urgent: [],  // Due in < 15 minutes
      normal: [],  // Due in > 15 minutes
      completed: [] // Completed/ready orders
    };

    sortedOrders.forEach(order => {
      // Check if order is completed
      if (isOrderCompleted(order) || order.status === 'delivered' || order.status === 'ready') {
        groups.completed.push(order);
        return;
      }
      
      // Calculate minutes until due
      const dueTime = order.dueTime ? new Date(order.dueTime) : null;
      if (!dueTime) {
        groups.normal.push(order);
        return;
      }
      
      const minutesUntilDue = Math.floor((dueTime - currentTime) / (1000 * 60));
      
      if (minutesUntilDue < 0) {
        groups.late.push(order); // Past due
      } else if (minutesUntilDue <= 15) {
        groups.urgent.push(order); // Due soon
      } else {
        groups.normal.push(order); // Due later
      }
    });

    return groups;
  }, [sortedOrders, currentTime]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Kitchen Display System</h2>
        <div className="flex items-center space-x-4">
          <label className="inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={showCompleted} 
              onChange={() => setShowCompleted(!showCompleted)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              Show Completed Orders
            </span>
          </label>
        </div>
      </div>
      
      {/* Late Orders - Highest Priority */}
      {groupedOrders.late.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-red-600 flex items-center gap-2 mb-4">
            <span className="inline-block w-3 h-3 bg-red-600 rounded-full"></span>
            Late Orders ({groupedOrders.late.length})
          </h3>
          <OrderManagement 
            orders={groupedOrders.late} 
            onStatusChange={(orderId, newStatus) => {
              setOrders(prev => prev.map(order => 
                (order.id === orderId || order.orderId === orderId) 
                  ? {...order, status: newStatus} 
                  : order
              ));
            }} 
          />
        </div>
      )}
      
      {/* Urgent Orders */}
      {groupedOrders.urgent.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-orange-600 flex items-center gap-2 mb-4">
            <span className="inline-block w-3 h-3 bg-orange-600 rounded-full"></span>
            Urgent Orders ({groupedOrders.urgent.length})
          </h3>
          <OrderManagement 
            orders={groupedOrders.urgent} 
            onStatusChange={(orderId, newStatus) => {
              setOrders(prev => prev.map(order => 
                (order.id === orderId || order.orderId === orderId)
                  ? {...order, status: newStatus} 
                  : order
              ));
            }} 
          />
        </div>
      )}

      {/* Normal Priority Orders */}
      {groupedOrders.normal.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-blue-600 flex items-center gap-2 mb-4">
            <span className="inline-block w-3 h-3 bg-blue-600 rounded-full"></span>
            Normal Orders ({groupedOrders.normal.length})
          </h3>
          <OrderManagement 
            orders={groupedOrders.normal}
            onStatusChange={(orderId, newStatus) => {
              setOrders(prev => prev.map(order => 
                (order.id === orderId || order.orderId === orderId)
                  ? {...order, status: newStatus} 
                  : order
              ));
            }} 
          />
        </div>
      )}
      
      {/* Completed Orders */}
      {showCompleted && groupedOrders.completed.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-green-600 flex items-center gap-2 mb-4">
            <span className="inline-block w-3 h-3 bg-green-600 rounded-full"></span>
            Completed Orders ({groupedOrders.completed.length})
          </h3>
          <OrderManagement 
            orders={groupedOrders.completed}
            onStatusChange={(orderId, newStatus) => {
              setOrders(prev => prev.map(order => 
                (order.id === orderId || order.orderId === orderId)
                  ? {...order, status: newStatus} 
                  : order
              ));
            }} 
          />
        </div>
      )}

      {/* No Orders Message */}
      {(sortedOrders.length === 0 || (!showCompleted && groupedOrders.late.length === 0 && 
        groupedOrders.urgent.length === 0 && groupedOrders.normal.length === 0)) && (
        <div className="text-center text-gray-500 mt-8 p-8 bg-gray-50 rounded-lg">
          <p className="text-lg">No active orders at the moment</p>
          {!showCompleted && groupedOrders.completed.length > 0 && (
            <p className="mt-2 text-sm">There are {groupedOrders.completed.length} completed orders. Enable "Show Completed Orders" to view them.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;