import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

/**
 * Optimized Customers/Orders Analytics Page
 *
 * Focus on reliable data instead of random customer names:
 * - Platform analytics (Uber, Mr D, Bolt, etc.)
 * - Pizza popularity across all orders
 * - Time-based order patterns
 * - Daily/weekly trends
 *
 * De-emphasizes unreliable customer name data from staff
 */

const pizzaPrices = {
  'THE CHAMP': 169.00, 'LEKKER\'IZZA': 195.00, 'CHICK TICK BOOM': 165.00,
  'MISH-MASH': 159.00, 'POPPA\'S': 179.00, 'PIG IN PARADISE': 169.00,
  'ARTICHOKE & HAM': 169.00, 'GLAZE OF GLORY': 159.00, 'MEDITERRANEAN': 175.00,
  'MARGIE': 125.00, 'OWEN': 169.00, 'CAPRESE': 165.00, 'VEGAN HARVEST': 175.00,
  'VEG SPECIAL': 155.00, 'BUILD YOUR OWN': 139.00, 'SPUD': 139.00,
  'GREEK GODDESS': 139.00, 'QUATTRO FORMAGGI': 169.00, 'MUSHROOM CLOUD': 169.00,
  'Margherita': 125.00, 'Pepperoni': 155.00, 'Vegetarian': 155.00
};

const COLORS = ['#8B5CF6', '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899'];

