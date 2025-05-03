import React, { useState, useEffect } from 'react';

const OrderManagement = ({ orders, onStatusChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);
  
  // Calculate due time based on order time and prep time
  const calculateDueTime = (orderTime, prepTime) => {
    if (!orderTime) return null;
    const orderDate = new Date(orderTime);
    const dueDate = new Date(orderDate.getTime() + (prepTime || 15) * 60000);
    return dueDate;
  };
  
  // Format time in South African format (24-hour)
  const formatSATime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };
  
  const handlePizzaCookedToggle = (orderId, pizzaIndex) => {
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
    
    // Update the order with the new cooked status - use a direct approach
    onStatusChange(orderId, orderCopy);
    
    // Force a re-render by updating the component state
    const orderIndex = orders.findIndex(o => (o.id === orderId || o.orderId === orderId));
    if (orderIndex !== -1) {
      const newOrders = [...orders];
      newOrders[orderIndex] = orderCopy;
      // This is a hack to force a re-render
      setTimeout(() => {
        const event = new CustomEvent('order-updated', { detail: { orders: newOrders } });
        window.dispatchEvent(event);
      }, 0);
    }
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => {
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
        
        return (
          <div key={orderId} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {order.customerName ? order.customerName : `Order #${orderId.toString().slice(-8)}`}
                </h3>
                <p className="text-gray-500 text-sm">
                  {formatSATime(new Date(order.orderTime))} 
                  {order.platform && <span className="ml-2 px-2 py-0.5 bg-gray-200 rounded-full text-xs">{order.platform}</span>}
                  {!order.customerName && <span className="ml-2 text-xs text-gray-400">#{orderId.toString().slice(-8)}</span>}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">Total: R{calculateTotal().toFixed(2)}</p>
                <div className="flex items-center justify-end space-x-2">
                  <p className={`text-sm ${getStatusColor()}`}>
                    {order.status === 'ready' || order.status === 'delivered' ? 'Ready' : 'Cooking'}
                  </p>
                  {dueTime && (
                    <p className="text-sm font-medium">
                      Due: <span className={getStatusColor()}>{formatSATime(dueTime)}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {(order.pizzas || []).map((pizza, index) => (
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
                    </span>
                  </div>
                  <span className="text-gray-500">
                    R{(pizza.totalPrice || pizza.price || 0).toFixed(2)}
                  </span>
                </div>
              ))}
              
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