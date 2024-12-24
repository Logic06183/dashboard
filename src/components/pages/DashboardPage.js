import React, { useState, useEffect } from 'react';
import StatsCard from '../StatsCard';
import OrderManagement from '../OrderManagement';
import CustomerTracking from '../CustomerTracking';
import OrderForm from '../OrderForm';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const DashboardPage = ({ orders, setOrders, showOrderForm, setShowOrderForm, handleNewOrder }) => {
  const [sortedOrders, setSortedOrders] = useState([]);
  const [analytics, setAnalytics] = useState({
    hourlyOrders: [],
    popularToppings: {},
    averageOrderTime: 0,
    dailyStats: {
      totalOrders: 0,
      totalSales: 0,
      pendingOrders: 0,
      avgOrderValue: 0,
      avgCompletionTime: 0,
      orderChange: 0
    }
  });

  // Calculate average completion time for orders
  const calculateAverageCompletionTime = (orders) => {
    const completedOrders = orders.filter(order => order.status === 'delivered');
    if (completedOrders.length === 0) return 0;

    const totalTime = completedOrders.reduce((sum, order) => {
      const orderTime = new Date(order.orderTime);
      const deliveryTime = new Date(order.deliveryTime || order.completionTime);
      return sum + (deliveryTime - orderTime);
    }, 0);

    return Math.round(totalTime / (completedOrders.length * 60000)); // Convert to minutes
  };

  // Calculate order stats
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get today's orders
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.orderTime);
      return orderDate >= today;
    });

    // Get yesterday's orders
    const yesterdayOrders = orders.filter(order => {
      const orderDate = new Date(order.orderTime);
      return orderDate >= yesterday && orderDate < today;
    });

    // Calculate order change percentage
    const orderChange = yesterdayOrders.length > 0 
      ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length * 100).toFixed(1)
      : 100;

    // Calculate total sales
    const calculateOrderTotal = (order) => {
      try {
        if (!order.items || !Array.isArray(order.items)) {
          console.error('Invalid order items structure:', order);
          return 0;
        }

        const total = order.items.reduce((sum, item) => {
          if (!item.totalPrice) {
            console.error('Missing totalPrice for item:', item);
            return sum;
          }
          return sum + item.totalPrice;
        }, 0);

        return total;
      } catch (error) {
        console.error('Error calculating order total:', error);
        return 0;
      }
    };

    // Calculate daily stats
    const dailyStats = {
      totalOrders: todayOrders.length,
      totalSales: todayOrders.reduce((sum, order) => sum + calculateOrderTotal(order), 0),
      pendingOrders: todayOrders.filter(order => order.status === 'pending').length,
      avgOrderValue: todayOrders.length > 0 
        ? (todayOrders.reduce((sum, order) => sum + calculateOrderTotal(order), 0) / todayOrders.length).toFixed(2)
        : 0,
      avgCompletionTime: calculateAverageCompletionTime(todayOrders),
      orderChange: parseFloat(orderChange)
    };

    // Filter active orders (not ready or delivered)
    const activeOrders = todayOrders.filter(o => !['ready', 'delivered'].includes(o.status));
    
    setAnalytics(prev => ({
      ...prev,
      dailyStats
    }));
  }, [orders]);

  useEffect(() => {
    const sorted = [...orders].sort((a, b) => new Date(a.dueTime) - new Date(b.dueTime));
    setSortedOrders(sorted);

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

    setAnalytics(prev => ({
      ...prev,
      hourlyOrders: hourlyData.map((count, hour) => ({ hour, count })),
      popularToppings: toppingsCount
    }));
  }, [orders]);

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

  // Add handleStatusChange function
  const handleStatusChange = (orderId, newStatus) => {
    setOrders(orders.map(order => 
      order.orderId === orderId 
        ? { ...order, status: newStatus }
        : order
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-dark to-secondary">
      <header className="bg-secondary-dark shadow-lg border-b border-secondary-light">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12">
                <img src="/logo.png" alt="John Dough's" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">John Dough's Dashboard</h1>
                <p className="text-gray-400 text-sm">Sourdough Pizza Excellence</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowOrderForm(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-2 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                New Order
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-full bg-secondary rounded-xl shadow-lg p-6 border border-secondary-light backdrop-blur-lg bg-opacity-90"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-yellow-500 bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary">Today's Fresh Orders</h2>
                  <p className="text-gray-400">Crafting Sourdough Excellence</p>
                </div>
              </div>
              {analytics.dailyStats.orderChange > 0 && (
                <div className="bg-green-500 bg-opacity-10 px-4 py-2 rounded-full">
                  <span className="text-green-500 font-semibold">
                    +{analytics.dailyStats.orderChange}%
                  </span>
                </div>
              )}
            </div>
            <div className="mt-6 grid grid-cols-4 gap-6">
              <div className="bg-secondary-light rounded-lg p-4">
                <p className="text-4xl font-bold text-yellow-500">{analytics.dailyStats.totalOrders}</p>
                <p className="text-gray-400 mt-1">Total Orders</p>
              </div>
              <div className="bg-secondary-light rounded-lg p-4">
                <p className="text-4xl font-bold text-green-500">R{analytics.dailyStats.totalSales.toFixed(0)}</p>
                <p className="text-gray-400 mt-1">Revenue</p>
              </div>
              <div className="bg-secondary-light rounded-lg p-4">
                <p className="text-4xl font-bold text-blue-500">{analytics.dailyStats.pendingOrders}</p>
                <p className="text-gray-400 mt-1">Pending</p>
              </div>
              <div className="bg-secondary-light rounded-lg p-4">
                <p className="text-4xl font-bold text-purple-500">{analytics.dailyStats.avgCompletionTime}</p>
                <p className="text-gray-400 mt-1">Avg. Time (min)</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-secondary rounded-xl shadow-lg p-6 border border-secondary-light"
          >
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Order Timeline
            </h2>
            <div className="relative">
              <div className="absolute left-0 right-0 h-1 bg-secondary-light rounded"></div>
              {orders.map((order, index) => {
                const orderTime = new Date(order.orderTime);
                const now = new Date();
                const dayStart = new Date(now.setHours(0, 0, 0, 0));
                const dayEnd = new Date(now.setHours(23, 59, 59, 999));
                const totalDayMs = dayEnd - dayStart;
                const orderPosition = ((orderTime - dayStart) / totalDayMs) * 100;
                
                const getStatusColor = (order) => {
                  const waitTime = (now - orderTime) / (1000 * 60); // minutes
                  if (order.status === 'ready' || order.status === 'delivered') return 'bg-green-500';
                  if (waitTime > 15) return 'bg-red-500';
                  return 'bg-yellow-500';
                };

                return (
                  <div
                    key={order.orderId}
                    className={`absolute w-4 h-4 rounded-full ${getStatusColor(order)} -mt-1.5 transform -translate-x-1/2 cursor-pointer hover:scale-150 transition-transform`}
                    style={{ left: `${orderPosition}%` }}
                    title={`${order.customerName} - ${orderTime.toLocaleTimeString()}\n${order.items.map(item => `${item.quantity}x ${item.pizzaType}`).join('\n')}`}
                  >
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-sm text-gray-400 mt-2">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:59</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-secondary rounded-xl shadow-lg p-6 border border-secondary-light"
          >
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2v9a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Today's Insights
            </h2>
            <div className="space-y-4">
              <div className="bg-secondary-light rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Peak Hours</p>
                  <span className="text-yellow-500 font-semibold">
                    {(() => {
                      const hourCounts = new Array(24).fill(0);
                      orders.forEach(order => {
                        const hour = new Date(order.orderTime).getHours();
                        hourCounts[hour]++;
                      });
                      const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
                      return `${peakHour}:00 - ${peakHour + 1}:00`;
                    })()}
                  </span>
                </div>
              </div>
              <div className="bg-secondary-light rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Average Gap</p>
                  <span className="text-green-500 font-semibold">
                    {orders.length > 1 ? 
                      `${Math.round(24 * 60 / orders.length)} min` : 
                      'N/A'}
                  </span>
                </div>
              </div>
              <div className="bg-secondary-light rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Rush Period</p>
                  <span className="text-blue-500 font-semibold">
                    {orders.length >= 3 ? '11:00 - 14:00' : 'Not yet'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary rounded-xl shadow-lg border border-secondary-light"
        >
          <OrderManagement orders={orders} onStatusChange={handleStatusChange} />
        </motion.div>
      </main>

      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-secondary rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-secondary-light"
          >
            <div className="p-6 border-b border-secondary-light flex justify-between items-center">
              <h2 className="text-2xl font-bold text-primary">New Pizza Order</h2>
              <button
                onClick={() => setShowOrderForm(false)}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <OrderForm onSubmit={handleNewOrder} />
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;