// src/components/OrderManagement.js
import React from 'react';
import CountdownTimer from './CountdownTimer';

const OrderManagement = ({ orders = [], onStatusChange }) => {
  const statusOptions = ['pending', 'preparing', 'in-oven', 'ready', 'delivered'];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-primary-dark';
      case 'preparing':
        return 'text-blue-500';
      case 'in-oven':
        return 'text-orange-500';
      case 'ready':
        return 'text-green-500';
      case 'delivered':
        return 'text-gray-500';
      default:
        return 'text-gray-700';
    }
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-secondary rounded-xl shadow-lg p-6 border border-secondary-light">
        <h2 className="text-lg font-semibold text-primary">Active Orders</h2>
        <p className="text-gray-400 mt-4">No active orders at the moment.</p>
      </div>
    );
  }

  const renderOrderItems = (items) => {
    if (!items || !Array.isArray(items)) return 'No items';
    
    return items.map((item, index) => (
      <div key={index} className="mb-2 last:mb-0">
        <p className="text-primary font-medium">
          {item.quantity}x {item.pizzaType}
        </p>
        <p className="text-gray-400 text-sm">Size: {item.size}</p>
        {item.extraToppings && item.extraToppings.length > 0 && (
          <p className="text-gray-500 text-xs mt-1">
            Extra: {item.extraToppings.join(', ')}
          </p>
        )}
      </div>
    ));
  };

  return (
    <div className="bg-secondary rounded-xl shadow-lg border border-secondary-light">
      <div className="p-4 border-b border-secondary-light">
        <h2 className="text-lg font-semibold text-primary">Active Orders</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary-light">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-primary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-light">
            {orders.map((order) => (
              <tr key={order.orderId} className="order-item hover:bg-secondary-light transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {new Date(order.orderTime).toLocaleTimeString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="text-primary font-mono">{order.orderId}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div>
                    <p className="font-medium text-primary">{order.customerName}</p>
                    <p className="text-gray-400">{order.phone}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="space-y-3">
                    {renderOrderItems(order.items)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={order.status}
                    onChange={(e) => onStatusChange(order.orderId, e.target.value)}
                    className={`rounded-md bg-secondary-light border-secondary text-sm ${getStatusColor(order.status)} focus:ring-primary focus:border-primary`}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status} className="bg-secondary">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-y-3">
                  <button className="text-primary hover:text-primary-light transition-colors block w-full text-left">
                    View Details
                  </button>
                  <div className="text-primary-dark">
                    <CountdownTimer dueTime={order.dueTime} />
                  </div>
                  <button
                    onClick={() => onStatusChange(order.orderId, 'made')}
                    className="bg-primary text-secondary-dark px-4 py-2 rounded-md hover:bg-primary-dark transition-colors block w-full font-medium"
                  >
                    Mark as Made
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderManagement;