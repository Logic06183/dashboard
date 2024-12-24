import React, { useState, useEffect } from 'react';
import StatsCard from '../StatsCard';
import OrderManagement from '../OrderManagement';
import CustomerTracking from '../CustomerTracking';
import OrderForm from '../OrderForm';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const DashboardPage = ({ orders = [], setOrders, showOrderForm, setShowOrderForm, handleNewOrder }) => {
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
  const calculateAverageCompletionTime = (orders = []) => {
    const completedOrders = orders.filter(order => order?.status === 'delivered');
    if (completedOrders.length === 0) return 0;

    const totalTime = completedOrders.reduce((sum, order) => {
      if (!order?.orderTime) return sum;
      const orderTime = new Date(order.orderTime);
      const deliveryTime = new Date(order.deliveryTime || order.completionTime || orderTime);
      return sum + (deliveryTime - orderTime);
    }, 0);

    return Math.round(totalTime / (completedOrders.length * 60000)); // Convert to minutes
  };

  // Calculate order stats
  useEffect(() => {
    if (!Array.isArray(orders)) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get today's orders
    const todayOrders = orders.filter(order => {
      if (!order?.orderTime) return false;
      const orderDate = new Date(order.orderTime);
      return orderDate >= today;
    });

    // Get yesterday's orders
    const yesterdayOrders = orders.filter(order => {
      if (!order?.orderTime) return false;
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
        if (!order?.items || !Array.isArray(order.items)) {
          return order?.totalAmount || 0;
        }

        return order.items.reduce((sum, item) => {
          if (!item?.totalPrice) return sum;
          return sum + item.totalPrice;
        }, 0);
      } catch (error) {
        console.error('Error calculating order total:', error);
        return 0;
      }
    };

    // Calculate daily stats
    const dailyStats = {
      totalOrders: todayOrders.length,
      totalSales: todayOrders.reduce((sum, order) => sum + calculateOrderTotal(order), 0),
      pendingOrders: todayOrders.filter(order => order?.status === 'pending').length,
      avgOrderValue: todayOrders.length > 0 
        ? (todayOrders.reduce((sum, order) => sum + calculateOrderTotal(order), 0) / todayOrders.length).toFixed(2)
        : 0,
      avgCompletionTime: calculateAverageCompletionTime(todayOrders),
      orderChange: parseFloat(orderChange)
    };

    // Filter active orders (not ready or delivered)
    const activeOrders = todayOrders.filter(o => o?.status && !['ready', 'delivered'].includes(o.status));
    
    setAnalytics(prev => ({
      ...prev,
      dailyStats
    }));
  }, [orders]);

  useEffect(() => {
    if (!Array.isArray(orders)) return;

    const sorted = [...orders].sort((a, b) => {
      const dateA = a?.dueTime ? new Date(a.dueTime) : new Date();
      const dateB = b?.dueTime ? new Date(b.dueTime) : new Date();
      return dateA - dateB;
    });
    setSortedOrders(sorted);

    // Calculate hourly order distribution
    const hourlyData = Array(24).fill(0);
    orders.forEach(order => {
      if (!order?.orderTime) return;
      const hour = new Date(order.orderTime).getHours();
      hourlyData[hour]++;
    });
    
    // Calculate popular toppings
    const toppingsCount = {};
    orders.forEach(order => {
      if (!order?.pizzas) return;
      order.pizzas.forEach(pizza => {
        if (!pizza?.toppings) return;
        pizza.toppings.forEach(topping => {
          toppingsCount[topping] = (toppingsCount[topping] || 0) + 1;
        });
      });
    });

    setAnalytics(prev => ({
      ...prev,
      hourlyOrders: hourlyData.map((count, hour) => ({ hour, count })),
      popularToppings: toppingsCount
    }));
  }, [orders]);

  const getTimeStatus = (dueTime) => {
    if (!dueTime) return 'normal';
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
    if (!orderId) return;
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.orderId === orderId 
          ? { ...order, status: newStatus }
          : order
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-dark to-secondary">
      <header className="bg-secondary-dark shadow-lg border-b border-secondary-light">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Orders"
            value={analytics.dailyStats.totalOrders}
            change={analytics.dailyStats.orderChange + '%'}
          />
          <StatsCard
            title="Total Sales"
            value={'$' + analytics.dailyStats.totalSales.toFixed(2)}
            change="+10%"
          />
          <StatsCard
            title="Average Order Value"
            value={'$' + analytics.dailyStats.avgOrderValue}
            change="+5%"
          />
          <StatsCard
            title="Pending Orders"
            value={analytics.dailyStats.pendingOrders}
            change="-2%"
          />
        </div>

        {/* Order Management Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Active Orders</h2>
          <OrderManagement 
            orders={sortedOrders.filter(o => o?.status === 'pending')} 
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* Customer Tracking Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Customer Orders</h2>
          <CustomerTracking orders={orders} />
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;