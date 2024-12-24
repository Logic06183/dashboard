import React, { useMemo } from 'react';
import OrderManagement from '../OrderManagement';

const OrdersPage = ({ orders, setOrders }) => {
  // Sort orders by urgency (due time) and filter out completed orders
  const sortedOrders = useMemo(() => {
    const activeOrders = orders.filter(order => order.status !== 'delivered');
    return activeOrders.sort((a, b) => {
      const timeA = new Date(a.dueTime);
      const timeB = new Date(b.dueTime);
      return timeA - timeB;
    });
  }, [orders]);

  // Group orders by priority
  const groupedOrders = useMemo(() => {
    const groups = {
      urgent: [],
      normal: []
    };

    sortedOrders.forEach(order => {
      const minutesUntilDue = Math.floor((new Date(order.dueTime) - new Date()) / (1000 * 60));
      if (minutesUntilDue <= 15) {
        groups.urgent.push(order);
      } else {
        groups.normal.push(order);
      }
    });

    return groups;
  }, [sortedOrders]);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold mb-6">Kitchen Display System</h2>
      
      {/* Urgent Orders */}
      {groupedOrders.urgent.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-red-600 mb-4">
            Urgent Orders ({groupedOrders.urgent.length})
          </h3>
          <OrderManagement 
            orders={groupedOrders.urgent} 
            onStatusChange={(orderId, newStatus) => {
              setOrders(prev => prev.map(order => 
                order.orderId === orderId 
                  ? {...order, status: newStatus} 
                  : order
              ));
            }} 
          />
        </div>
      )}

      {/* Normal Priority Orders */}
      {groupedOrders.normal.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-blue-600 mb-4">
            Normal Orders ({groupedOrders.normal.length})
          </h3>
          <OrderManagement 
            orders={groupedOrders.normal}
            onStatusChange={(orderId, newStatus) => {
              setOrders(prev => prev.map(order => 
                order.orderId === orderId 
                  ? {...order, status: newStatus} 
                  : order
              ));
            }} 
          />
        </div>
      )}

      {/* No Orders Message */}
      {sortedOrders.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          <p className="text-lg">No active orders at the moment</p>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;