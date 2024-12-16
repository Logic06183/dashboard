import React, { useState, useEffect } from 'react';
import StatsCard from '../StatsCard';
import OrderManagement from '../OrderManagement';
import CustomerTracking from '../CustomerTracking';
import OrderForm from '../OrderForm';
import CountdownTimer from '../CountdownTimer';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const DashboardPage = ({ orders, setOrders, showOrderForm, setShowOrderForm, handleNewOrder }) => {
  const [sortedOrders, setSortedOrders] = useState([]);
  const [analytics, setAnalytics] = useState({
    hourlyOrders: [],
    popularToppings: {},
    averageOrderTime: 0,
  });

  useEffect(() => {
    const sorted = [...orders].sort((a, b) => new Date(a.dueTime) - new Date(b.dueTime));
    setSortedOrders(sorted);
  }, [orders]);

  useEffect(() => {
    // Calculate hourly order distribution
    const hourlyData = Array(24).fill(0);
    orders.forEach(order => {
      const hour = new Date(order.orderTime).getHours();
      hourlyData[hour]++;
    });
    
    // Calculate popular toppings
    const toppingsCount = {};
    orders.forEach(order => {
      order.extraToppings?.forEach(topping => {
        toppingsCount[topping] = (toppingsCount[topping] || 0) + 1;
      });
    });

    // Calculate average order completion time
    const completedOrders = orders.filter(o => o.status === 'made');
    const avgTime = completedOrders.reduce((acc, order) => {
      const orderTime = new Date(order.orderTime);
      const dueTime = new Date(order.dueTime);
      return acc + (dueTime - orderTime);
    }, 0) / (completedOrders.length || 1);

    setAnalytics({
      hourlyOrders: hourlyData.map((count, hour) => ({ hour, count })),
      popularToppings: toppingsCount,
      averageOrderTime: avgTime / (1000 * 60), // Convert to minutes
    });
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
            <StatsCard 
              title="Avg Completion Time" 
              value={`${Math.round(analytics.averageOrderTime)} min`} 
            />
          </div>

          {/* Add Order Timeline */}
          <div className="mb-8 bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Order Timeline</h3>
            <div className="relative h-16">
              {sortedOrders.map((order, index) => {
                const timeStatus = getTimeStatus(order.dueTime);
                const position = `${(index / sortedOrders.length) * 100}%`;
                return (
                  <div
                    key={order.orderId}
                    className={`absolute w-4 h-4 rounded-full transform -translate-x-2 cursor-pointer
                      ${timeStatus === 'overdue' ? 'bg-red-500' :
                        timeStatus === 'urgent' ? 'bg-orange-500' :
                        timeStatus === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ left: position, top: '50%' }}
                    title={`${order.customerName} - Due: ${new Date(order.dueTime).toLocaleTimeString()}`}
                  />
                );
              })}
              <div className="absolute w-full h-1 bg-gray-200 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>

          {/* Add Analytics Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Hourly Order Distribution</h3>
              <LineChart width={500} height={300} data={analytics.hourlyOrders}>
                <XAxis dataKey="hour" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" />
              </LineChart>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Popular Extra Toppings</h3>
              <div className="space-y-2">
                {Object.entries(analytics.popularToppings)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([topping, count]) => (
                    <div key={topping} className="flex items-center">
                      <div className="flex-1">{topping}</div>
                      <div className="ml-2 font-semibold">{count} orders</div>
                      <div className="ml-2 w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${(count / Math.max(...Object.values(analytics.popularToppings))) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
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