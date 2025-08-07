import React, { useState, useEffect, useMemo } from 'react';
import FirebaseService from '../../services/FirebaseService';

const { updateOrder, subscribeToOrders } = FirebaseService;

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [highlightedOrders, setHighlightedOrders] = useState({});
  
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
      
      {/* Highlighted Orders Section */}
      {Object.keys(highlightedOrders).length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow-md">
          <div className="flex items-center mb-3">
            <h2 className="text-lg font-bold text-yellow-800">Highlighted Orders ({Object.keys(highlightedOrders).length})</h2>
            <p className="ml-2 text-sm text-yellow-700">Click on an order again to remove highlighting</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.keys(highlightedOrders).map(orderId => {
              // Find the order in all groups
              const order = [...groupedOrders.late, ...groupedOrders.urgent, ...groupedOrders.pending, ...groupedOrders.completed]
                .find(o => (o.id === orderId || o.orderId === orderId));
              
              if (!order) return null;
              
              return (
                <div 
                  key={orderId} 
                  onClick={() => toggleOrderHighlight(orderId)}
                  className="bg-white p-3 rounded-md border-l-4 border-yellow-400 shadow-sm cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <span className="font-bold text-yellow-800">{order.customerName || 'Anonymous Customer'}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Due: {formatSATime(order.dueTime || order.orderTime)}</div>
                      <div className="text-xs text-gray-500">Platform: {order.platform || 'Window'}</div>
                      <div className="mt-2">
                        {order.pizzas?.map((pizza, idx) => (
                          <div key={idx} className="text-sm">
                            <span className={order.cooked?.[idx] ? 'line-through text-gray-400' : ''}>
                              {pizza.quantity || 1}x {pizza.pizzaType || pizza.type || (typeof pizza === 'string' ? pizza : 'Pizza')}
                            </span>
                          </div>
                        ))}
                        {order.coldDrinks && order.coldDrinks.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            {order.coldDrinks.map((drink, idx) => (
                              <div key={idx} className="text-sm text-blue-600">
                                {drink.quantity}x {drink.drinkType}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Late Orders - Highest Priority */}
      {groupedOrders.late.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-red-600 flex items-center gap-2 mb-4">
            <span className="inline-block w-3 h-3 bg-red-600 rounded-full"></span>
            Late Orders ({groupedOrders.late.length})
          </h3>
          <div className="grid gap-4">
            {groupedOrders.late.map(order => (
              <div 
                key={order.id || order.orderId} 
                onClick={() => toggleOrderHighlight(order.id || order.orderId)}
                className={`bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500 
                  ${isOrderHighlighted(order.id || order.orderId) ? 'ring-2 ring-yellow-400 shadow-lg' : ''}
                  cursor-pointer transition-all duration-200`}
              >
                <p className="text-lg font-medium text-purple-600 mb-1">
                  {order.customerName || 'Anonymous Customer'}
                </p>
                <p className="text-sm text-gray-600 mb-2">Order #{order.id || order.orderId}</p>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">{order.customer}</h4>
                    <p className="text-sm font-medium text-gray-800">
                      Via: {order.platform || 'Window'}
                    </p>
                  </div>
                  <span className="text-red-600 font-medium">Late</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <p>Order #{order.id || order.orderId}</p>
                  <div className="flex items-center gap-2">
                    {order.orderTime && (
                      <span>Ordered: {formatSATime(order.orderTime)}</span>
                    )}
                    {!isOrderCompleted(order) && order.dueTime && (
                      <span className="font-medium">Due: 
                        <span className={getTimeStatus(order.dueTime)?.status === 'late' ? 'text-red-600' : ''}>
                          {formatSATime(order.dueTime)}
                        </span>
                        {getTimeStatus(order.dueTime) && (
                          <span className="ml-2 text-xs">
                            {getTimeStatus(order.dueTime).status === 'late' 
                              ? `(${getTimeStatus(order.dueTime).minutes}m late)` 
                              : `(${getTimeStatus(order.dueTime).minutes}m left)`}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                {order.pizzas && (
                  <div className="mt-2">
                    {order.pizzas.map((pizza, i) => (
                      <div key={i} className="text-sm py-1 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={order.cooked?.[i] || false}
                            onClick={(e) => e.stopPropagation()} // Prevent row click when clicking checkbox
                            onChange={async (e) => {
                              try {
                                const cookedArray = [...(order.cooked || Array(order.pizzas.length).fill(false))];
                                cookedArray[i] = e.target.checked;
                                const allCooked = cookedArray.every(status => status);
                                
                                await updateOrder(order.id || order.orderId, {
                                  cooked: cookedArray,
                                  status: allCooked ? 'done' : 'pending',
                                  completed: allCooked
                                });
                                
                                // If all pizzas are cooked, remove the order from highlighted orders
                                if (allCooked && isOrderHighlighted(order.id || order.orderId)) {
                                  toggleOrderHighlight(order.id || order.orderId);
                                }
                              } catch (error) {
                                console.error('Error updating pizza status:', error);
                              }
                            }}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <span className={order.cooked?.[i] ? 'line-through text-gray-400' : ''}>
                            {pizza.quantity || 1}x {pizza.pizzaType || pizza.type || (typeof pizza === 'string' ? pizza : 'Pizza')}
                          </span>
                        </div>
                        {pizza.specialInstructions && (
                          <div className="text-xs text-orange-600">{pizza.specialInstructions}</div>
                        )}
                        {order.cooked && Array.isArray(order.cooked) && order.cooked[i] && (
                          <span className="text-green-600 font-medium text-xs">COOKED</span>
                        )}
                      </div>
                    ))}
                    {order.coldDrinks && order.coldDrinks.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="text-xs font-medium text-gray-600 mb-1">Cold Drinks:</div>
                        {order.coldDrinks.map((drink, idx) => (
                          <div key={idx} className="text-sm text-blue-600">
                            {drink.quantity}x {drink.drinkType}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Urgent Orders */}
      {groupedOrders.urgent.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-orange-600 flex items-center gap-2 mb-4">
            <span className="inline-block w-3 h-3 bg-orange-600 rounded-full"></span>
            Urgent Orders ({groupedOrders.urgent.length})
          </h3>
          <div className="grid gap-4">
            {groupedOrders.urgent.map(order => (
              <div 
                key={order.id || order.orderId} 
                onClick={() => toggleOrderHighlight(order.id || order.orderId)}
                className={`bg-white shadow rounded-lg p-4 border-l-4 border-orange-500 
                  ${isOrderHighlighted(order.id || order.orderId) ? 'ring-2 ring-yellow-400 shadow-lg' : ''}
                  cursor-pointer transition-all duration-200`}
              >
                <p className="text-lg font-medium text-purple-600 mb-1">
                  {order.customerName || 'Anonymous Customer'}
                </p>
                <p className="text-sm text-gray-600 mb-2">Order #{order.id || order.orderId}</p>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">{order.customer}</h4>
                    <p className="text-sm font-medium text-gray-800">
                      Via: {order.platform || 'Window'}
                    </p>
                  </div>
                  <span className="text-orange-600 font-medium">Urgent</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    {order.orderTime && (
                      <span>Ordered: {formatSATime(order.orderTime)}</span>
                    )}
                    {!isOrderCompleted(order) && order.dueTime && (
                      <span className="font-medium">Due: 
                        <span className={getTimeStatus(order.dueTime)?.status === 'late' ? 'text-red-600' : ''}>
                          {formatSATime(order.dueTime)}
                        </span>
                        {getTimeStatus(order.dueTime) && (
                          <span className="ml-2 text-xs">
                            {getTimeStatus(order.dueTime).status === 'late' 
                              ? `(${getTimeStatus(order.dueTime).minutes}m late)` 
                              : `(${getTimeStatus(order.dueTime).minutes}m left)`}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                {order.pizzas && (
                  <div className="mt-2">
                    {order.pizzas.map((pizza, i) => (
                      <div key={i} className="text-sm py-1 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={order.cooked?.[i] || false}
                            onClick={(e) => e.stopPropagation()} // Prevent row click when clicking checkbox
                            onChange={async (e) => {
                              try {
                                const cookedArray = [...(order.cooked || Array(order.pizzas.length).fill(false))];
                                cookedArray[i] = e.target.checked;
                                const allCooked = cookedArray.every(status => status);
                                
                                await updateOrder(order.id || order.orderId, {
                                  cooked: cookedArray,
                                  status: allCooked ? 'done' : 'pending',
                                  completed: allCooked
                                });
                                
                                // If all pizzas are cooked, remove the order from highlighted orders
                                if (allCooked && isOrderHighlighted(order.id || order.orderId)) {
                                  toggleOrderHighlight(order.id || order.orderId);
                                }
                              } catch (error) {
                                console.error('Error updating pizza status:', error);
                              }
                            }}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <span className={order.cooked?.[i] ? 'line-through text-gray-400' : ''}>
                            {pizza.quantity || 1}x {pizza.pizzaType || pizza.type || (typeof pizza === 'string' ? pizza : 'Pizza')}
                          </span>
                        </div>
                        {pizza.specialInstructions && (
                          <div className="text-xs text-orange-600">{pizza.specialInstructions}</div>
                        )}
                        {order.cooked && Array.isArray(order.cooked) && order.cooked[i] && (
                          <span className="text-green-600 font-medium text-xs">COOKED</span>
                        )}
                      </div>
                    ))}
                    {order.coldDrinks && order.coldDrinks.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="text-xs font-medium text-gray-600 mb-1">Cold Drinks:</div>
                        {order.coldDrinks.map((drink, idx) => (
                          <div key={idx} className="text-sm text-blue-600">
                            {drink.quantity}x {drink.drinkType}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Normal Priority Orders */}
      {groupedOrders.pending.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-blue-600 flex items-center gap-2 mb-4">
            <span className="inline-block w-3 h-3 bg-blue-600 rounded-full"></span>
            Normal Orders ({groupedOrders.pending.length})
          </h3>
          <div className="grid gap-4">
            {groupedOrders.pending.map(order => (
              <div 
                key={order.id || order.orderId} 
                onClick={() => toggleOrderHighlight(order.id || order.orderId)}
                className={`bg-white shadow rounded-lg p-4 border-l-4 border-blue-600 
                  ${isOrderHighlighted(order.id || order.orderId) ? 'ring-2 ring-yellow-400 shadow-lg' : ''}
                  cursor-pointer transition-all duration-200`}
              >
                <p className="text-lg font-medium text-purple-600 mb-1">
                  {order.customerName || 'Anonymous Customer'}
                </p>
                <p className="text-sm text-gray-600 mb-2">Order #{order.id || order.orderId}</p>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold">{order.customer}</h4>
                    <p className="text-sm font-medium text-gray-800">
                      Via: {order.platform || 'Window'}
                    </p>
                  </div>
                  <span className="text-blue-600 font-medium">Normal</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <p>Order #{order.id || order.orderId}</p>
                  <div className="flex items-center gap-2">
                    {order.orderTime && (
                      <span>Ordered: {formatSATime(order.orderTime)}</span>
                    )}
                    {!isOrderCompleted(order) && order.dueTime && (
                      <span className="font-medium">Due: 
                        <span className={getTimeStatus(order.dueTime)?.status === 'late' ? 'text-red-600' : ''}>
                          {formatSATime(order.dueTime)}
                        </span>
                        {getTimeStatus(order.dueTime) && (
                          <span className="ml-2 text-xs">
                            {getTimeStatus(order.dueTime).status === 'late' 
                              ? `(${getTimeStatus(order.dueTime).minutes}m late)` 
                              : `(${getTimeStatus(order.dueTime).minutes}m left)`}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                {order.pizzas && (
                  <div className="mt-2">
                    {order.pizzas.map((pizza, i) => (
                      <div key={i} className="text-sm py-1 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={order.cooked?.[i] || false}
                            onClick={(e) => e.stopPropagation()} // Prevent row click when clicking checkbox
                            onChange={async (e) => {
                              try {
                                const cookedArray = [...(order.cooked || Array(order.pizzas.length).fill(false))];
                                cookedArray[i] = e.target.checked;
                                const allCooked = cookedArray.every(status => status);
                                
                                await updateOrder(order.id || order.orderId, {
                                  cooked: cookedArray,
                                  status: allCooked ? 'done' : 'pending',
                                  completed: allCooked
                                });
                                
                                // If all pizzas are cooked, remove the order from highlighted orders
                                if (allCooked && isOrderHighlighted(order.id || order.orderId)) {
                                  toggleOrderHighlight(order.id || order.orderId);
                                }
                              } catch (error) {
                                console.error('Error updating pizza status:', error);
                              }
                            }}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                          />
                          <span className={order.cooked?.[i] ? 'line-through text-gray-400' : ''}>
                            {pizza.quantity || 1}x {pizza.pizzaType || pizza.type || (typeof pizza === 'string' ? pizza : 'Pizza')}
                          </span>
                        </div>
                        {pizza.specialInstructions && (
                          <div className="text-xs text-orange-600">{pizza.specialInstructions}</div>
                        )}
                        {order.cooked && Array.isArray(order.cooked) && order.cooked[i] && (
                          <span className="text-green-600 font-medium text-xs">COOKED</span>
                        )}
                      </div>
                    ))}
                    {order.coldDrinks && order.coldDrinks.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <div className="text-xs font-medium text-gray-600 mb-1">Cold Drinks:</div>
                        {order.coldDrinks.map((drink, idx) => (
                          <div key={idx} className="text-sm text-blue-600">
                            {drink.quantity}x {drink.drinkType}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Completed Orders - Grouped by Date */}
      {showCompleted && groupedOrders.completed.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-green-600 flex items-center gap-2 mb-4">
            <span className="inline-block w-3 h-3 bg-green-600 rounded-full"></span>
            Completed Orders ({groupedOrders.completed.length})
          </h3>
          
          {/* Render orders grouped by date */}
          {Object.entries(groupedOrders.completedByDate).map(([dateString, dateOrders]) => (
            <div key={dateString} className="mb-6">
              <div className="bg-gray-100 p-2 rounded-t-lg border-b border-gray-200">
                <h4 className="text-md font-medium text-gray-700">
                  {dateString} ({dateOrders.length} orders)
                </h4>
              </div>
              <div className="grid gap-4 bg-white p-4 rounded-b-lg shadow mb-6">
                {dateOrders.map(order => (
                  <div 
                    key={order.id || order.orderId} 
                    onClick={() => toggleOrderHighlight(order.id || order.orderId)}
                    className={`bg-white shadow-sm rounded-lg p-4 border-l-4 border-green-600 
                      ${isOrderHighlighted(order.id || order.orderId) ? 'ring-2 ring-yellow-400 shadow-lg' : ''}
                      cursor-pointer transition-all duration-200`}
                  >
                    <p className="text-lg font-medium text-purple-600 mb-1">
                      {order.customerName || 'Anonymous Customer'}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">Order #{order.id || order.orderId}</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{order.customer}</h4>
                        <p className="text-sm font-medium text-gray-800">
                          Via: {order.platform || 'Window'}
                        </p>
                      </div>
                      <span className="text-green-600 font-medium">Completed</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        {order.orderTime && (
                          <span>Ordered: {formatSATime(order.orderTime)}</span>
                        )}
                        {order.completionTime && (
                          <span className="font-medium">Completed: {formatSATime(order.completionTime)}</span>
                        )}
                      </div>
                    </div>
                    {order.pizzas && (
                      <div className="mt-2">
                        {order.pizzas.map((pizza, i) => (
                          <div key={i} className="text-sm py-1 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={order.cooked?.[i] || false}
                                disabled={true}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-not-allowed"
                              />
                              <span className="line-through text-gray-400">
                                {pizza.quantity || 1}x {pizza.pizzaType || pizza.type || (typeof pizza === 'string' ? pizza : 'Pizza')}
                              </span>
                            </div>
                            {pizza.specialInstructions && (
                              <div className="text-xs text-orange-600">{pizza.specialInstructions}</div>
                            )}
                            {pizza.specialInstructions && (
                              <div className="text-xs text-orange-600">{pizza.specialInstructions}</div>
                            )}
                          </div>
                        ))}
                        {order.coldDrinks && order.coldDrinks.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="text-xs font-medium text-gray-600 mb-1">Cold Drinks:</div>
                            {order.coldDrinks.map((drink, idx) => (
                              <div key={idx} className="text-sm text-blue-600">
                                {drink.quantity}x {drink.drinkType}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Orders Message */}
      {(sortedOrders.length === 0 || (!showCompleted && groupedOrders.late.length === 0 && 
        groupedOrders.urgent.length === 0 && groupedOrders.pending.length === 0)) && (
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
