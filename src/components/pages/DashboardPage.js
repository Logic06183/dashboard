import React from 'react';
import StatsCard from '../StatsCard';
import OrderManagement from '../OrderManagement';
import CustomerTracking from '../CustomerTracking';
import OrderForm from '../OrderForm';

const DashboardPage = ({ orders, setOrders, showOrderForm, setShowOrderForm, handleNewOrder }) => {
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
        </>
      )}
    </main>
  );
};

export default DashboardPage;