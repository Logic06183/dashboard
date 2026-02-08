import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Improved Kitchen Display Component - Matches Illovo UI Design
 *
 * Features:
 * - Expandable order cards (click to show/hide)
 * - Color-coded urgency (Very Late: Red, Late: Orange, On Time: Green)
 * - Platform badges with styling
 * - Pizza checklist with checkboxes
 * - Customer name prominent
 * - Due time countdown
 * - Special instructions highlighted
 * - Status action buttons
 */

const ImprovedKitchenDisplay = ({ orders = [], onStatusChange, onPizzaToggle }) => {
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-expand all orders on mount and when new orders arrive
  useEffect(() => {
    const allOrderIds = new Set(orders.map(order => order.id || order.orderId));
    setExpandedOrders(allOrderIds);
  }, [orders]);

  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Toggle order card expansion
  const toggleOrder = (orderId) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  // Get urgency status based on due time
  const getUrgencyStatus = (dueTime) => {
    if (!dueTime) return { status: 'Unknown', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-700', borderColor: 'border-gray-300' };

    const due = new Date(dueTime);
    const diffMinutes = Math.floor((due - currentTime) / (1000 * 60));

    if (diffMinutes < -15) {
      return {
        status: 'VERY LATE',
        color: 'red',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-500',
        badgeBg: 'bg-red-600',
        badgeText: 'text-white'
      };
    }
    if (diffMinutes < 0) {
      return {
        status: 'LATE',
        color: 'orange',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-500',
        badgeBg: 'bg-orange-600',
        badgeText: 'text-white'
      };
    }
    return {
      status: 'ON TIME',
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-500',
      badgeBg: 'bg-green-600',
      badgeText: 'text-white'
    };
  };

  // Format time remaining
  const formatTimeRemaining = (dueTime) => {
    if (!dueTime) return 'Unknown';

    const due = new Date(dueTime);
    const diffMinutes = Math.floor((due - currentTime) / (1000 * 60));

    if (diffMinutes < 0) {
      return `${Math.abs(diffMinutes)}m late`;
    }
    return `${diffMinutes}m remaining`;
  };

  // Get platform styling
  const getPlatformStyle = (platform) => {
    const styles = {
      'Uber': 'bg-black text-white',
      'Uber Eats': 'bg-black text-white',
      'Mr D': 'bg-blue-600 text-white',
      'Mr Delivery': 'bg-blue-600 text-white',
      'Bolt': 'bg-green-600 text-white',
      'Window': 'bg-purple-600 text-white',
      'Phone': 'bg-indigo-600 text-white',
      'Other': 'bg-gray-600 text-white'
    };
    return styles[platform] || 'bg-gray-600 text-white';
  };

  // Filter and sort orders by urgency and time
  const sortedOrders = [...orders]
    .filter(order => !['completed', 'delivered'].includes(order.status?.toLowerCase()))
    .filter(order => {
      // Search filter
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      const customerName = (order.customerName || '').toLowerCase();
      const orderId = (order.id || order.orderId || '').toLowerCase();
      const platform = (order.platform || '').toLowerCase();

      return customerName.includes(query) ||
             orderId.includes(query) ||
             platform.includes(query);
    })
    .sort((a, b) => {
      const urgencyA = getUrgencyStatus(a.dueTime);
      const urgencyB = getUrgencyStatus(b.dueTime);

      const urgencyPriority = { 'VERY LATE': 1, 'LATE': 2, 'ON TIME': 3, 'Unknown': 4 };
      const priorityDiff = urgencyPriority[urgencyA.status] - urgencyPriority[urgencyB.status];

      if (priorityDiff !== 0) return priorityDiff;

      const timeA = new Date(a.orderTime || a.createdAt);
      const timeB = new Date(b.orderTime || b.createdAt);
      return timeA - timeB;
    });

  // Render order card
  const renderOrderCard = (order) => {
    const isExpanded = expandedOrders.has(order.id || order.orderId);
    const urgency = getUrgencyStatus(order.dueTime);
    const orderId = order.id || order.orderId || 'unknown';
    const pizzas = order.pizzas || [];
    const allCooked = pizzas.every((pizza, idx) => order.cooked?.[idx] || pizza.isCooked);

    return (
      <motion.div
        key={orderId}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`mb-4 rounded-lg border-l-4 ${urgency.borderColor} ${urgency.bgColor} shadow-md hover:shadow-lg transition-shadow`}
      >
        {/* Card Header - Always Visible */}
        <div
          className="p-4 cursor-pointer select-none"
          onClick={() => toggleOrder(orderId)}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Left Section - Status & Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {/* Urgency Badge */}
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${urgency.badgeBg} ${urgency.badgeText}`}>
                  {urgency.status}
                </span>

                {/* Platform Badge */}
                {order.platform && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPlatformStyle(order.platform)}`}>
                    {order.platform}
                  </span>
                )}

                {/* Customer Name */}
                <span className="font-semibold text-gray-900 truncate">
                  {order.customerName || 'Walk-in Customer'}
                </span>
              </div>

              {/* Order Details */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="font-medium">
                  Due: {order.dueTime ? new Date(order.dueTime).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                </span>
                <span className={`font-semibold ${urgency.textColor}`}>
                  ({formatTimeRemaining(order.dueTime)})
                </span>
                <span>
                  Order #{String(orderId).substring(0, 6)}
                </span>
              </div>
            </div>

            {/* Right Section - Expand Icon */}
            <div className="flex-shrink-0">
              <svg
                className={`w-6 h-6 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-gray-200">
                {/* Pizza Checklist */}
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold text-gray-700 mb-2">Pizzas:</h4>
                  {pizzas.map((pizza, index) => {
                    const isCooked = order.cooked?.[index] || pizza.isCooked || false;
                    return (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-2 rounded hover:bg-white transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isCooked}
                          onChange={() => onPizzaToggle && onPizzaToggle(orderId, index, !isCooked)}
                          className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className={`font-medium ${isCooked ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {pizza.pizzaType || pizza.name} {pizza.quantity > 1 && `(x${pizza.quantity})`}
                          </div>
                          {pizza.toppings && pizza.toppings.length > 0 && (
                            <div className="text-sm text-gray-600">
                              + {pizza.toppings.join(', ')}
                            </div>
                          )}
                          {pizza.specialInstructions && (
                            <div className="text-sm text-orange-600 italic">
                              ⚠️ {pizza.specialInstructions}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Order Special Instructions */}
                {order.specialInstructions && (
                  <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <p className="text-sm font-semibold text-yellow-800">
                      📝 Special Instructions:
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      {order.specialInstructions}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2 flex-wrap">
                  {!allCooked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Mark all pizzas as cooked
                        pizzas.forEach((_, idx) => {
                          if (!(order.cooked?.[idx] || pizzas[idx].isCooked)) {
                            onPizzaToggle && onPizzaToggle(orderId, idx, true);
                          }
                        });
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      ✓ Mark All Cooked
                    </button>
                  )}

                  {allCooked && order.status !== 'ready' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange && onStatusChange(orderId, 'ready');
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                    >
                      🍕 Mark as Ready
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange && onStatusChange(orderId, 'completed');
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                    >
                      ✅ Complete Order
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Kitchen Display
        </h2>
        <div className="text-sm text-gray-600">
          {sortedOrders.length} active {sortedOrders.length === 1 ? 'order' : 'orders'}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search by customer name, order #, or platform..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <AnimatePresence>
        {sortedOrders.map(renderOrderCard)}
      </AnimatePresence>

      {/* No Orders Empty State */}
      {!searchQuery && sortedOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-lg font-medium">No active orders</p>
          <p className="text-sm">Orders will appear here as they come in</p>
        </div>
      )}

      {/* No Search Results Message */}
      {searchQuery && sortedOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-lg font-medium">No orders found</p>
          <p className="text-sm">Try adjusting your search terms</p>
        </div>
      )}
    </div>
  );
};

export default ImprovedKitchenDisplay;
