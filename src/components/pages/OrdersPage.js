import React, { useState, useEffect, useMemo } from 'react';
import FirebaseService from '../../services/FirebaseService';

const { updateOrder, subscribeToOrders } = FirebaseService;

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
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
          <div className="grid gap-4">
            {groupedOrders.late.map(order => (
              <div key={order.id || order.orderId} className="bg-white p-4 rounded-lg shadow-sm">
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
              <div key={order.id || order.orderId} className="bg-white shadow rounded-lg p-4 border-l-4 border-orange-500">
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
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Normal Priority Orders */}
      {groupedOrders.normal.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-blue-600 flex items-center gap-2 mb-4">
            <span className="inline-block w-3 h-3 bg-blue-600 rounded-full"></span>
            Normal Orders ({groupedOrders.normal.length})
          </h3>
          <div className="grid gap-4">
            {groupedOrders.normal.map(order => (
              <div key={order.id || order.orderId} className="bg-white shadow rounded-lg p-4 border-l-4 border-blue-600">
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
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Completed Orders */}
      {showCompleted && groupedOrders.completed.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-green-600 flex items-center gap-2 mb-4">
            <span className="inline-block w-3 h-3 bg-green-600 rounded-full"></span>
            Completed Orders ({groupedOrders.completed.length})
          </h3>
          <div className="grid gap-4">
            {groupedOrders.completed.map(order => (
              <div key={order.id || order.orderId} className="bg-white shadow rounded-lg p-4 border-l-4 border-green-600">
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
                  </div>
                )}
              </div>
            ))}
          </div>
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