import React, { useState, useEffect } from 'react';
import StatsCard from '../StatsCard';
import OrderManagement from '../OrderManagement';
import CustomerTracking from '../CustomerTracking';
import OrderForm from '../OrderForm';
import CountdownTimer from '../CountdownTimer';

const DashboardPage = ({ orders, setOrders, showOrderForm, setShowOrderForm, handleNewOrder }) => {
  const [sortedOrders, setSortedOrders] = useState([]);

  useEffect(() => {
    const sorted = [...orders].sort((a, b) => new Date(a.dueTime) - new Date(b.dueTime));
    setSortedOrders(sorted);
  }, [orders]);

  const getTotalSales = () => {
    const prices = {
      'Mish-Mash Pizza': 192.00,
      'Pig in Paradise Pizza': 169.00,
      'Margie Pizza': 149.00,
      'The Champ Pizza': 179.00,
      'Vegan Harvest Pizza': 189.00
    };

    return orders.reduce((total, order) => {
      const basePrice = prices[order.pizzaType] || 0;
      const extraToppingsPrice = order.extraToppings?.length * 15 || 0;
      const sizeAdjustment = 
        order.size === 'small' ? -20 :
        order.size === 'large' ? 30 : 0;
      
      return total + basePrice + extraToppingsPrice + sizeAdjustment;
    }, 0).toFixed(2);
  };

  const getTimeStatus = (dueTime) => {
    const now = new Date();
    const due = new Date(dueTime);
    const diffMinutes = (due - now) / (1000 * 60);

    if (diffMinutes < 0) return 'overdue';
    if (diffMinutes < 15) return 'urgent';
    if (diffMinutes < 30) return 'warning';
    return 'normal';
  };

  const getStatusColor = (status) => {
    const colors = {
      overdue: 'bg-red-100 border-red-500',
      urgent: 'bg-orange-100 border-orange-500',
      warning: 'bg-yellow-100 border-yellow-500',
      normal: 'bg-green-100 border-green-500'
    };
    return colors[status] || colors.normal;
  };

  return (
    <main className="p-8">
      {showOrderForm ? (
        <OrderForm onSubmit={handleNewOrder} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <StatsCard 
              title="Total Orders" 
              value={orders.length} 
              change={`+${orders.length}`} 
            />
            <StatsCard 
              title="Total Sales" 
              value={`R${getTotalSales()}`} 
            />
            <StatsCard 
              title="Pending Orders" 
              value={orders.filter(o => o.status === 'pending').length} 
            />
            <StatsCard 
              title="Average Order Value" 
              value={`R${orders.length ? (getTotalSales() / orders.length).toFixed(2) : '0'}`} 
            />
          </div>

          <div className="space-y-8">
            <OrderManagement 
              orders={orders} 
              onStatusChange={(orderId, newStatus) => {
                setOrders(orders.map(order => 
                  order.orderId === orderId 
                    ? {...order, status: newStatus} 
                    : order
                ));
              }} 
            />

            <CustomerTracking 
              orders={orders.filter(o => o.status !== 'delivered')} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedOrders.map(order => {
              const timeStatus = getTimeStatus(order.dueTime);
              return (
                <div 
                  key={order.orderId} 
                  className={`order-item p-4 rounded-lg border-l-4 shadow-sm transition-colors duration-300 ${getStatusColor(timeStatus)}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold">{order.customerName || 'No name'}</h3>
                    <span className="text-sm">
                      Order #{order.orderId ? order.orderId.slice(-4) : 'N/A'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600">{order.pizzaType || 'Unknown pizza'}</p>
                  <p className="text-sm text-gray-500">Size: {order.size || 'medium'}</p>
                  
                  {order.extraToppings && order.extraToppings.length > 0 && (
                    <p className="text-sm text-gray-500">
                      Extra: {order.extraToppings.join(', ')}
                    </p>
                  )}
                  
                  <div className="mt-3 border-t pt-2">
                    <CountdownTimer dueTime={order.dueTime} />
                  </div>

                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-sm">
                      Due: {order.dueTime ? new Date(order.dueTime).toLocaleTimeString() : 'No due time'}
                    </span>
                    <button
                      onClick={() => setOrders(orders.map(o => 
                        o.orderId === order.orderId 
                          ? {...o, status: 'made'} 
                          : o
                      ))}
                      className={`px-3 py-1 rounded-full text-sm ${
                        order.status === 'made' 
                          ? 'bg-gray-200 text-gray-600' 
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                      disabled={order.status === 'made'}
                    >
                      {order.status === 'made' ? 'Completed' : 'Mark as Made'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
};

export default DashboardPage;