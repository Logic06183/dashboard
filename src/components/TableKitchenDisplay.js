import React, { useState, useEffect } from 'react';

const TableKitchenDisplay = ({ orders = [], onStatusChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sortedOrders, setSortedOrders] = useState([]);

  // DISABLED: No automatic time updates to prevent auto-refreshes
  useEffect(() => {
    console.log('Automatic time updates disabled in Table Kitchen Display');
    // Set initial time but don't update automatically
    setCurrentTime(new Date());
    return () => {};
  }, []);
  
  // Load persisted checkbox states from localStorage
  useEffect(() => {
    try {
      const savedStates = localStorage.getItem('pizzaCooked');
      if (savedStates) {
        const parsedStates = JSON.parse(savedStates);
        console.log('Kitchen: Loaded saved pizza states:', parsedStates);
        
        // Apply saved states to current orders
        if (orders && orders.length > 0) {
          const updatedOrders = orders.map(order => {
            const savedOrder = parsedStates[order.id || order.orderId];
            if (savedOrder) {
              return { 
                ...order, 
                completed: savedOrder.status === 'delivered' || savedOrder.status === 'ready',
                status: savedOrder.status
              };
            }
            return order;
          });
          
          // Update the sortedOrders with our saved states
          setSortedOrders(updatedOrders);
        }
      }
    } catch (error) {
      console.error('Error loading saved pizza states in kitchen view:', error);
    }
  }, [orders.length]);

  // Sort and process orders
  useEffect(() => {
    if (!Array.isArray(orders)) return;
    
    // First, check if there are any saved states in localStorage
    let ordersWithSavedState = [...orders];
    try {
      const savedStates = localStorage.getItem('pizzaCooked');
      if (savedStates) {
        const parsedStates = JSON.parse(savedStates);
        
        // Apply saved states to orders first before processing
        ordersWithSavedState = orders.map(order => {
          const orderId = order.id || order.orderId;
          const savedOrder = parsedStates[orderId];
          
          if (savedOrder) {
            return {
              ...order,
              status: savedOrder.status,
              cooked: savedOrder.cooked,
              completed: savedOrder.status === 'delivered' || savedOrder.status === 'ready'
            };
          }
          return order;
        });
      }
    } catch (error) {
      console.error('Error applying saved states in kitchen view:', error);
    }
    
    // Process orders: calculate due times and statuses
    const processedOrders = ordersWithSavedState.map(order => {
      const orderTime = new Date(order.orderTime);
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
  }, [orders, currentTime]);
  
  // Listen for updates from other components (like the dashboard)
  useEffect(() => {
    // Handler for order updates from other components
    const handleOrderUpdate = (event) => {
      if (event.detail) {
        console.log('Kitchen detected order update event:', event.detail);
        
        // Load latest state from localStorage
        try {
          const savedStates = localStorage.getItem('pizzaCooked');
          if (savedStates) {
            const parsedStates = JSON.parse(savedStates);
            
            // Update any matching orders in our current state
            setSortedOrders(prev => 
              prev.map(order => {
                const orderId = order.id || order.orderId;
                const savedOrder = parsedStates[orderId];
                
                if (savedOrder) {
                  return {
                    ...order,
                    status: savedOrder.status,
                    completed: savedOrder.status === 'delivered' || savedOrder.status === 'ready',
                    cooked: savedOrder.cooked
                  };
                }
                return order;
              })
            );
          }
        } catch (error) {
          console.error('Error handling kitchen order update:', error);
        }
      }
    };
    
    // Set up event listeners for cross-component communication
    window.addEventListener('order-status-updated', handleOrderUpdate);
    window.addEventListener('order-updated', handleOrderUpdate);
    window.addEventListener('force-render', handleOrderUpdate);
    
    // Clean up listeners on unmount
    return () => {
      window.removeEventListener('order-status-updated', handleOrderUpdate);
      window.removeEventListener('order-updated', handleOrderUpdate);
      window.removeEventListener('force-render', handleOrderUpdate);
    };
  }, []);

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

  // Handle marking order as completed
  const handleCompletedToggle = (orderId) => {
    const order = sortedOrders.find(o => (o.id === orderId || o.orderId === orderId));
    if (!order) return;
    
    const newCompletedStatus = !(order.completed || false);
    const newStatus = newCompletedStatus ? 'delivered' : 'pending';
    
    try {
      // IMPORTANT: Save state to localStorage for persistence
      // This matches the same format used in OrderManagement.js
      const savedStates = localStorage.getItem('pizzaCooked') || '{}';
      const parsedStates = JSON.parse(savedStates);
      
      // Create a mock cooked array that matches what OrderManagement uses
      const numPizzas = order.pizzas?.length || 0;
      const cookedArray = Array(numPizzas).fill(newCompletedStatus);
      
      // Update localStorage with the new state
      parsedStates[orderId] = {
        cooked: cookedArray,
        status: newStatus,
        timestamp: Date.now(),
        completed: newCompletedStatus
      };
      
      localStorage.setItem('pizzaCooked', JSON.stringify(parsedStates));
      console.log('Kitchen: Saved order state to localStorage:', parsedStates[orderId]);
      
      // IMPORTANT: Dispatch events to notify other components of the change
      const orderEvent = new CustomEvent('order-status-updated', {
        detail: {
          orderId,
          status: newStatus,
          cooked: cookedArray,
          completed: newCompletedStatus,
          source: 'kitchen-view'
        }
      });
      window.dispatchEvent(orderEvent);
      
      // Also dispatch a force-render event to ensure all components update
      setTimeout(() => {
        const renderEvent = new CustomEvent('force-render', {
          detail: { timestamp: Date.now() }
        });
        window.dispatchEvent(renderEvent);
      }, 50);
    } catch (error) {
      console.error('Error saving kitchen state to localStorage:', error);
    }
    
    // Only call the parent handler if it exists
    if (typeof onStatusChange === 'function') {
      onStatusChange(orderId, newStatus);
    }
    
    // Always update the local state for immediate UI feedback
    setSortedOrders(prev => 
      prev.map(o => 
        (o.id === orderId || o.orderId === orderId) 
          ? { ...o, completed: newCompletedStatus, status: newStatus } 
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
