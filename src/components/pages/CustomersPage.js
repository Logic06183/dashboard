import React from 'react';

const CustomersPage = ({ orders }) => {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-6">Customers</h2>
      <div className="bg-white rounded-xl shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Orders</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Array.from(new Set(orders.map(order => order.customerName))).map(customerName => {
              const customerOrders = orders.filter(order => order.customerName === customerName);
              const lastOrder = customerOrders[0];
              return (
                <tr key={customerName}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{customerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{lastOrder.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{customerOrders.length}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(lastOrder.orderTime).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomersPage;