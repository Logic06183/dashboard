import React, { useState, useEffect } from 'react';
import { MdEdit, MdCheck, MdClose, MdInfo, MdAccessTime, MdOutlineWarning } from 'react-icons/md';
import ApiService from '../services/ApiService';

const PIZZA_MENU = {
  'The Champ Pizza': { price: 179 },
  'Pig in Paradise': { price: 169 },
  'Margie Pizza': { price: 149 },
  'Mushroom Cloud Pizza': { price: 174 },
  'Spud Pizza': { price: 149 },
  'Mish-Mash Pizza': { price: 192 },
  'Lekker\'izza': { price: 194 },
  'Sunshine Margherita': { price: 149 },
  'Vegan Harvest Pizza': { price: 189 },
  'Poppa\'s Pizza': { price: 179 },
  'The Zesty Zucchini': { price: 149 },
  'Chick Tick Boom': { price: 172 },
  'Artichoke & Ham': { price: 172 },
  'Jane\'s Dough': { price: 109 }
};

const OrderManagement = ({ orders, onStatusChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [editingPizza, setEditingPizza] = useState(null); // { orderId, pizzaIndex }
  const [editedPizzaDetails, setEditedPizzaDetails] = useState({
    pizzaType: '',
    quantity: 1,
    notes: ''
  });
  const [sortedOrders, setSortedOrders] = useState([]);
  // Add renderKey state for forcing re-renders
  const [renderKey, setRenderKey] = useState(0);
  
  // DISABLED: No automatic time updates to prevent auto-refreshes
  // This ensures checkbox states won't be reset
  useEffect(() => {
    console.log('Automatic time updates disabled to preserve checkbox states');
    // Set initial time but don't update automatically
    setCurrentTime(new Date());
    return () => {};
  }, []);
  
  // Sort and organize orders based on urgency and completion status
  useEffect(() => {
    if (!orders || !Array.isArray(orders)) return;
    
    // Create a deep copy to avoid mutation issues
    const ordersCopy = JSON.parse(JSON.stringify(orders));
    
    // Sort orders by urgency and completion status
    const sorted = ordersCopy.sort((a, b) => {
      // First separate completed and pending orders
      const aCompleted = isOrderCompleted(a);
      const bCompleted = isOrderCompleted(b);
      
      if (aCompleted && !bCompleted) return 1; // Move completed to bottom
      if (!aCompleted && bCompleted) return -1; // Move pending to top
      
      // For pending orders, sort by time urgency
      if (!aCompleted && !bCompleted) {
        // Calculate urgency level (negative means late)
        const aUrgency = getTimeUrgencyInMinutes(a);
        const bUrgency = getTimeUrgencyInMinutes(b);
        
        // Sort by urgency (most urgent/late first)
        return aUrgency - bUrgency;
      }
      
      // For completed orders, sort by completion time (most recent first)
      return 0; // Keep default order for completed items
    });
    
    setSortedOrders(sorted);
  }, [orders, currentTime]); // Re-sort when orders change or time updates
  
  // Calculate due time based on order time and prep time
  const calculateDueTime = (orderTime, prepTime) => {
    if (!orderTime) return null;
    const orderDate = new Date(orderTime);
    const dueDate = new Date(orderDate.getTime() + (prepTime || 15) * 60000);
    return dueDate;
  };
  
  // Check if an order is completely cooked/done
  const isOrderCompleted = (order) => {
    if (!order || !order.cooked || !Array.isArray(order.cooked) || !order.pizzas) return false;
    return order.cooked.every(status => status) && order.cooked.length === order.pizzas.length;
  };
  
  // Calculate time urgency in minutes (negative means late)
  const getTimeUrgencyInMinutes = (order) => {
    if (!order || !order.orderTime) return 0;
    
    const dueTime = order.dueTime ? new Date(order.dueTime) : calculateDueTime(order.orderTime, order.prepTime);
    if (!dueTime) return 0;
    
    // Calculate minutes remaining until due (negative if late)
    return Math.floor((dueTime - currentTime) / 60000);
  };
  
  // Get urgency level for an order
  const getUrgencyLevel = (order) => {
    if (isOrderCompleted(order)) return 'completed';
    
    const timeUrgency = getTimeUrgencyInMinutes(order);
    
    if (timeUrgency < 0) return 'late'; // Past due
    if (timeUrgency < 5) return 'critical'; // Less than 5 min
    if (timeUrgency < 10) return 'urgent'; // Less than 10 min
    if (timeUrgency < 20) return 'soon'; // Less than 20 min
    return 'normal';
  };
  
  // Get color class based on urgency level
  const getUrgencyColorClass = (order) => {
    const urgency = getUrgencyLevel(order);
    switch (urgency) {
      case 'late': return 'bg-red-100 border-l-4 border-red-600';
      case 'critical': return 'bg-orange-100 border-l-4 border-orange-600';
      case 'urgent': return 'bg-yellow-100 border-l-4 border-yellow-600';
      case 'soon': return 'bg-blue-50 border-l-4 border-blue-400';
      case 'completed': return 'bg-green-50 border-l-4 border-green-500 opacity-75';
      default: return 'bg-gray-50';
    }
  };
  
  // Get urgency indicator icon and text
  const getUrgencyIndicator = (order) => {
    const urgency = getUrgencyLevel(order);
    const timeMinutes = getTimeUrgencyInMinutes(order);
    
    let icon, text, color;
    
    switch (urgency) {
      case 'late':
        icon = <MdOutlineWarning className="text-red-600" />;
        text = `${Math.abs(timeMinutes)}m late`;
        color = 'text-red-600';
        break;
      case 'critical':
        icon = <MdAccessTime className="text-orange-600" />;
        text = `${timeMinutes}m left`;
        color = 'text-orange-600';
        break;
      case 'urgent':
        icon = <MdAccessTime className="text-yellow-600" />;
        text = `${timeMinutes}m left`;
        color = 'text-yellow-600';
        break;
      case 'soon':
        icon = <MdAccessTime className="text-blue-500" />;
        text = `${timeMinutes}m left`;
        color = 'text-blue-500';
        break;
      case 'completed':
        icon = <MdCheck className="text-green-600" />;
        text = 'Completed';
        color = 'text-green-600';
        break;
      default:
        icon = <MdAccessTime className="text-gray-500" />;
        text = `${timeMinutes}m left`;
        color = 'text-gray-500';
    }
    
    return { icon, text, color };
  };
  
  // Format time in South African format (24-hour)
  const formatSATime = (date) => {
    console.log('[OrderManagement.js] formatSATime received date:', date);
    if (!date) return 'No time';
    
    try {
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
  
  // Handle pizza cooked toggle - USING LOCAL STATE ONLY
  const handlePizzaCookedToggle = async (orderId, pizzaIndex) => {
    // Find the order by id or orderId (supporting both formats)
    const order = orders.find(o => (o.id === orderId || o.orderId === orderId));
    if (!order) return;

    // Create a deep copy of the order to avoid mutation issues
    const orderCopy = JSON.parse(JSON.stringify(order));
    
    // Initialize cooked array if it doesn't exist
    if (!orderCopy.cooked || !Array.isArray(orderCopy.cooked)) {
      orderCopy.cooked = Array(orderCopy.pizzas?.length || 0).fill(false);
    }
    
    // Toggle the status of the specific pizza
    orderCopy.cooked[pizzaIndex] = !orderCopy.cooked[pizzaIndex];

    // If all pizzas are cooked, mark order as ready
    const allCooked = orderCopy.cooked.every(status => status);
    orderCopy.status = allCooked ? 'ready' : 'pending';
    
    // SHORT-CIRCUIT: Work completely with local state
    // Create a copy of the orders array with our updated order
    const orderIndex = orders.findIndex(o => (o.id === orderId || o.orderId === orderId));
    if (orderIndex !== -1) {
      // Update the local sortedOrders state directly
      const newOrders = [...orders];
      newOrders[orderIndex] = orderCopy;
      
      // Update local state to force re-render
      setSortedOrders(prevSorted => {
        const updatedSorted = [...prevSorted];
        const sortedIndex = updatedSorted.findIndex(o => 
          (o.id === orderId || o.orderId === orderId)
        );
        if (sortedIndex !== -1) {
          updatedSorted[sortedIndex] = orderCopy;
        }
        return updatedSorted;
      });
      
      // IMPORTANT: Save to localStorage to persist through refreshes
      try {
        // Get existing saved states or initialize empty object
        const savedStates = localStorage.getItem('pizzaCooked') || '{}';
        const parsedStates = JSON.parse(savedStates);
        
        // Update with the new state for this order
        parsedStates[orderId] = {
          cooked: orderCopy.cooked,
          status: orderCopy.status,
          timestamp: Date.now()
        };
        
        // Save back to localStorage
        localStorage.setItem('pizzaCooked', JSON.stringify(parsedStates));
        console.log('Saved pizza state to localStorage:', parsedStates);
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
      
      // Dispatch a custom event so other components know something changed
      setTimeout(() => {
        console.log('Dispatching local update event');
        const event = new CustomEvent('order-status-updated', { 
          detail: { orderId, status: orderCopy.status, cooked: orderCopy.cooked }
        });
        window.dispatchEvent(event);
      }, 0);
      
      // Mark this order as having local changes to prevent auto-refresh from overwriting
      orderCopy._hasLocalChanges = true;
      
      // Now we're done - all handled locally
      return;
    }
    
    // Only if we couldn't find the order locally, try using the API
    try {
      // Save the updated pizza status to the database
      const result = await ApiService.updatePizzaStatus(orderId, orderCopy.cooked, orderCopy.status);
      console.log('Pizza status updated successfully:', result);
      
      // Update the parent component
      if (typeof onStatusChange === 'function') {
        onStatusChange(orderId, { cooked: orderCopy.cooked, status: orderCopy.status });
      }
    } catch (error) {
      console.error('Error updating pizza status:', error);
      // Only show alert in production
      if (process.env.NODE_ENV === 'production') {
        alert('Could not update pizza status. Please try again.');
      }
    }
  };

  // Start editing a pizza
  const startEditingPizza = (orderId, pizzaIndex, pizza) => {
    setEditingPizza({ orderId, pizzaIndex });
    setEditedPizzaDetails({
      pizzaType: pizza.pizzaType,
      quantity: pizza.quantity || 1,
      notes: pizza.notes || ''
    });
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingPizza(null);
  };

  // Save edited pizza
  const saveEditedPizza = () => {
    if (!editingPizza) return;
    
    const { orderId, pizzaIndex } = editingPizza;
    const order = orders.find(o => (o.id === orderId || o.orderId === orderId));
    if (!order) return;

    // Create a deep copy of the order
    const orderCopy = JSON.parse(JSON.stringify(order));
    
    // Update the pizza with edited details
    if (orderCopy.pizzas && orderCopy.pizzas[pizzaIndex]) {
      const originalPizza = orderCopy.pizzas[pizzaIndex];
      
      // Get the price from the menu based on pizza type
      const price = PIZZA_MENU[editedPizzaDetails.pizzaType]?.price || originalPizza.price || 0;
      
      // Update the pizza details
      orderCopy.pizzas[pizzaIndex] = {
        ...originalPizza,
        pizzaType: editedPizzaDetails.pizzaType,
        quantity: editedPizzaDetails.quantity,
        notes: editedPizzaDetails.notes,
        price: price, // Set the base price
        totalPrice: price * editedPizzaDetails.quantity
      };
      
      // Recalculate the total order amount
      orderCopy.totalAmount = orderCopy.pizzas.reduce((total, pizza) => {
        return total + (pizza.totalPrice || pizza.price || 0);
      }, 0);
      
      // Update the order
      const orderIndex = orders.findIndex(o => (o.id === orderId || o.orderId === orderId));
      if (orderIndex !== -1) {
        const newOrders = [...orders];
        newOrders[orderIndex] = orderCopy;
        
        // Force update
        setTimeout(() => {
          const event = new CustomEvent('order-updated', { detail: { orders: newOrders } });
          window.dispatchEvent(event);
        }, 0);
      }
    }
    
    // Clear editing state
    setEditingPizza(null);
  };

  // Load persisted checkbox states from localStorage on component mount
  useEffect(() => {
    try {
      const savedStates = localStorage.getItem('pizzaCooked');
      if (savedStates) {
        const parsedStates = JSON.parse(savedStates);
        console.log('Loaded saved pizza states:', parsedStates);
        
        // Apply saved states to current orders if they exist
        if (orders && orders.length > 0) {
          const updatedOrders = orders.map(order => {
            const savedOrder = parsedStates[order.id || order.orderId];
            if (savedOrder && savedOrder.cooked) {
              return { ...order, cooked: savedOrder.cooked, status: savedOrder.status };
            }
            return order;
          });
          
          // Update the sortedOrders with our saved states
          setSortedOrders(updatedOrders);
        }
      }
    } catch (error) {
      console.error('Error loading saved pizza states:', error);
    }
  }, [orders.length]); // Only run when orders array length changes
  
  // On component mount, set up event listeners for real-time updates
  useEffect(() => {
    // Listen for order-updated events from other components
    const handleOrderUpdate = (event) => {
      if (event.detail && event.detail.orders) {
        console.log('Order update detected, refreshing view');
      }
    };
    
    // Listen for render events
    const handleForceRender = () => {
      setRenderKey(prev => prev + 1);
    };
    
    window.addEventListener('order-updated', handleOrderUpdate);
    window.addEventListener('force-render', handleForceRender);
    
    return () => {
      window.removeEventListener('order-updated', handleOrderUpdate);
      window.removeEventListener('force-render', handleForceRender);
    };
  }, []);

  return (
    <div className="space-y-4">
      {sortedOrders.map((order) => {
        // Initialize cooked array if it doesn't exist
        if (!order.cooked && order.pizzas) {
          order.cooked = Array(order.pizzas.length).fill(false);
        }
        
        // Use id or orderId (supporting both formats)
        const orderId = order.id || order.orderId || Date.now();
        
        // Calculate due time
        const dueTime = calculateDueTime(order.orderTime, order.prepTime);
        
        // Calculate time status
        let timeStatus = 'On Time';
        if (dueTime) {
          const timeDiff = dueTime - currentTime;
          if (timeDiff < 0) {
            timeStatus = timeDiff < -10 * 60000 ? 'Very Late' : 'Late';
          }
        }
        
        // Get status color
        const getStatusColor = () => {
          if (order.status === 'ready' || order.status === 'delivered') {
            return 'text-green-500';
          }
          switch (timeStatus) {
            case 'Very Late': return 'text-red-600';
            case 'Late': return 'text-orange-500';
            default: return 'text-yellow-500';
          }
        };
        
        // Calculate total amount if not present
        const calculateTotal = () => {
          if (order.totalAmount) return order.totalAmount;
          if (!order.pizzas) return 0;
          return order.pizzas.reduce((total, pizza) => {
            return total + (pizza.totalPrice || pizza.price || 0);
          }, 0);
        };
        
        // Get urgency indicator
        const urgencyIndicator = getUrgencyIndicator(order);
        const urgencyColorClass = getUrgencyColorClass(order);
        const isCompleted = isOrderCompleted(order);
        
        return (
          <div key={orderId} className={`rounded-lg shadow p-4 transition-all duration-300 ${urgencyColorClass}`}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">
                    {order.customerName ? order.customerName : `Order #${orderId.toString().slice(-8)}`}
                  </h3>
                  <div className={`flex items-center gap-1 ${urgencyIndicator.color} text-sm font-medium`}>
                    {urgencyIndicator.icon}
                    <span>{urgencyIndicator.text}</span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm flex items-center gap-1">
                  Ordered: {formatSATime(new Date(order.orderTime))} 
                  {order.platform && <span className="ml-2 px-2 py-0.5 bg-gray-200 rounded-full text-xs">{order.platform}</span>}
                  {!order.customerName && <span className="ml-2 text-xs text-gray-500">#{orderId.toString().slice(-8)}</span>}
                  {dueTime && (
                    <span className="ml-2 font-medium">
                      Due: <span className={urgencyIndicator.color}>{formatSATime(dueTime)}</span>
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">Total: R{calculateTotal().toFixed(2)}</p>
                <div className="flex items-center justify-end space-x-2">
                  <button 
                    onClick={() => {
                      // Mark all pizzas as cooked or uncooked
                      const allDone = isOrderCompleted(order);
                      const newStatus = allDone ? 'pending' : 'ready';
                      const orderCopy = JSON.parse(JSON.stringify(order));
                      
                      // Update all items' cooked status
                      if (orderCopy.cooked && orderCopy.pizzas) {
                        orderCopy.cooked = orderCopy.pizzas.map(() => !allDone);
                      }
                      
                      // Send update
                      onStatusChange(orderId, newStatus);
                    }}
                    className={`px-2 py-1 rounded text-xs font-medium ${isCompleted ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                  >
                    {isCompleted ? 'Mark Incomplete' : 'Mark All Complete'}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {(order.pizzas || []).map((pizza, index) => {
                const isEditing = editingPizza && 
                  editingPizza.orderId === orderId && 
                  editingPizza.pizzaIndex === index;
                
                // If the pizza is being edited, show edit form
                if (isEditing) {
                  return (
                    <div key={`editing-${index}`} className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="flex justify-between mb-2">
                        <div className="font-medium text-blue-800">Editing Pizza</div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={saveEditedPizza}
                            className="p-1 bg-green-500 text-white rounded-full hover:bg-green-600"
                            title="Save changes"
                          >
                            <MdCheck size={16} />
                          </button>
                          <button 
                            onClick={cancelEditing}
                            className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            title="Cancel editing"
                          >
                            <MdClose size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Pizza Type</label>
                          <select
                            value={editedPizzaDetails.pizzaType}
                            onChange={(e) => setEditedPizzaDetails({...editedPizzaDetails, pizzaType: e.target.value})}
                            className="w-full p-1 text-sm rounded border border-gray-300"
                          >
                            <option value="The Champ Pizza">The Champ Pizza</option>
                            <option value="Pig in Paradise">Pig in Paradise</option>
                            <option value="Margie Pizza">Margie Pizza</option>
                            <option value="Mushroom Cloud Pizza">Mushroom Cloud Pizza</option>
                            <option value="Spud Pizza">Spud Pizza</option>
                            <option value="Mish-Mash Pizza">Mish-Mash Pizza</option>
                            <option value="Lekker'izza">Lekker'izza</option>
                            <option value="Sunshine Margherita">Sunshine Margherita</option>
                            <option value="Vegan Harvest Pizza">Vegan Harvest Pizza</option>
                            <option value="Poppa's Pizza">Poppa's Pizza</option>
                            <option value="The Zesty Zucchini">The Zesty Zucchini</option>
                            <option value="Chick Tick Boom">Chick Tick Boom</option>
                            <option value="Artichoke & Ham">Artichoke & Ham</option>
                            <option value="Jane's Dough">Jane's Dough</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={editedPizzaDetails.quantity}
                            onChange={(e) => setEditedPizzaDetails({...editedPizzaDetails, quantity: parseInt(e.target.value) || 1})}
                            className="w-full p-1 text-sm rounded border border-gray-300"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Special Instructions</label>
                        <textarea
                          value={editedPizzaDetails.notes}
                          onChange={(e) => setEditedPizzaDetails({...editedPizzaDetails, notes: e.target.value})}
                          className="w-full p-1 text-sm rounded border border-gray-300"
                          rows="2"
                          placeholder="Any special requests or notes"
                        />
                      </div>
                    </div>
                  );
                }
                
                // Regular display mode
                return (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={order.cooked && order.cooked[index] || false}
                        onChange={() => handlePizzaCookedToggle(orderId, index)}
                        className="h-4 w-4 text-blue-600 cursor-pointer"
                      />
                      <span className={order.cooked && order.cooked[index] ? 'line-through text-gray-400' : ''}>
                        {pizza.quantity || 1}x {pizza.pizzaType}
                        {pizza.rowNumber && <span className="ml-1 text-xs text-gray-500">[Row {pizza.rowNumber}]</span>}
                        {pizza.notes && <MdInfo className="inline-block ml-1 text-blue-500" title={pizza.notes} />}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">
                        R{(pizza.totalPrice || pizza.price || 0).toFixed(2)}
                      </span>
                      <button 
                        onClick={() => startEditingPizza(orderId, index, pizza)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Edit this pizza"
                      >
                        <MdEdit size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {order.extraToppings && (
                <div className="mt-2 text-sm text-gray-600 italic p-2 bg-gray-50 rounded">
                  <span className="font-medium">Special instructions:</span> {order.extraToppings}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderManagement;