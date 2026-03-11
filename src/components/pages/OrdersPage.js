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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  
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
      // Count as completed if ready/completed/delivered (not actively cooking)
      const isCompleted = order.status === 'ready' || order.status === 'completed' || order.status === 'delivered';
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
      const aCompleted = a.status === 'ready' || a.status === 'completed' || a.status === 'delivered';
      const bCompleted = b.status === 'ready' || b.status === 'completed' || b.status === 'delivered';
      
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
      // Check if order is completed (ready/completed/delivered - not actively cooking)
      if (order.status === 'ready' || order.status === 'completed' || order.status === 'delivered') {
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
    // Hide orders that are ready/completed/delivered (not actively cooking)
    const isCompleted = order.status === 'ready' || order.status === 'completed' || order.status === 'delivered';
    return !isCompleted;
  });

  // Calculate statistics for Illovo-style display
  const stats = useMemo(() => {
    // Completed includes 'ready' (done cooking, waiting pickup), 'completed', and 'delivered'
    const completedOrders = sortedOrders.filter(o =>
      o.status === 'ready' || o.status === 'completed' || o.status === 'delivered'
    );

    // Active orders are only those being actively prepared (not ready/completed/delivered)
    const activeOrders = sortedOrders.filter(o =>
      o.status !== 'ready' && o.status !== 'completed' && o.status !== 'delivered'
    );

    const urgentOrders = activeOrders.filter(o => {
      if (!o.dueTime) return false;
      const timeStatus = getTimeStatus(o.dueTime);
      return timeStatus && (timeStatus.status === 'late' || timeStatus.status === 'critical');
    });

    let totalPizzasInQueue = 0;
    let completedPizzasCount = 0;

    activeOrders.forEach(order => {
      if (order.pizzas && Array.isArray(order.pizzas)) {
        order.pizzas.forEach(pizza => {
          totalPizzasInQueue += (pizza.quantity || 1);
        });
      }
    });

    completedOrders.forEach(order => {
      if (order.pizzas && Array.isArray(order.pizzas)) {
        order.pizzas.forEach(pizza => {
          completedPizzasCount += (pizza.quantity || 1);
        });
      }
    });

    return {
      pizzasInQueue: totalPizzasInQueue,
      activeOrdersCount: activeOrders.length,
      urgentOrdersCount: urgentOrders.length,
      completedCount: completedPizzasCount,
      completedOrders: completedOrders
    };
  }, [sortedOrders]);

  return (
    <div className="min-h-screen bg-black">
      {/* Top Metrics Section - John Dough's Black & White Style */}
      <div className="bg-black border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            {/* Pizzas in Queue */}
            <div>
              <div className="text-6xl font-bold text-white mb-2">
                {stats.pizzasInQueue}
              </div>
              <div className="text-lg text-gray-300 font-medium">
                Pizzas in Queue
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {stats.pizzasInQueue > 15 ? 'High Volume' : stats.pizzasInQueue > 8 ? 'Moderate' : 'Normal'}
              </div>
            </div>

            {/* Active Orders */}
            <div>
              <div className="text-6xl font-bold text-white mb-2">
                {stats.activeOrdersCount}
              </div>
              <div className="text-lg text-gray-300 font-medium">
                Active Orders
              </div>
            </div>

            {/* Est. Wait Time */}
            <div>
              <div className="text-6xl font-bold text-white mb-2">
                1h
              </div>
              <div className="text-lg text-gray-300 font-medium">
                Est. Wait for New Orders
              </div>
            </div>

            {/* Status Indicator */}
            <div>
              <div className={`inline-flex items-center px-6 py-3 rounded-lg mb-2 ${
                stats.pizzasInQueue > 15 ? 'bg-red-500' : stats.pizzasInQueue > 8 ? 'bg-orange-500' : 'bg-white text-black'
              } ${stats.pizzasInQueue <= 8 ? 'text-black' : 'text-white'}`}>
                <div className="text-2xl font-bold">
                  {stats.pizzasInQueue > 15 ? 'Busy' : stats.pizzasInQueue > 8 ? 'Moderate' : 'Normal'}
                </div>
              </div>
              <div className="text-lg text-gray-300 font-medium">
                3 Pizza Capacity
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-4 space-y-4">
        {/* Smaller Status Cards */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Active Orders Card - Blue */}
            <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg shadow-md p-4 text-white">
              <div className="text-3xl font-bold mb-1">
                {stats.activeOrdersCount}
              </div>
              <div className="text-sm font-medium">Active Orders</div>
            </div>

            {/* Urgent Orders Card - Pink */}
            <div className="bg-gradient-to-br from-pink-400 to-pink-500 rounded-lg shadow-md p-4 text-white">
              <div className="text-3xl font-bold mb-1">{stats.urgentOrdersCount}</div>
              <div className="text-sm font-medium">Urgent Orders</div>
            </div>

            {/* Completed Card - Teal */}
            <div className="bg-gradient-to-br from-teal-400 to-teal-500 rounded-lg shadow-md p-4 text-white">
              <div className="text-3xl font-bold mb-1">
                {stats.completedCount}
              </div>
              <div className="text-sm font-medium">Completed</div>
            </div>

            {/* Pizzas in Queue Card - Light Blue */}
            <div className="bg-gradient-to-br from-sky-300 to-sky-400 rounded-lg shadow-md p-4 text-white">
              <div className="text-3xl font-bold mb-1">
                {stats.pizzasInQueue}
              </div>
              <div className="text-sm font-medium">Pizzas in Queue</div>
            </div>
          </div>
        </section>

        {/* Completed Orders Section - Collapsed by default */}
        <section className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`text-2xl transition-transform ${showCompleted ? 'rotate-90' : ''}`}>
                ▶
              </div>
              <h3 className="text-lg font-bold text-black">
                Completed Orders ({stats.completedOrders.length})
              </h3>
            </div>
            <span className="text-sm text-gray-500">
              {showCompleted ? 'Click to hide' : 'Click to show'}
            </span>
          </button>

          {showCompleted && stats.completedOrders.length > 0 && (
            <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {stats.completedOrders.map((order, idx) => (
                <div
                  key={order.id || order.orderId || idx}
                  className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-4 shadow-md hover:shadow-xl transition-shadow cursor-pointer border-2 border-black"
                >
                  {/* Customer Name & Time */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-black">
                        {order.customerName || 'Guest'}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-sm font-semibold text-black">DONE</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-black">
                        {formatSATime(order.orderTime)}
                      </div>
                    </div>
                  </div>

                  {/* Platform Badge */}
                  {order.platform && (
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 rounded text-xs font-semibold bg-black text-white">
                        {order.platform}
                      </span>
                    </div>
                  )}

                  {/* Pizza Details */}
                  <div className="space-y-1">
                    {order.pizzas?.slice(0, 3).map((pizza, pizzaIdx) => (
                      <div key={pizzaIdx} className="text-sm font-medium text-gray-700">
                        {pizza.quantity || 1}x {pizza.pizzaType || pizza.name}
                      </div>
                    ))}
                    {order.pizzas?.length > 3 && (
                      <div className="text-sm font-medium text-gray-700">
                        +{order.pizzas.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </div>
          )}

          {showCompleted && stats.completedOrders.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">📭</p>
              <p className="font-medium">No completed orders yet</p>
            </div>
          )}
        </section>

        {/* Active Orders - Use existing ImprovedKitchenDisplay */}
        {!showCompleted && (
          <section className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-black">Active Orders</h3>

              {/* View Toggle Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    viewMode === 'table'
                      ? 'bg-black text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  📋 Table View
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-black text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🔲 Grid View
                </button>
              </div>
            </div>

            <ImprovedKitchenDisplay
              orders={displayOrders}
              onStatusChange={handleStatusChange}
              onPizzaToggle={handlePizzaToggle}
              onMarkAsWaste={handleMarkOrderAsWaste}
              viewMode={viewMode}
            />
          </section>
        )}

        {/* Test Customer Button - Bottom Right */}
        <div className="fixed bottom-8 right-8">
          <button
            onClick={() => window.location.hash = '#/orders'}
            className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg font-semibold transition-colors"
          >
            Test Customer
          </button>
        </div>
      </main>

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
