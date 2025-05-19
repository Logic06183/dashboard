import React, { useState, useEffect, useMemo } from 'react';
import { format, isAfter, isBefore, startOfDay, addDays, addHours } from 'date-fns';
import useFirebaseOrders from '../hooks/useFirebaseOrders';
import { updatePizzaStatus, updateOrder } from '../services/FirebaseService';

const TableKitchenDisplay = ({ onStatusChange, onPizzaStatusChange, onArchiveOrder }) => {
  const { data: firebaseOrders, loading, error } = useFirebaseOrders();
  const [displayOrders, setDisplayOrders] = useState([]);
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
  
  // Filter orders for kitchen display based on 2 AM cutoff
  const filterOrdersByCutoff = (orders) => {
    if (!Array.isArray(orders)) return [];
    
    const now = new Date();
    const today = startOfDay(now);
    const cutoffTime = isBefore(now, addHours(today, 2)) ? 
      addHours(addDays(today, -1), 2) : // Yesterday 2 AM
      addHours(today, 2); // Today 2 AM
    
    return orders.filter(order => {
      const orderTime = new Date(order.orderTime || order.createdAt);
      return isAfter(orderTime, cutoffTime);
    });
  };

  // Filter orders when Firebase data changes
  useEffect(() => {
    setDisplayOrders(filterOrdersByCutoff(firebaseOrders));
  }, [firebaseOrders]);

  // Get time status for an order
  const getTimeStatus = (dueTime) => {
    if (!dueTime) return 'Unknown';
    
    const now = new Date();
    const due = new Date(dueTime);
    const diffMinutes = Math.floor((due - now) / (1000 * 60));
    
    if (diffMinutes < -15) return 'Very Late';
    if (diffMinutes < 0) return 'Late';
    return 'On Time';
  };

  // Get CSS class for time status
  const getTimeStatusClass = (status) => {
    switch (status) {
      case 'Very Late':
        return 'bg-red-100 text-red-800';
      case 'Late':
        return 'bg-orange-100 text-orange-800';
      case 'On Time':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get CSS class for platform highlighting
  const getPlatformHighlightClass = (platform) => {
    if (!platform) return '';
    
    switch (platform.toLowerCase()) {
      case 'window':
        return 'bg-blue-50 border-l-4 border-blue-500';
      case 'uber eats':
        return 'bg-green-50 border-l-4 border-green-500';
      case 'mr d food':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'bolt food':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      case 'customer pickup':
        return 'bg-purple-50 border-l-4 border-purple-500';
      default:
        return 'bg-gray-50 border-l-4 border-gray-300';
    }
  };

  // Process and sort orders
  const sortedOrders = useMemo(() => {
    return [...displayOrders]
      .map(order => ({
        ...order,
        orderTime: new Date(order.orderTime || order.createdAt),
        dueTime: new Date(order.dueTime || order.orderTime || order.createdAt),
        timeStatus: getTimeStatus(order.dueTime),
        orderTimeFormatted: format(new Date(order.orderTime || order.createdAt), 'HH:mm'),
        dueTimeFormatted: format(new Date(order.dueTime || order.orderTime || order.createdAt), 'HH:mm')
      }))
      .sort((a, b) => {
        // Sort by completion status
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        
        // Sort by urgency
        if (a.timeStatus === 'Very Late' && b.timeStatus !== 'Very Late') return -1;
        if (b.timeStatus === 'Very Late' && a.timeStatus !== 'Very Late') return 1;
        if (a.timeStatus === 'Late' && b.timeStatus === 'On Time') return -1;
        if (b.timeStatus === 'Late' && a.timeStatus === 'On Time') return 1;
        
        // Sort by due time
        return a.dueTime - b.dueTime;
      });
  }, [displayOrders]);

  // Handle pizza completion status changes
  const handlePizzaStatusChange = async (orderId, pizzaIndex, isCompleted) => {
    try {
      const order = sortedOrders.find(o => o.id === orderId || o.orderId === orderId);
      if (!order) return;

      // Create or update the cooked array
      const cookedArray = order.cooked || Array(order.pizzas?.length || 0).fill(false);
      cookedArray[pizzaIndex] = isCompleted;

      // Check if all pizzas are cooked
      const allCooked = cookedArray.every(status => status);

      // Update the order in Firebase
      await updateOrder(orderId, {
        cooked: cookedArray,
        status: allCooked ? 'completed' : 'pending',
        completed: allCooked
      });

      if (onStatusChange) {
        onStatusChange(orderId, allCooked ? 'completed' : 'pending');
      }
      
      // If all pizzas are cooked, remove the order from highlighted orders
      if (allCooked && highlightedOrders[orderId]) {
        const newHighlightedOrders = { ...highlightedOrders };
        delete newHighlightedOrders[orderId];
        setHighlightedOrders(newHighlightedOrders);
      }
    } catch (error) {
      console.error('Error updating pizza status:', error);
    }
  };
  
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

  if (loading) {
    return <div className="p-4 text-center">Loading orders...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">Error loading orders: {error.message}</div>;
  }

  // Platform legend data
  const platformLegend = [
    { name: 'Window', color: '#3b82f6', bgColor: 'bg-blue-50', borderColor: 'border-blue-500' },
    { name: 'Uber Eats', color: '#10b981', bgColor: 'bg-green-50', borderColor: 'border-green-500' },
    { name: 'Mr D Food', color: '#ef4444', bgColor: 'bg-red-50', borderColor: 'border-red-500' },
    { name: 'Bolt Food', color: '#f59e0b', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-500' },
    { name: 'Customer Pickup', color: '#8b5cf6', bgColor: 'bg-purple-50', borderColor: 'border-purple-500' },
    { name: 'Other', color: '#9ca3af', bgColor: 'bg-gray-50', borderColor: 'border-gray-300' },
  ];
  
  // Count highlighted orders
  const highlightedCount = Object.keys(highlightedOrders).length;

  return (
    <div className="overflow-x-auto">
      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 text-red-700 rounded">
          Error loading orders: {error.message}
        </div>
      )}
      
      {/* Platform Legend and Highlighted Orders Counter */}
      <div className="mb-4 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700">Delivery Platform Legend:</h3>
          <div className="flex items-center">
            <div className="bg-yellow-100 border-2 border-yellow-400 text-yellow-800 px-3 py-1 rounded-full flex items-center">
              <span className="font-medium">{highlightedCount} Highlighted {highlightedCount === 1 ? 'Order' : 'Orders'}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {platformLegend.map((platform) => (
            <div key={platform.name} className="flex items-center">
              <div className={`w-3 h-6 ${platform.bgColor} border-l-2 ${platform.borderColor} mr-1`}></div>
              <span 
                className="px-2 py-1 text-xs font-semibold rounded-full bg-opacity-20"
                style={{ backgroundColor: platform.color, color: '#1f2937' }}
              >
                {platform.name}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Highlighting Instructions */}
      <div className="mb-4 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">How to Highlight Orders:</h3>
        <p className="text-sm text-gray-600">Click on any order row to highlight it with a yellow border. Click again to remove the highlight. This helps you keep track of which orders you're currently working on.</p>
      </div>
      
      {/* Highlighted Orders Section */}
      {highlightedCount > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow-md">
          <div className="flex items-center mb-3">
            <h2 className="text-lg font-bold text-yellow-800">Highlighted Orders ({highlightedCount})</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.keys(highlightedOrders).map(orderId => {
              const order = sortedOrders.find(o => (o.id === orderId || o.orderId === orderId));
              if (!order) return null;
              
              return (
                <div key={orderId} className="bg-white p-3 rounded-md border-l-4 border-yellow-400 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center">
                        <span className="font-bold text-yellow-800">{order.customerName || 'Walk-in Customer'}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Due: {order.dueTimeFormatted}</div>
                      <div className="text-xs text-gray-500">Platform: {order.platform || 'Walk-in'}</div>
                      <div className="mt-2">
                        {order.pizzas?.map((pizza, idx) => (
                          <div key={idx} className="text-sm">
                            <span className={order.cooked?.[idx] ? 'line-through text-gray-400' : ''}>
                              {pizza.quantity}x {pizza.pizzaType}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOrderHighlight(orderId);
                      }}
                      className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}
      
      {/* Order cutoff notice */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-600">
          <span className="font-medium">Note:</span> Orders are automatically cleared at 2 AM SAST each day.
          Previous orders can be viewed in the analytics dashboard.
        </p>
      </div>
      
      <table className="min-w-full bg-white border border-gray-200 shadow-md rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            <th className="px-4 py-3 border-b font-bold text-red-600">Due By</th>
            <th className="px-4 py-3 border-b font-bold">Time Left</th>
            <th className="px-4 py-3 border-b font-bold">Customer</th>
            <th className="px-4 py-3 border-b font-bold">Platform</th>
            <th className="px-4 py-3 border-b font-bold">Pizzas</th>
            <th className="px-4 py-3 border-b font-bold">Extra Toppings</th>
            <th className="px-4 py-3 border-b font-bold">Prep Time</th>
            <th className="px-4 py-3 border-b font-bold">Status</th>
            <th className="px-4 py-3 border-b font-bold">Done</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedOrders.map(order => {
            const isCompleted = order.status === 'completed';
            const statusClass = getTimeStatusClass(order.timeStatus);

            return (
              <tr 
                key={order.id || order.orderId} 
                onClick={() => toggleOrderHighlight(order.id || order.orderId)}
                className={`${isCompleted ? 'bg-gray-50' : 'hover:bg-gray-50'} 
                  ${order.timeStatus === 'Very Late' ? 'bg-red-50' : order.timeStatus === 'Late' ? 'bg-orange-50' : ''}
                  ${!isCompleted ? getPlatformHighlightClass(order.platform) : ''}
                  ${isOrderHighlighted(order.id || order.orderId) ? 'border-4 border-yellow-400 shadow-lg' : ''}
                  cursor-pointer transition-all duration-200`}
              >
                <td className="px-4 py-3 text-sm font-bold text-red-600">{order.dueTimeFormatted}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTimeStatusClass(order.timeStatus)}`}>
                    {order.timeStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-medium">
                  <div className="font-semibold">{order.customerName || 'Walk-in Customer'}</div>
                  {order.phone && <div className="text-xs text-gray-500">{order.phone}</div>}
                </td>
                <td className="px-4 py-3 text-sm font-medium">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-opacity-20"
                    style={{
                      backgroundColor: order.platform?.toLowerCase() === 'window' ? '#3b82f6' : 
                                      order.platform?.toLowerCase() === 'uber eats' ? '#10b981' :
                                      order.platform?.toLowerCase() === 'mr d food' ? '#ef4444' :
                                      order.platform?.toLowerCase() === 'bolt food' ? '#f59e0b' :
                                      order.platform?.toLowerCase() === 'customer pickup' ? '#8b5cf6' : '#9ca3af',
                      color: '#1f2937'
                    }}>
                    {order.platform || 'Walk-in'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {order.pizzas?.map((pizza, idx) => {
                    const orderId = order.id || order.orderId;
                    const isHighlighted = isOrderHighlighted(orderId);
                    return (
                      <div 
                        key={idx} 
                        className={`mb-2 last:mb-0 p-2 rounded-md transition-all ${isHighlighted ? 'bg-yellow-50' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={order.cooked?.[idx] || false}
                            onChange={(e) => handlePizzaStatusChange(orderId, idx, e.target.checked)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            onClick={(e) => e.stopPropagation()} // Prevent row click when clicking checkbox
                          />
                          <span className={`font-medium ${order.cooked?.[idx] ? 'line-through text-gray-400' : isHighlighted ? 'text-yellow-800 font-bold' : ''}`}>
                            {pizza.quantity}x {pizza.pizzaType}
                          </span>
                          {isHighlighted && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Prioritized
                            </span>
                          )}
                        </div>
                        {pizza.specialInstructions && (
                          <div className="ml-6 text-xs text-orange-600 mt-1">
                            {pizza.specialInstructions}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </td>
                <td className="px-4 py-3 text-sm">
                  {order.specialInstructions ? (
                    <div className="text-orange-600">{order.specialInstructions}</div>
                  ) : '-'}
                </td>
                <td className="px-4 py-3 text-sm font-medium">{order.prepTime ? `${order.prepTime} min` : '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                    {isCompleted ? 'Completed' : order.timeStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isCompleted ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {isCompleted ? 'Done' : 'In Progress'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {sortedOrders.length === 0 && !loading && !error && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">No active orders</p>
          <p className="text-gray-400 mt-2">New orders will appear here automatically</p>
        </div>
      )}
    </div>
  );
};

export default TableKitchenDisplay;
