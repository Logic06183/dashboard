import React, { useState, useEffect, useMemo } from 'react';
import { format, isAfter, isBefore, startOfDay, addDays, addHours } from 'date-fns';
import useFirebaseOrders from '../hooks/useFirebaseOrders';
import { updatePizzaStatus, updateOrder } from '../services/FirebaseService';

const TableKitchenDisplay = ({ onStatusChange }) => {
  const { data: firebaseOrders, loading, error } = useFirebaseOrders();
  const [displayOrders, setDisplayOrders] = useState([]);
  
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
    } catch (error) {
      console.error('Error updating pizza status:', error);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading orders...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">Error loading orders: {error.message}</div>;
  }

  return (
    <div className="overflow-x-auto">
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
                className={`${isCompleted ? 'bg-gray-50' : 'hover:bg-gray-50'} ${order.timeStatus === 'Very Late' ? 'bg-red-50' : order.timeStatus === 'Late' ? 'bg-orange-50' : ''}`}
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
                <td className="px-4 py-3 text-sm font-medium">{order.platform || 'Walk-in'}</td>
                <td className="px-4 py-3 text-sm">
                  {order.pizzas?.map((pizza, idx) => (
                    <div key={idx} className="mb-2 last:mb-0">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={order.cooked?.[idx] || false}
                          onChange={(e) => handlePizzaStatusChange(order.id || order.orderId, idx, e.target.checked)}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className={`font-medium ${order.cooked?.[idx] ? 'line-through text-gray-400' : ''}`}>
                          {pizza.quantity}x {pizza.pizzaType}
                        </span>
                      </div>
                      {pizza.specialInstructions && (
                        <div className="ml-6 text-xs text-orange-600 mt-1">
                          {pizza.specialInstructions}
                        </div>
                      )}
                    </div>
                  ))}
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
