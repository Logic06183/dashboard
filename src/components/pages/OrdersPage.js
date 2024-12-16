import React from 'react';
import OrderManagement from '../OrderManagement';

const OrdersPage = ({ orders, setOrders }) => {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-6">All Orders</h2>
      <OrderManagement 
        orders={orders} 
        onStatusChange={(orderId, newStatus) => {
          setOrders(prev => prev.map(order => 
            order.orderId === orderId 
              ? {...order, status: newStatus} 
              : order
          ));
        }} 
      />
    </div>
  );
};

export default OrdersPage;