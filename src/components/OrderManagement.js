import React from 'react';

const OrderManagement = ({ orders, onStatusChange }) => {
  const handlePizzaCookedToggle = (orderId, pizzaIndex) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const newCookedStatus = [...order.cooked];
    newCookedStatus[pizzaIndex] = !newCookedStatus[pizzaIndex];

    // If all pizzas are cooked, mark order as ready
    const allCooked = newCookedStatus.every(status => status);
    onStatusChange(orderId, {
      cooked: newCookedStatus,
      status: allCooked ? 'ready' : 'pending'
    });
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold">Order #{order.id}</h3>
              <p className="text-gray-500 text-sm">
                {new Date(order.orderTime).toLocaleTimeString()}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">Total: R{order.totalAmount}</p>
              <p className={`text-sm ${order.status === 'ready' ? 'text-green-500' : 'text-yellow-500'}`}>
                {order.status === 'ready' ? 'Ready' : 'Cooking'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {order.pizzas.map((pizza, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={order.cooked[index]}
                    onChange={() => handlePizzaCookedToggle(order.id, index)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <span className={order.cooked[index] ? 'line-through text-gray-400' : ''}>
                    {pizza.quantity}x {pizza.pizzaType}
                  </span>
                </div>
                <span className="text-gray-500">
                  R{pizza.totalPrice}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderManagement;