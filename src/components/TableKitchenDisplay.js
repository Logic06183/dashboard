import React, { useState, useEffect } from 'react';
import useFirebaseOrders from '../hooks/useFirebaseOrders';
import { updatePizzaStatus, updateOrder } from '../services/FirebaseService';

const TableKitchenDisplay = ({ onStatusChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sortedOrders, setSortedOrders] = useState([]);
  
  // Use our Firebase hook to get real-time order updates directly from Firestore
  const { data: firebaseOrders, loading, error } = useFirebaseOrders();

  // Update current time periodically, keeping this disabled to prevent auto-refreshes
  useEffect(() => {
    console.log('Automatic time updates disabled in Table Kitchen Display');
    // Set initial time but don't update automatically
    setCurrentTime(new Date());
    return () => {};
  }, []);
  
  // No longer need to load from localStorage as we get real-time data from Firebase

  // Sort and process orders - now using firebaseOrders from our hook
  useEffect(() => {
    if (!Array.isArray(firebaseOrders) || firebaseOrders.length === 0) return;
    
    // Use Firebase data directly - no need for localStorage
    let ordersWithSavedState = [...firebaseOrders];
    
    // Process orders: calculate due times and statuses
    const processedOrders = ordersWithSavedState.map(order => {
      // Add computed fields for display
      const orderTime = new Date(order.orderTime || order.createdAt);
      const prepTimeMinutes = order.prepTime || 15;
      const dueTime = new Date(orderTime.getTime() + prepTimeMinutes * 60000);
      
      // Calculate if order is on time, late, or very late
      const timeDiff = dueTime - currentTime;
      let timeStatus = 'On Time';
      if (timeDiff < 0) {
        timeStatus = timeDiff < -10 * 60000 ? 'Very Late' : 'Late';
      }
      
      // Format times for display
      const dueTimeFormatted = dueTime.toLocaleTimeString('en-ZA', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
      
      const orderTimeFormatted = orderTime.toLocaleString('en-ZA', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      return {
        ...order,
        dueTime,
        dueTimeFormatted,
        orderTimeFormatted,
        timeStatus
      };
    });
    
    // Sort by urgency (incomplete orders first, then by due time)
    const sorted = processedOrders.sort((a, b) => {
      // First sort by completion status
      const aCompleted = a.status === 'ready' || a.status === 'delivered';
      const bCompleted = b.status === 'ready' || b.status === 'delivered';
      if (aCompleted !== bCompleted) {
        return aCompleted ? 1 : -1; // Incomplete orders first
      }
      
      // Then sort by time status severity
      const statusPriority = {
        'Very Late': 0,
        'Late': 1,
        'On Time': 2,
        'Future': 3
      };
      
      const aPriority = statusPriority[a.timeStatus] || 3;
      const bPriority = statusPriority[b.timeStatus] || 3;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority; // Sort by urgency
      }
      
      // Finally sort by order time (oldest first)
      return new Date(a.orderTime) - new Date(b.orderTime);
      return a.dueTime - b.dueTime;
    });
    
    setSortedOrders(sorted);
  }, [firebaseOrders, currentTime]);
  
  // We no longer need to listen for custom events since Firebase real-time updates handle this

  // Format pizzas by row with special instructions
  const formatPizzasByRow = (order) => {
    if (!order.pizzas || !Array.isArray(order.pizzas)) return { row1: '', row2: '', row3: '' };
    
    const rows = {
      row1: [],
      row2: [],
      row3: []
    };
    
    order.pizzas.forEach(pizza => {
      const rowNum = pizza.rowNumber || 1;
      const rowKey = `row${rowNum <= 3 ? rowNum : 1}`;
      
      // Include quantity and special instructions if available
      let pizzaText = `${pizza.quantity || 1}x ${pizza.pizzaType}`;
      if (pizza.specialInstructions || pizza.notes) {
        pizzaText += ` (${pizza.specialInstructions || pizza.notes})`;
      }
      
      rows[rowKey].push(pizzaText);
    });
    
    return {
      row1: rows.row1.join(' • '),
      row2: rows.row2.join(' • '),
      row3: rows.row3.join(' • ')
    };
  };

  // Handle marking order as completed - now updates Firebase directly
  const handleCompletedToggle = async (orderId) => {
    const order = sortedOrders.find(o => (o.id === orderId || o.orderId === orderId));
    if (!order) return;
    
    const newCompletedStatus = !(order.completed || false);
    const newStatus = newCompletedStatus ? 'delivered' : 'pending';
    
    try {
      console.log(`Updating order ${orderId} status to ${newStatus} in Firebase`);
      
      // Create an array with all pizzas marked as cooked or not cooked
      const numPizzas = order.pizzas?.length || 0;
      const cookedArray = Array(numPizzas).fill(newCompletedStatus);
      
      // Update directly in Firebase - no localStorage or events needed
      await updateOrder(orderId, {
        status: newStatus,
        cooked: cookedArray,
        completed: newCompletedStatus,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`Order ${orderId} updated successfully in Firebase`);
      
      // Only call the parent handler if it exists
      if (typeof onStatusChange === 'function') {
        onStatusChange(orderId, newStatus);
      }
      
      // No need to update local state as Firebase will trigger a real-time update
    } catch (error) {
      console.error(`Error updating order ${orderId} in Firebase:`, error);
      alert('Error updating order. Please try again.');
    }
  };

  // Get status color class
  const getStatusColorClass = (timeStatus, completed) => {
    if (completed) return 'bg-gray-100 text-gray-500';
    
    switch (timeStatus) {
      case 'Very Late':
        return 'bg-red-100 text-red-800';
      case 'Late':
        return 'bg-orange-100 text-orange-800';
      case 'On Time':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 shadow-md rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
            <th className="px-4 py-3 border-b">Timestamp</th>
            <th className="px-4 py-3 border-b">Platform</th>
            <th className="px-4 py-3 border-b">Pizzas [Row 1]</th>
            <th className="px-4 py-3 border-b">Pizzas [Row 2]</th>
            <th className="px-4 py-3 border-b">Pizzas [Row 3]</th>
            <th className="px-4 py-3 border-b">Extra Toppings</th>
            <th className="px-4 py-3 border-b">Preparation time</th>
            <th className="px-4 py-3 border-b">Due time</th>
            <th className="px-4 py-3 border-b">Status</th>
            <th className="px-4 py-3 border-b">Completed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedOrders.map((order) => {
            const pizzasByRow = formatPizzasByRow(order);
            const isCompleted = order.status === 'delivered' || order.status === 'ready' || order.completed;
            const statusClass = getStatusColorClass(order.timeStatus, isCompleted);
            
            return (
              <tr 
                key={order.id || order.orderId} 
                className={`${isCompleted ? 'bg-gray-50' : 'hover:bg-gray-50'} ${order.timeStatus === 'Very Late' ? 'bg-red-50' : order.timeStatus === 'Late' ? 'bg-orange-50' : ''}`}
              >
                <td className="px-4 py-3 text-sm">{order.orderTimeFormatted}</td>
                <td className="px-4 py-3 text-sm font-medium">{order.platform || 'Walk-in'}</td>
                <td className="px-4 py-3 text-sm">{pizzasByRow.row1}</td>
                <td className="px-4 py-3 text-sm">{pizzasByRow.row2}</td>
                <td className="px-4 py-3 text-sm">{pizzasByRow.row3}</td>
                <td className="px-4 py-3 text-sm">{order.customerName ? `${order.customerName} ${order.extraToppings ? `(${order.extraToppings})` : ''}` : order.extraToppings || ''}</td>
                <td className="px-4 py-3 text-sm">{order.prepTime || ''}</td>
                <td className="px-4 py-3 text-sm font-medium">{order.dueTimeFormatted}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}`}>
                    {isCompleted ? 'Completed' : order.timeStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={order.status === 'delivered' || order.status === 'ready' || order.completed || false}
                      onChange={() => handleCompletedToggle(order.id || order.orderId)}
                      className="form-checkbox h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                  </label>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">Loading orders from Firebase...</p>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700"></div>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white rounded-lg shadow border border-red-200">
          <p className="text-red-500 text-lg">Error loading orders</p>
          <p className="text-gray-500 text-sm mt-2">{error.message}</p>
        </div>
      ) : sortedOrders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">No active orders</p>
          <p className="text-gray-400 text-sm mt-2">New orders will appear here automatically</p>
        </div>
      )}
    </div>
  );
};

export default TableKitchenDisplay;