const CustomersPage = ({ orders = [] }) => {
  const [timeRange, setTimeRange] = useState('30days');
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  // Filter orders by time range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();

    switch (timeRange) {
      case '7days':
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case '30days':
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        break;
      case '90days':
        cutoffDate.setDate(cutoffDate.getDate() - 90);
        break;
      default:
        cutoffDate.setFullYear(cutoffDate.getFullYear() - 10); // All time
    }

    return orders.filter(order => {
      const orderDate = new Date(order.orderTime || order.createdAt);
      const platformMatch = selectedPlatform === 'all' || order.platform === selectedPlatform;
      return orderDate >= cutoffDate && platformMatch;
    });
  }, [orders, timeRange, selectedPlatform]);

  // Platform Analytics
  const platformAnalytics = useMemo(() => {
    const platforms = {};

    filteredOrders.forEach(order => {
      const platform = order.platform || 'Walk-in';
      if (!platforms[platform]) {
        platforms[platform] = {
          name: platform,
          orders: 0,
          revenue: 0,
          pizzas: 0,
          drinks: 0
        };
      }

      platforms[platform].orders += 1;

      // Calculate revenue
      let orderRevenue = 0;
      if (order.pizzas && Array.isArray(order.pizzas)) {
        order.pizzas.forEach(pizza => {
          const price = pizzaPrices[pizza.pizzaType] || 150;
          orderRevenue += price * (pizza.quantity || 1);
          platforms[platform].pizzas += (pizza.quantity || 1);
        });
      }

      if (order.coldDrinks && Array.isArray(order.coldDrinks)) {
        order.coldDrinks.forEach(drink => {
          orderRevenue += 25 * (drink.quantity || 1);
          platforms[platform].drinks += (drink.quantity || 1);
        });
      }

      platforms[platform].revenue += orderRevenue;
    });

    return Object.values(platforms).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  // Pizza Popularity Analytics
  const pizzaPopularity = useMemo(() => {
    const pizzas = {};

    filteredOrders.forEach(order => {
      if (order.pizzas && Array.isArray(order.pizzas)) {
        order.pizzas.forEach(pizza => {
          const type = pizza.pizzaType || 'Unknown';
          if (!pizzas[type]) {
            pizzas[type] = {
              name: type,
              count: 0,
              revenue: 0
            };
          }
          const quantity = pizza.quantity || 1;
          pizzas[type].count += quantity;
          pizzas[type].revenue += (pizzaPrices[type] || 150) * quantity;
        });
      }
    });

    return Object.values(pizzas)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10
  }, [filteredOrders]);

  // Daily order trend (last 30 days)
  const dailyTrend = useMemo(() => {
    const days = {};
    const now = new Date();

    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });
      days[dateKey] = { date: dateKey, orders: 0, revenue: 0 };
    }

    filteredOrders.forEach(order => {
      const orderDate = new Date(order.orderTime || order.createdAt);
      const dateKey = orderDate.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });

      if (days[dateKey]) {
        days[dateKey].orders += 1;

        // Calculate revenue
        if (order.pizzas && Array.isArray(order.pizzas)) {
          order.pizzas.forEach(pizza => {
            const price = pizzaPrices[pizza.pizzaType] || 150;
            days[dateKey].revenue += price * (pizza.quantity || 1);
          });
        }
      }
    });

    return Object.values(days);
  }, [filteredOrders]);

  // Peak hours analysis
  const hourlyAnalytics = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${i}:00`,
      orders: 0
    }));

    filteredOrders.forEach(order => {
      const orderDate = new Date(order.orderTime || order.createdAt);
      const hour = orderDate.getHours();
      hours[hour].orders += 1;
    });

    return hours.filter(h => h.orders > 0); // Only show hours with orders
  }, [filteredOrders]);

  // Summary stats
  const stats = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => {
      let revenue = 0;
      if (order.pizzas && Array.isArray(order.pizzas)) {
        order.pizzas.forEach(pizza => {
          revenue += (pizzaPrices[pizza.pizzaType] || 150) * (pizza.quantity || 1);
        });
      }
      return sum + revenue;
    }, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalPizzas = filteredOrders.reduce((sum, order) => {
      if (order.pizzas && Array.isArray(order.pizzas)) {
        return sum + order.pizzas.reduce((pSum, p) => pSum + (p.quantity || 1), 0);
      }
      return sum;
    }, 0);

    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      totalPizzas
    };
  }, [filteredOrders]);

  const exportData = () => {
    const csvContent = [
      ['Platform Analytics Report'],
      ['Generated:', new Date().toLocaleDateString('en-ZA')],
      ['Time Range:', timeRange],
      [''],
      ['Platform', 'Orders', 'Revenue', 'Pizzas Sold', 'Avg Order Value'],
      ...platformAnalytics.map(p => [
        p.name,
        p.orders,
        `R${p.revenue.toFixed(2)}`,
        p.pizzas,
        `R${(p.revenue / p.orders).toFixed(2)}`
      ]),
      [''],
      ['Top Pizzas'],
      ['Pizza', 'Quantity Sold', 'Revenue'],
      ...pizzaPopularity.map(p => [
        p.name,
        p.count,
        `R${p.revenue.toFixed(2)}`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `order-analytics-${new Date().toLocaleDateString('en-ZA')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold mb-6">Order & Platform Analytics</h2>
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500">No order data available. Place some orders to see analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Order & Platform Analytics</h2>
          <p className="text-gray-600 mt-1">Reliable data based on order platforms and pizza sales</p>
        </div>
        <button
          onClick={exportData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          💾 Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Platforms</option>
              {platformAnalytics.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Orders</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">R{stats.totalRevenue.toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Order Value</h3>
          <p className="text-3xl font-bold text-blue-600">R{stats.avgOrderValue.toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Pizzas Sold</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.totalPizzas}</p>
        </div>
      </div>

      {/* Platform Performance */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-6">Platform Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pizzas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Order</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {platformAnalytics.map((platform, idx) => (
                <tr key={platform.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-gray-900">{platform.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{platform.orders}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-green-600 font-semibold">
                    R{platform.revenue.toFixed(0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{platform.pizzas}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-semibold">
                    R{(platform.revenue / platform.orders).toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Revenue Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue by Platform</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={platformAnalytics}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                dataKey="revenue"
              >
                {platformAnalytics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `R${value.toFixed(0)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Pizzas */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Top 10 Pizzas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pizzaPopularity} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Trend */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Order Trend (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#8B5CF6" strokeWidth={2} name="Orders" />
            <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} name="Revenue (R)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Peak Hours */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Peak Order Hours</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={hourlyAnalytics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="orders" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CustomersPage;
