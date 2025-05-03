import React, { useState, useEffect } from 'react';

const TableKitchenDisplay = ({ orders = [], onStatusChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sortedOrders, setSortedOrders] = useState([]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sort and process orders
  useEffect(() => {
    if (!orders || !Array.isArray(orders)) return;

    // Filter active orders (not delivered)
    const activeOrders = orders.filter(order => 
      order.status !== 'delivered'
    );
    
    // Calculate due time for each order
    const processedOrders = activeOrders.map(order => {
      const orderTime = new Date(order.orderTime);
      const prepTimeMinutes = order.prepTime || 15;
      const dueTime = new Date(orderTime.getTime() + prepTimeMinutes * 60000);
      
      // Calculate if order is on time, late, or very late
      const timeDiff = dueTime - currentTime;
      let timeStatus = 'On Time';
      if (timeDiff < 0) {
        timeStatus = timeDiff < -10 * 60000 ? 'Very Late' : 'Late';
      }
      
      return {
        ...order,
        dueTime,
        dueTimeFormatted: dueTime.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false }),
        timeStatus,
        orderTimeFormatted: orderTime.toLocaleString('en-ZA', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
      };
    });
    
    // Sort by urgency (incomplete orders first, then by due time)
    const sorted = processedOrders.sort((a, b) => {
      // First sort by completion status
      if ((a.completed || false) !== (b.completed || false)) {
        return (a.completed || false) ? 1 : -1;
      }
      
      // Then sort by time status severity
      const statusPriority = {
        'Very Late': 0,
        'Late': 1,
        'On Time': 2,
        'Completed': 3
      };
      
      const aStatus = statusPriority[a.timeStatus] || 2;
      const bStatus = statusPriority[b.timeStatus] || 2;
      
      if (aStatus !== bStatus) {
        return aStatus - bStatus;
      }
      
      // Finally sort by due time
      return a.dueTime - b.dueTime;
    });
    
    setSortedOrders(sorted);
  }, [orders, currentTime]);

  // Format pizzas by row
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
      rows[rowKey].push(`${pizza.pizzaType}`);
    });
    
    return {
      row1: rows.row1.join(', '),
      row2: rows.row2.join(', '),
      row3: rows.row3.join(', ')
    };
  };

  // Handle marking order as completed
  const handleCompletedToggle = (orderId) => {
    const order = sortedOrders.find(o => (o.id === orderId || o.orderId === orderId));
    if (!order) return;
    
    const newCompletedStatus = !(order.completed || false);
    onStatusChange(orderId, newCompletedStatus ? 'delivered' : 'pending');
    
    // Also update the local state for immediate UI feedback
    setSortedOrders(prev => 
      prev.map(o => 
        (o.id === orderId || o.orderId === orderId) 
          ? { ...o, completed: newCompletedStatus, status: newCompletedStatus ? 'delivered' : 'pending' } 
          : o
      )
    );
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
            const statusClass = getStatusColorClass(order.timeStatus, order.completed);
            
            return (
              <tr 
                key={order.id || order.orderId} 
                className={`${order.completed ? 'bg-gray-50' : 'hover:bg-gray-50'} ${order.timeStatus === 'Very Late' ? 'bg-red-50' : order.timeStatus === 'Late' ? 'bg-orange-50' : ''}`}
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
                    {order.completed ? 'Completed' : order.timeStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={order.completed || false}
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
      
      {sortedOrders.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">No active orders</p>
          <p className="text-gray-400 text-sm mt-2">New orders will appear here automatically</p>
        </div>
      )}
    </div>
  );
};

export default TableKitchenDisplay;
