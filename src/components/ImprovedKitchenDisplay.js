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

const ImprovedKitchenDisplay = ({ orders = [], onStatusChange, onPizzaToggle, onMarkAllCooked, onMarkAsWaste, viewMode = 'grid' }) => {
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

  // Filter and sort orders by time only (no urgency sorting to prevent orders from jumping around)
  // Only show orders actively being prepared (exclude ready, completed, delivered)
  const sortedOrders = [...orders]
    .filter(order => !['ready', 'completed', 'delivered'].includes(order.status?.toLowerCase()))
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
      const now = new Date();
      const dueA = new Date(a.dueTime);
      const dueB = new Date(b.dueTime);
      const lateA = dueA < now;
      const lateB = dueB < now;

      // Late orders always appear first
      if (lateA && !lateB) return -1;
      if (!lateA && lateB) return 1;

      // Within same group, sort by due time (soonest first)
      return dueA - dueB;
    });

  // Render order card in grid block style
  const renderOrderCard = (order) => {
    const isExpanded = expandedOrders.has(order.id || order.orderId);
    const urgency = getUrgencyStatus(order.dueTime);
    const orderId = order.id || order.orderId || 'unknown';
    const pizzas = order.pizzas || [];
    const allCooked = pizzas.every((pizza, idx) => order.cooked?.[idx] || pizza.isCooked);

    // Flash animation for late and very late orders
    const isVeryLate = urgency.status === 'VERY LATE';
    const isLate = urgency.status === 'LATE';
    const isAnyLate = isVeryLate || isLate;

    // Determine card status badge
    let statusBadge = 'QUEUE';
    let statusBadgeClass = 'bg-gray-700 text-white';

    if (order.status === 'ready') {
      statusBadge = 'READY';
      statusBadgeClass = 'bg-purple-600 text-white';
    } else if (allCooked) {
      statusBadge = 'FINISHING';
      statusBadgeClass = 'bg-blue-600 text-white';
    } else if (pizzas.some((pizza, idx) => order.cooked?.[idx] || pizza.isCooked)) {
      statusBadge = 'COOKING';
      statusBadgeClass = 'bg-orange-600 text-white';
    } else if (isVeryLate) {
      statusBadge = 'DELAYED';
      statusBadgeClass = 'bg-red-600 text-white';
    }

    return (
      <motion.div
        key={orderId}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{
          opacity: 1,
          scale: 1
        }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-all overflow-hidden border-t-4 ${urgency.borderColor} ${isVeryLate ? 'ring-4 ring-red-500 animate-pulse' : isLate ? 'ring-2 ring-orange-400 animate-pulse' : ''} flex flex-col h-full`}
      >
        {/* Card Header */}
        <div className="p-3 border-b border-gray-200">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              {/* Customer Name - BIGGER */}
              <div className="text-lg font-bold text-gray-900 mb-1 truncate">
                {order.customerName || 'Walk-in Customer'}
              </div>
              {/* Order # - smaller */}
              <div className="text-xs text-gray-500">
                #{orderId.slice(-4).toUpperCase()}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {order.platform && (
                  <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${getPlatformStyle(order.platform)}`}>
                    {order.platform}
                  </span>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div>
              <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase ${statusBadgeClass}`}>
                {statusBadge}
              </span>
            </div>
          </div>

          {/* Due Time */}
          <div className="flex items-center justify-between text-xs">
            <span className={`font-semibold ${urgency.textColor}`}>
              Due: {order.dueTime ? new Date(order.dueTime).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
            </span>
            <span className={`font-bold ${isAnyLate ? 'animate-pulse' : ''} ${urgency.textColor}`}>
              {formatTimeRemaining(order.dueTime)}
            </span>
          </div>
        </div>

        {/* Pizza List */}
        <div
          className="p-3 space-y-1 cursor-pointer select-none bg-gray-50 flex-1 flex flex-col"
          onClick={() => toggleOrder(orderId)}
        >
          {pizzas.map((pizza, index) => {
            const isCooked = order.cooked?.[index] || pizza.isCooked || false;

            return (
              <div key={index} className="text-xs">
                <div className="flex items-start gap-1">
                  <input
                    type="checkbox"
                    checked={isCooked}
                    onChange={(e) => {
                      e.stopPropagation();
                      onPizzaToggle && onPizzaToggle(orderId, index, !isCooked);
                    }}
                    className="mt-0.5 h-3 w-3 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer flex-shrink-0"
                  />
                  <div className={`flex-1 ${isCooked ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    <span className="font-semibold">
                      {pizza.quantity > 1 && `${pizza.quantity} `}
                      {pizza.pizzaType || pizza.name}
                    </span>
                    {pizza.toppings && pizza.toppings.length > 0 && (
                      <div className="text-gray-600 ml-2">
                        {pizza.toppings.map((topping, i) => (
                          <div key={i} className="ml-2">• {topping}</div>
                        ))}
                      </div>
                    )}
                    {pizza.specialInstructions && (
                      <div className="text-orange-600 italic ml-2">⚠️ {pizza.specialInstructions}</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Order Special Instructions */}
          {order.specialInstructions && (
            <div className="mt-2 p-1.5 bg-yellow-100 border-l-2 border-yellow-500 rounded text-xs">
              <span className="font-semibold text-yellow-800">📝 {order.specialInstructions}</span>
            </div>
          )}

          {/* Expand indicator */}
          <div className="text-center pt-1">
            <svg
              className={`w-4 h-4 mx-auto text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Expanded Actions */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-gray-200"
            >
              <div className="p-3 space-y-2 bg-white">
                {!allCooked && (
                  <button
                    onClick={() => {
                      if (onMarkAllCooked) {
                        onMarkAllCooked(orderId);
                      } else {
                        pizzas.forEach((_, idx) => {
                          if (!(order.cooked?.[idx] || pizzas[idx].isCooked)) {
                            onPizzaToggle && onPizzaToggle(orderId, idx, true);
                          }
                        });
                      }
                    }}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700 transition-colors"
                  >
                    ✓ Mark All Cooked
                  </button>
                )}

                {allCooked && order.status !== 'ready' && (
                  <button
                    onClick={() => onStatusChange && onStatusChange(orderId, 'ready')}
                    className="w-full px-3 py-2 bg-purple-600 text-white rounded font-medium text-sm hover:bg-purple-700 transition-colors"
                  >
                    🍕 Mark as Ready
                  </button>
                )}

                {order.status === 'ready' && (
                  <button
                    onClick={() => onStatusChange && onStatusChange(orderId, 'completed')}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded font-medium text-sm hover:bg-green-700 transition-colors"
                  >
                    ✅ Complete Order
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Action Bar */}
        <div className="border-t border-gray-200 bg-gray-900 p-2 flex items-center gap-2">
          <button
            onClick={() => {
              if (!allCooked) {
                // Mark all pizzas cooked in a single write (avoids race condition)
                if (onMarkAllCooked) {
                  onMarkAllCooked(orderId);
                } else {
                  pizzas.forEach((_, idx) => {
                    if (!(order.cooked?.[idx] || pizzas[idx].isCooked)) {
                      onPizzaToggle && onPizzaToggle(orderId, idx, true);
                    }
                  });
                }
              } else if (order.status !== 'ready') {
                // Finish cooking - mark as ready
                onStatusChange && onStatusChange(orderId, 'ready');
              } else {
                // Complete order
                onStatusChange && onStatusChange(orderId, 'completed');
              }
            }}
            className="flex-1 py-2 bg-black text-white rounded font-bold text-xs uppercase hover:bg-gray-800 transition-colors"
          >
            {!allCooked && 'START COOKING'}
            {allCooked && order.status !== 'ready' && 'FINISH COOKING'}
            {order.status === 'ready' && 'COMPLETE'}
          </button>

          {/* Waste Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsWaste && onMarkAsWaste(order);
            }}
            className="px-3 py-2 bg-red-600 text-white rounded font-bold text-xs uppercase hover:bg-red-700 transition-colors"
            title="Mark as Waste"
          >
            🗑️ WASTE
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-gray-900">
          Kitchen Display
        </h2>
        <div className="text-xs text-gray-600">
          {sortedOrders.length} active {sortedOrders.length === 1 ? 'order' : 'orders'}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search by customer name, order #, or platform..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-8 pr-8 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder-gray-500"
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

      {/* Grid or Table Layout Toggle */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 auto-rows-fr">
          <AnimatePresence>
            {sortedOrders.map(renderOrderCard)}
          </AnimatePresence>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="p-3 text-left text-sm font-bold text-gray-700">Status</th>
                <th className="p-3 text-left text-sm font-bold text-gray-700">Order #</th>
                <th className="p-3 text-left text-sm font-bold text-gray-700">Customer</th>
                <th className="p-3 text-left text-sm font-bold text-gray-700">Platform</th>
                <th className="p-3 text-left text-sm font-bold text-gray-700">Due Time</th>
                <th className="p-3 text-left text-sm font-bold text-gray-700">Pizzas</th>
                <th className="p-3 text-left text-sm font-bold text-gray-700">Progress</th>
                <th className="p-3 text-center text-sm font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {sortedOrders.map((order) => {
                  const urgency = getUrgencyStatus(order.dueTime);
                  const orderId = order.id || order.orderId || 'unknown';
                  const pizzas = order.pizzas || [];
                  const allCooked = pizzas.every((pizza, idx) => order.cooked?.[idx] || pizza.isCooked);
                  const isVeryLate = urgency.status === 'VERY LATE';
                  const isLate = urgency.status === 'LATE';
                  const isAnyLate = isVeryLate || isLate;
                  const isExpanded = expandedOrders.has(orderId);

                  // Determine status badge
                  let statusBadge = 'QUEUE';
                  let statusBadgeClass = 'bg-gray-700 text-white';

                  if (order.status === 'ready') {
                    statusBadge = 'READY';
                    statusBadgeClass = 'bg-purple-600 text-white';
                  } else if (allCooked) {
                    statusBadge = 'FINISHING';
                    statusBadgeClass = 'bg-blue-600 text-white';
                  } else if (pizzas.some((pizza, idx) => order.cooked?.[idx] || pizza.isCooked)) {
                    statusBadge = 'COOKING';
                    statusBadgeClass = 'bg-orange-600 text-white';
                  } else if (isVeryLate) {
                    statusBadge = 'DELAYED';
                    statusBadgeClass = 'bg-red-600 text-white';
                  }

                  const cookedCount = pizzas.filter((pizza, idx) => order.cooked?.[idx] || pizza.isCooked).length;

                  return (
                    <React.Fragment key={orderId}>
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${isVeryLate ? 'bg-red-50 animate-pulse' : isLate ? 'bg-orange-50 animate-pulse' : ''}`}
                        onClick={() => toggleOrder(orderId)}
                      >
                        {/* Status Badge */}
                        <td className="p-3">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase ${statusBadgeClass}`}>
                            {statusBadge}
                          </span>
                        </td>

                        {/* Order # - smaller */}
                        <td className="p-3 text-xs text-gray-500">
                          #{orderId.slice(-4).toUpperCase()}
                        </td>

                        {/* Customer - BIGGER */}
                        <td className="p-3 text-base font-bold text-gray-900">
                          {order.customerName || 'Walk-in'}
                        </td>

                        {/* Platform */}
                        <td className="p-3">
                          {order.platform && (
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getPlatformStyle(order.platform)}`}>
                              {order.platform}
                            </span>
                          )}
                        </td>

                        {/* Due Time */}
                        <td className="p-3">
                          <div className="text-sm text-gray-700">
                            {order.dueTime ? new Date(order.dueTime).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </div>
                          <div className={`text-xs font-semibold ${isAnyLate ? 'animate-pulse' : ''} ${urgency.textColor}`}>
                            {formatTimeRemaining(order.dueTime)}
                          </div>
                        </td>

                        {/* Pizzas Count */}
                        <td className="p-3 text-sm text-gray-700">
                          {pizzas.length} {pizzas.length === 1 ? 'pizza' : 'pizzas'}
                        </td>

                        {/* Progress */}
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${pizzas.length > 0 ? (cookedCount / pizzas.length) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-gray-600">
                              {cookedCount}/{pizzas.length}
                            </span>
                          </div>
                        </td>

                        {/* Expand Icon */}
                        <td className="p-3 text-center">
                          <svg
                            className={`w-5 h-5 mx-auto text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </td>
                      </motion.tr>

                      {/* Expanded Row Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <td colSpan="8" className="p-0">
                              <div className="bg-gray-50 p-4 border-t border-gray-200">
                                {/* Pizza Checklist */}
                                <div className="mb-4">
                                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Pizzas:</h4>
                                  <div className="space-y-2">
                                    {pizzas.map((pizza, index) => {
                                      const isCooked = order.cooked?.[index] || pizza.isCooked || false;

                                      return (
                                        <div key={index} className="flex items-start gap-3 p-2 bg-white rounded border border-gray-200">
                                          <input
                                            type="checkbox"
                                            checked={isCooked}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              onPizzaToggle && onPizzaToggle(orderId, index, !isCooked);
                                            }}
                                            className="mt-1 h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                          />
                                          <div className="flex-1">
                                            <div className={`font-semibold text-sm ${isCooked ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                              {pizza.quantity > 1 && `${pizza.quantity}x `}
                                              {pizza.pizzaType || pizza.name}
                                              {isCooked && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 text-xs font-bold bg-green-500 text-white rounded-full">
                                                  ✓ DONE
                                                </span>
                                              )}
                                            </div>
                                            {pizza.toppings && pizza.toppings.length > 0 && (
                                              <div className="text-xs text-gray-600 mt-1">
                                                + {pizza.toppings.join(', ')}
                                              </div>
                                            )}
                                            {pizza.specialInstructions && (
                                              <div className="text-xs text-orange-600 italic mt-1">
                                                ⚠️ {pizza.specialInstructions}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Order Special Instructions */}
                                {order.specialInstructions && (
                                  <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                                    <p className="text-sm font-semibold text-yellow-800">
                                      📝 {order.specialInstructions}
                                    </p>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                  {!allCooked && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onMarkAllCooked) {
                                          onMarkAllCooked(orderId);
                                        } else {
                                          pizzas.forEach((_, idx) => {
                                            if (!(order.cooked?.[idx] || pizzas[idx].isCooked)) {
                                              onPizzaToggle && onPizzaToggle(orderId, idx, true);
                                            }
                                          });
                                        }
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

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onMarkAsWaste && onMarkAsWaste(order);
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                                  >
                                    🗑️ Mark as Waste
                                  </button>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>

          {sortedOrders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg font-medium">No orders to display</p>
            </div>
          )}
        </div>
      )}

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
