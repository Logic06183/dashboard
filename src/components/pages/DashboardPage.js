import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FirebaseService from '../../services/FirebaseService';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';
import { format } from 'date-fns';

const DashboardPage = () => {
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState({});
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = FirebaseService.subscribeToOrders((updatedOrders) => {
      setOrders(updatedOrders || []);
    });

    return () => unsubscribe();
  }, []);

  // Load inventory data
  useEffect(() => {
    const loadInventory = async () => {
      try {
        const inventoryData = await FirebaseService.getInventory();
        setInventory(inventoryData);

        // Find low stock items
        const lowStock = Object.entries(inventoryData)
          .filter(([name, data]) => data.amount <= (data.threshold || 100))
          .map(([name, data]) => ({
            name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            amount: data.amount,
            unit: data.unit,
            threshold: data.threshold || 100
          }))
          .slice(0, 5);

        setLowStockItems(lowStock);
        setLoading(false);
      } catch (error) {
        console.error('Error loading inventory:', error);
        setLoading(false);
      }
    };

    loadInventory();
  }, []);

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
      totalCustomers: 0,
      activePizzas: 0,
      completedPizzas: 0
    },
    busyHours: [],
    revenueByPlatform: [],
    recentOrders: []
  });

  // Calculate all analytics
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

    // Calculate order change
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

    // Calculate hourly distribution for today
    const hourlyData = Array(24).fill(0);
    todayOrders.forEach(order => {
      if (!order?.orderTime) return;
      const hour = new Date(order.orderTime).getHours();
      hourlyData[hour]++;
    });

    const hourlyOrders = hourlyData.map((count, hour) => ({
      hour: `${String(hour).padStart(2, '0')}:00`,
      orders: count
    }));

    // Calculate order total helper
    const calculateOrderTotal = (order) => {
      try {
        if (order?.totalAmount) return order.totalAmount;
        if (!order?.items || !Array.isArray(order.items)) return 0;
        return order.items.reduce((sum, item) => sum + (item?.totalPrice || 0), 0);
      } catch (error) {
        return 0;
      }
    };

    // Calculate revenue by platform
    const platformRevenue = {};
    const platformOrders = {};
    orders.forEach(order => {
      if (!order.platform) return;
      platformOrders[order.platform] = (platformOrders[order.platform] || 0) + 1;
      platformRevenue[order.platform] = (platformRevenue[order.platform] || 0) + calculateOrderTotal(order);
    });

    const deliveryPlatforms = Object.entries(platformOrders)
      .map(([platform, count]) => ({ platform, orders: count }))
      .sort((a, b) => b.orders - a.orders);

    const revenueByPlatform = Object.entries(platformRevenue)
      .map(([platform, revenue]) => ({ platform, revenue }))
      .sort((a, b) => b.revenue - a.revenue);

    // Pizza completion stats
    let activePizzas = 0;
    let completedPizzas = 0;
    orders.forEach(order => {
      if (order.pizzas && Array.isArray(order.pizzas)) {
        order.pizzas.forEach((pizza, idx) => {
          const quantity = pizza.quantity || 1;
          if (pizza.isCooked || (order.cooked && order.cooked[idx])) {
            completedPizzas += quantity;
          } else {
            activePizzas += quantity;
          }
        });
      }
    });

    // Recent orders (last 5 today)
    const recentOrders = todayOrders
      .sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime))
      .slice(0, 5);

    // Daily stats
    const dailyStats = {
      totalOrders: todayOrders.length,
      totalSales: todayOrders.reduce((sum, order) => sum + calculateOrderTotal(order), 0),
      avgOrderValue: todayOrders.length > 0
        ? (todayOrders.reduce((sum, order) => sum + calculateOrderTotal(order), 0) / todayOrders.length)
        : 0,
      orderChange: parseFloat(orderChange),
      activePizzas,
      completedPizzas,
      pendingOrders: todayOrders.filter(o => o.status === 'pending').length
    };

    setAnalytics({
      hourlyOrders,
      popularPizzas,
      deliveryPlatforms,
      revenueByPlatform,
      dailyStats,
      recentOrders
    });
  }, [orders]);

  const StatCard = ({ title, value, change, icon, color, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${color} rounded-xl shadow-lg p-6 relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 opacity-10 text-8xl">
        {icon}
      </div>
      <div className="relative z-10">
        <p className="text-white text-sm font-medium opacity-90">{title}</p>
        <h3 className="text-white text-3xl font-bold mt-2">{value}</h3>
        {change && (
          <div className="flex items-center mt-2">
            <span className={`text-sm ${trend === 'up' ? 'text-green-200' : 'text-red-200'}`}>
              {trend === 'up' ? '↑' : '↓'} {change}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );

  const QuickActionCard = ({ title, description, icon, onClick, color }) => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md p-6 text-left hover:shadow-xl transition-all border-l-4 ${color}`}
    >
      <div className="flex items-start space-x-4">
        <div className={`text-4xl`}>{icon}</div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 mb-1">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </motion.button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                John Dough's Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Real-time business overview · {format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                ● Live
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Quick Actions */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              title="New Order"
              description="Create a new pizza order"
              icon="🍕"
              color="border-blue-500"
              onClick={() => window.location.hash = '#/orders'}
            />
            <QuickActionCard
              title="Update Stock"
              description="Add daily inventory"
              icon="📦"
              color="border-green-500"
              onClick={() => window.location.hash = '#/stock'}
            />
            <QuickActionCard
              title="View Customers"
              description="Manage customer database"
              icon="👥"
              color="border-purple-500"
              onClick={() => window.location.hash = '#/customers'}
            />
            <QuickActionCard
              title="Analytics"
              description="View detailed reports"
              icon="📊"
              color="border-orange-500"
              onClick={() => window.location.hash = '#/analytics'}
            />
          </div>
        </section>

        {/* Key Metrics */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📈 Today's Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Sales"
              value={`R${analytics.dailyStats.totalSales.toFixed(0)}`}
              change={`${analytics.dailyStats.orderChange > 0 ? '+' : ''}${analytics.dailyStats.orderChange}%`}
              trend={analytics.dailyStats.orderChange >= 0 ? 'up' : 'down'}
              icon="💰"
              color="from-green-500 to-emerald-600"
            />
            <StatCard
              title="Orders Today"
              value={analytics.dailyStats.totalOrders}
              change={`${analytics.dailyStats.pendingOrders} pending`}
              icon="📝"
              color="from-blue-500 to-indigo-600"
            />
            <StatCard
              title="Avg Order Value"
              value={`R${analytics.dailyStats.avgOrderValue.toFixed(0)}`}
              icon="💵"
              color="from-purple-500 to-pink-600"
            />
            <StatCard
              title="Active Pizzas"
              value={`${analytics.dailyStats.activePizzas}`}
              change={`${analytics.dailyStats.completedPizzas} completed`}
              icon="🍕"
              color="from-orange-500 to-red-600"
            />
          </div>
        </section>

        {/* Alerts & Inventory Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alerts */}
          <section className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">⚠️ Low Stock Alert</h3>
              <button
                onClick={() => window.location.hash = '#/stock'}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Update Stock →
              </button>
            </div>
            {lowStockItems.length > 0 ? (
              <div className="space-y-3">
                {lowStockItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-sm text-red-600">
                        Current: {item.amount}{item.unit} (Threshold: {item.threshold}{item.unit})
                      </p>
                    </div>
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      LOW
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">✅</p>
                <p className="font-medium">All stock levels are good!</p>
              </div>
            )}
          </section>

          {/* Recent Orders */}
          <section className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">🕐 Recent Orders</h3>
              <button
                onClick={() => window.location.hash = '#/orders'}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All →
              </button>
            </div>
            {analytics.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentOrders.map((order, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-800">{order.customerName || 'Guest'}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'ready' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {order.pizzas?.length || 0} pizza(s) · {order.platform || 'Window'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(order.orderTime), 'HH:mm')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">📭</p>
                <p className="font-medium">No orders yet today</p>
              </div>
            )}
          </section>
        </div>

        {/* Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Orders */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Orders by Hour</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.hourlyOrders}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="hour" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="orders" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOrders)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Popular Pizzas */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🏆 Top Pizzas</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.popularPizzas}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.name}: ${entry.count}`}
                >
                  {analytics.popularPizzas.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🚗 Orders by Platform</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.deliveryPlatforms}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="platform" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="orders" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Platform */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">💵 Revenue by Platform</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.revenueByPlatform}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="platform" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value) => `R${value.toFixed(2)}`}
                />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;
