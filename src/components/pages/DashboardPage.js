import React, { useState, useEffect, useMemo } from 'react';
import StatsCard from '../StatsCard';
import { motion } from 'framer-motion';
import FirebaseService from '../../services/FirebaseService';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend 
} from 'recharts';
import { format } from 'date-fns';

const DashboardPage = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const unsubscribe = FirebaseService.subscribeToOrders((updatedOrders) => {
      setOrders(updatedOrders || []);
    });

    return () => unsubscribe();
  }, []);
  const [showCompleted, setShowCompleted] = useState(false);
  const [sortedOrders, setSortedOrders] = useState([]);
  const [analytics, setAnalytics] = useState({
    hourlyOrders: [],
    popularPizzas: [],
    deliveryPlatforms: [],
    preparationTimes: [],
    dailyStats: {
      totalOrders: 0,
      totalSales: 0,
      avgOrderValue: 0,
      avgPrepTime: 0,
      orderChange: 0,
      totalCustomers: 0
    },
    busyHours: [],
    revenueByPlatform: []
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

    // Calculate popular pizzas
    const pizzaCount = {};
    orders.forEach(order => {
      if (!order.pizzas || !Array.isArray(order.pizzas)) return;
      order.pizzas.forEach(pizza => {
        if (!pizza.pizzaType) return;
        pizzaCount[pizza.pizzaType] = (pizzaCount[pizza.pizzaType] || 0) + (pizza.quantity || 1);
      });
    });
    const popularPizzas = Object.entries(pizzaCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate average preparation times by hour
    const prepTimesByHour = {};
    const orderCountByHour = {};
    
    orders.forEach(order => {
      if (!order.orderTime || !order.completionTime) return;
      const orderTime = new Date(order.orderTime);
      const completionTime = new Date(order.completionTime);
      const prepTimeMinutes = Math.round((completionTime - orderTime) / (1000 * 60));
      
      // Skip invalid prep times
      if (prepTimeMinutes < 0 || prepTimeMinutes > 180) return;
      
      const hour = format(orderTime, 'HH:00');
      prepTimesByHour[hour] = (prepTimesByHour[hour] || 0) + prepTimeMinutes;
      orderCountByHour[hour] = (orderCountByHour[hour] || 0) + 1;
    });
    
    // Calculate hourly averages and sort by time
    const preparationTimes = Object.entries(prepTimesByHour)
      .map(([hour, totalTime]) => ({
        time: hour,
        avgTime: Math.round(totalTime / orderCountByHour[hour])
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    // Calculate peak hours
    const hourlyOrderCount = {};
    orders.forEach(order => {
      if (!order.orderTime) return;
      const orderHour = new Date(order.orderTime).getHours();
      hourlyOrderCount[orderHour] = (hourlyOrderCount[orderHour] || 0) + 1;
    });

    const busyHours = Object.entries(hourlyOrderCount)
      .map(([hour, count]) => ({
        hour: `${hour.padStart(2, '0')}:00`,
        orders: count
      }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 3); // Top 3 busiest hours

    // Calculate orders by platform
    const platformOrders = {};
    orders.forEach(order => {
      if (!order.platform) return;
      platformOrders[order.platform] = (platformOrders[order.platform] || 0) + 1;
    });
    const deliveryPlatforms = Object.entries(platformOrders)
      .map(([platform, orders]) => ({ platform, orders }))
      .sort((a, b) => b.orders - a.orders);

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
      dailyStats,
      popularPizzas,
      deliveryPlatforms,
      preparationTimes,
      busyHours
    }));
  }, [orders]);

  // Filter and sort orders based on completion status and time
  useEffect(() => {
    if (!Array.isArray(orders)) return;
    
    // First filter orders based on completion status
    const filtered = orders.filter(order => {
      // If showCompleted is true, show all orders regardless of status
      if (showCompleted) return true;
      
      // Otherwise, only show orders that are not completed/delivered/ready
      return !(order.status === 'delivered' || order.status === 'ready');
    });
    
    // Then sort orders by time and status
    const sorted = [...filtered].sort((a, b) => {
      const dateA = a?.dueTime ? new Date(a.dueTime) : new Date(a?.orderTime || Date.now());
      const dateB = b?.dueTime ? new Date(b.dueTime) : new Date(b?.orderTime || Date.now());
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

    // Format data for charts
    const hourlyOrders = Array(24).fill().map((_, i) => ({
      hour: i,
      orders: hourlyData[i]
    }));
    
    setAnalytics(prev => ({
      ...prev,
      hourlyOrders,
      popularToppings: toppingsCount
    }));
  }, [orders, showCompleted]);

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

  // Define handleStatusChange to handle checkbox updates
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      // Get the order
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        console.error(`Order ${orderId} not found`);
        return;
      }

      // Handle both string status and object status with cooked array
      const updateData = typeof newStatus === 'string'
        ? { status: newStatus }
        : { cooked: newStatus.cooked };

      // Update the order in Firebase
      await FirebaseService.updateOrder(orderId, updateData);
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId
            ? { ...order, ...updateData }
            : order
        )
      );

      // Dispatch custom event for order status update
      const event = new CustomEvent('order-status-updated', {
        detail: { orderId, newStatus: updateData }
      });
      window.dispatchEvent(event);

      console.log(`Order ${orderId} updated:`, updateData);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // Clear all orders function
  const clearAllOrders = async () => {
    try {
      await FirebaseService.clearAllOrders();
      setOrders([]);
      console.log('All orders have been cleared');
    } catch (error) {
      console.error('Error clearing orders:', error);
    }
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
            {/* Development controls */}
            <div>
                  <div className="flex space-x-4">
                <a 
                  href="/firebase-test" 
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 focus:outline-none"
                >
                  Firebase Test Tool
                </a>
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={showCompleted}
                    onChange={() => setShowCompleted(!showCompleted)}
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium">Show Completed Orders</span>
                </label>
                <button 
                  onClick={clearAllOrders} 
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none"
                >
                  Clear All Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="John's Daily Sales"
            value={'R' + analytics.dailyStats.totalSales.toFixed(2)}
            change={analytics.dailyStats.orderChange + '%'}
            trend="up"
          />
          <StatsCard
            title="Pizza Orders"
            value={analytics.dailyStats.totalOrders}
            change={`${((analytics.dailyStats.totalOrders / 100) * 100).toFixed(1)}%`}
            trend="up"
          />
          <StatsCard
            title="Most Popular Pizza"
            value={analytics.dailyStats.mostPopularPizza || 'The Champ'}
            change={analytics.dailyStats.popularityChange || '+12%'}
            trend="up"
          />
          <StatsCard
            title="Kitchen Status"
            value={`${analytics.dailyStats.avgPrepTime} min`}
            change={analytics.dailyStats.avgPrepTime > 30 ? 'Busy' : 'On Track'}
            trend={analytics.dailyStats.avgPrepTime > 30 ? 'down' : 'up'}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Hourly Orders Chart */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Orders by Hour</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.hourlyOrders}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Popular Pizzas Chart */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Most Popular Pizzas</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.popularPizzas}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    label
                  >
                    {analytics.popularPizzas.map((entry, index) => (
                      <Cell key={index} fill={['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Delivery Platforms Chart */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Orders by Platform</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.deliveryPlatforms}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Preparation Times Chart */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Average Preparation Times</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.preparationTimes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgTime" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Business Insights */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Business Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-800">Peak Hours</h4>
              <p className="text-sm text-purple-600 mt-2">
                Busiest time: {analytics.busyHours[0]?.hour || 'N/A'}<br />
                Orders: {analytics.busyHours[0]?.orders || 0}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800">Best Platform</h4>
              <p className="text-sm text-green-600 mt-2">
                Platform: {analytics.revenueByPlatform[0]?.platform || 'N/A'}<br />
                Revenue: R{analytics.revenueByPlatform[0]?.revenue?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800">Customer Base</h4>
              <p className="text-sm text-blue-600 mt-2">
                Total Customers: {analytics.dailyStats.totalCustomers}<br />
                Avg Order Value: R{analytics.dailyStats.avgOrderValue}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;