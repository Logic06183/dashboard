import React, { useState, useEffect, useMemo } from 'react';
import FirebaseService from '../../services/FirebaseService';
import useQueueCalculator from '../../hooks/useQueueCalculator';
import WasteReasonModal from '../WasteReasonModal';
import ImprovedKitchenDisplay from '../ImprovedKitchenDisplay';

const { updateOrder, subscribeToOrders, markOrderAsWaste, markPizzasAsWaste, updatePizzaStatus } = FirebaseService;

const OrdersPage = () => {
  const { getOrderEstimate, formatTimeEstimate } = useQueueCalculator();
  const [orders, setOrders] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [highlightedOrders, setHighlightedOrders] = useState({});
  
  // Waste management state
  const [wasteModalOpen, setWasteModalOpen] = useState(false);
  const [wasteOrderData, setWasteOrderData] = useState(null);
  const [wasteType, setWasteType] = useState('order');
  
  // Load highlighted orders from localStorage on component mount
  useEffect(() => {
    const savedHighlights = localStorage.getItem('highlightedOrders');
    if (savedHighlights) {
      try {
        setHighlightedOrders(JSON.parse(savedHighlights));
      } catch (err) {
        console.error('Error parsing highlighted orders from localStorage:', err);
      }
    }
  }, []);
  
  // Save highlighted orders to localStorage when they change
  useEffect(() => {
    localStorage.setItem('highlightedOrders', JSON.stringify(highlightedOrders));
  }, [highlightedOrders]);
  
  // Toggle order highlight
  const toggleOrderHighlight = (orderId) => {
    const newHighlightedOrders = { ...highlightedOrders };
    
    if (newHighlightedOrders[orderId]) {
      // If already highlighted, remove highlight
      delete newHighlightedOrders[orderId];
    } else {
      // If not highlighted, add highlight with timestamp
      newHighlightedOrders[orderId] = {
        timestamp: new Date().getTime()
      };
    }
    
    setHighlightedOrders(newHighlightedOrders);
  };
  
  // Check if an order is highlighted
  const isOrderHighlighted = (orderId) => {
    return !!highlightedOrders[orderId];
  };
  
  // No pizza change functionality in this version
  
  // Subscribe to orders
  useEffect(() => {
    const unsubscribe = subscribeToOrders((updatedOrders) => {
      setOrders(updatedOrders || []);
      setCurrentTime(new Date()); // Only update time when orders change
    });

    return () => {
      unsubscribe(); // Cleanup Firebase subscription
    };
  }, []);
  
  // Check if an order is completed (all pizzas cooked)
  const isOrderCompleted = (order) => {
    if (!order || !order.cooked || !Array.isArray(order.cooked) || !order.pizzas) return false;
    return order.cooked.every(status => status) && order.cooked.length === order.pizzas.length;
  };

  // Format time in South African format (24-hour)
  const formatSATime = (date) => {
    if (!date) return 'No time';
    
    try {
      if (typeof date === 'string') {
        date = new Date(date);
      }
      return date.toLocaleTimeString('en-ZA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid time';
    }
  };
  
  // Calculate time status (minutes left or late)
  const getTimeStatus = (dueTime) => {
    if (!dueTime) return null;
    
    try {
      const dueDate = new Date(dueTime);
      const now = currentTime;
      const minutesDiff = Math.floor((dueDate - now) / 60000);
      
      if (minutesDiff < 0) {
        return { status: 'late', minutes: Math.abs(minutesDiff) };
      } else if (minutesDiff <= 15) {
        return { status: 'critical', minutes: minutesDiff };
      } else if (minutesDiff <= 30) {
        return { status: 'urgent', minutes: minutesDiff };
      } else {
        return { status: 'normal', minutes: minutesDiff };
      }
    } catch (error) {
      console.error('Error calculating time status:', error);
      return null;
    }
  };

  // Waste management functions
  const handleMarkOrderAsWaste = (order) => {
    setWasteOrderData(order);
    setWasteType('order');
    setWasteModalOpen(true);
  };

  const handleMarkPizzasAsWaste = (order) => {
    setWasteOrderData(order);
    setWasteType('pizza');
    setWasteModalOpen(true);
  };

  const handleWasteConfirm = async (wasteData) => {
    try {
      if (wasteType === 'order') {
        await markOrderAsWaste(wasteOrderData.id || wasteOrderData.orderId, wasteData);
        console.log('Order marked as waste successfully');
      } else if (wasteType === 'pizza') {
        await markPizzasAsWaste(wasteOrderData.id || wasteOrderData.orderId, wasteData.pizzaIndexes, wasteData);
        console.log('Pizzas marked as waste successfully');
      }
      // The orders will automatically update through the Firebase subscription
    } catch (error) {
      console.error('Error marking as waste:', error);
      alert('Error marking as waste: ' + error.message);
    }
  };

  // Get all orders sorted by urgency and completion status, and grouped by date
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
      
      // Get timestamps for comparison
      const timeA = a.dueTime ? new Date(a.dueTime) : new Date(a.orderTime);
      const timeB = b.dueTime ? new Date(b.dueTime) : new Date(b.orderTime);
      
      // Different sorting for completed vs pending orders
      if (aCompleted && bCompleted) {
        // For completed orders, sort by most recent first (descending)
        // Use completionTime if available, otherwise use orderTime
        const completionTimeA = a.completionTime ? new Date(a.completionTime) : timeA;
        const completionTimeB = b.completionTime ? new Date(b.completionTime) : timeB;
        return completionTimeB - completionTimeA; // Descending order (newest first)
      } else {
        // For pending orders, keep sorting by due time (ascending)
        return timeA - timeB; // Ascending order (oldest/most urgent first)
      }
    });
  }, [orders, showCompleted, currentTime]);
  
  // Group orders by priority and completion status
  const groupedOrders = useMemo(() => {
    const pending = [];
    const urgent = [];
    const late = [];
    const completed = [];
    
    // Group completed orders by date
    const completedByDate = {};
    
    sortedOrders.forEach(order => {
      // Check if order is completed (all pizzas cooked or status is delivered/ready)
      if (isOrderCompleted(order) || order.status === 'delivered' || order.status === 'ready') {
        completed.push(order);
        
        // Also add to date-grouped object for past orders display
        if (order.orderTime) {
          const orderDate = new Date(order.orderTime);
          const dateString = orderDate.toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Africa/Johannesburg'
          });
          
          if (!completedByDate[dateString]) {
            completedByDate[dateString] = [];
          }
          completedByDate[dateString].push(order);
        }
        return;
      }
      
      // If not completed, check due time for urgency
      if (order.dueTime) {
        const dueTime = new Date(order.dueTime);
        const timeDiff = dueTime - currentTime;
        const minutesLeft = Math.floor(timeDiff / 60000); // Convert ms to minutes
        
        if (minutesLeft < 0) {
          // Order is late
          late.push(order);
        } else if (minutesLeft <= 15) {
          // Order is urgent (due in 15 minutes or less)
          urgent.push(order);
        } else {
          // Order is pending
          pending.push(order);
        }
      } else {
        // No due time, consider as normal pending
        pending.push(order);
      }
    });
    
    return { pending, urgent, late, completed, completedByDate };
  }, [sortedOrders, currentTime]);

  // Handle pizza toggle
  const handlePizzaToggle = async (orderId, pizzaIndex, isCooked) => {
    try {
      await updatePizzaStatus(orderId, pizzaIndex, isCooked);
    } catch (error) {
      console.error('Error updating pizza status:', error);
    }
  };

  // Handle order status change
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrder(orderId, { status: newStatus });
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // Filter orders based on showCompleted
  const displayOrders = showCompleted ? sortedOrders : sortedOrders.filter(order => {
    const isCompleted = isOrderCompleted(order) || order.status === 'delivered' || order.status === 'ready';
    return !isCompleted;
  });

  return (
    <div className="p-8">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
        <div className="flex items-center">
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={showCompleted}
              onChange={() => setShowCompleted(!showCompleted)}
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">
              Show Completed Orders
            </span>
          </label>
        </div>
      </div>


      {/* Use Illovo-style Kitchen Display UI */}
      <ImprovedKitchenDisplay
        orders={displayOrders}
        onStatusChange={handleStatusChange}
        onPizzaToggle={handlePizzaToggle}
      />

      {/* Waste Reason Modal */}
      <WasteReasonModal
        isOpen={wasteModalOpen}
        onClose={() => setWasteModalOpen(false)}
        onConfirm={handleWasteConfirm}
        orderData={wasteOrderData}
        wasteType={wasteType}
      />
    </div>
  );
};

export default OrdersPage;
