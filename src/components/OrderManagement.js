// src/components/OrderManagement.js
import React from 'react';

const OrderManagement = ({ orders = [], onStatusChange }) => {  // Add default empty array
  const statusOptions = ['pending', 'preparing', 'in-oven', 'ready', 'delivered'];

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold">Active Orders</h2>
        <p className="text-gray-500 mt-4">No active orders at the moment.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm order-management">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Active Orders</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.orderId} className="order-item">
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {new Date(order.orderTime).toLocaleTimeString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">#{order.orderId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-gray-500">{order.phone}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div>
                    <p>{order.pizzaType} ({order.size})</p>
                    {order.extraToppings && order.extraToppings.length > 0 && (
                      <p className="text-gray-500 text-xs">
                        Extra: {order.extraToppings.join(', ')}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={order.status}
                    onChange={(e) => onStatusChange(order.orderId, e.target.value)}
                    className="rounded-md border-gray-300 text-sm"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button className="text-blue-600 hover:text-blue-800">
                    View Details
                  </button>
                  <CountdownTimer dueTime={order.dueTime} />
                  <button
                    onClick={() => onStatusChange(order.orderId, 'made')}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
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