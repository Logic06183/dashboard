import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { sampleOrders } from '../../sampleOrders';
import { PIZZA_INGREDIENTS } from '../../services/InventoryService';

const AnalyticsPage = ({ orders = [], archivedOrders = [] }) => {
  const [dateRange, setDateRange] = useState('week');
  const [showArchived, setShowArchived] = useState(true);
  
  // Combine active and archived orders if showArchived is true
  const allOrders = useMemo(() => {
    return showArchived ? [...orders, ...archivedOrders] : orders;
  }, [orders, archivedOrders, showArchived]);
  
  // Use sample orders if no real orders exist yet
  const ordersToAnalyze = useMemo(() => {
    return allOrders.length > 0 ? allOrders : sampleOrders;
  }, [allOrders]);
  
  // Get date filter based on selected range
  const getDateFilter = () => {
    const now = new Date();
    const filter = new Date();
    
    switch(dateRange) {
      case 'day':
        filter.setDate(now.getDate() - 1);
        break;
      case 'week':
        filter.setDate(now.getDate() - 7);
        break;
      case 'month':
        filter.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        filter.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        filter.setFullYear(now.getFullYear() - 1);
        break;
      default:
        filter.setDate(now.getDate() - 7); // Default to week
    }
    
    return filter;
  };
  
  // =================== DATA CALCULATIONS ===================
  
  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    const dateFilter = getDateFilter();
    return ordersToAnalyze.filter(order => {
      const orderDate = new Date(order.orderTime);
      return orderDate >= dateFilter;
    });
  }, [ordersToAnalyze, dateRange]);
  
  // Sales By Day data
  const salesByDay = useMemo(() => {
    const salesMap = {};
    
    filteredOrders.forEach(order => {
      const date = new Date(order.orderTime);
      const dateString = date.toLocaleDateString();
      
      if (!salesMap[dateString]) {
        salesMap[dateString] = {
          date: dateString,
          sales: 0,
          orders: 0
        };
      }
      
      salesMap[dateString].sales += order.totalAmount || 0;
      salesMap[dateString].orders += 1;
    });
    
    // Convert to array and sort by date
    return Object.values(salesMap).sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
  }, [filteredOrders]);
  
  // Popular pizzas data
  const popularPizzas = useMemo(() => {
    const pizzaCount = {};
    
    filteredOrders.forEach(order => {
      if (!order.pizzas) return;
      
      order.pizzas.forEach(pizza => {
        const pizzaType = pizza.pizzaType || pizza.type;
        if (!pizzaType) return;
        
        const quantity = pizza.quantity || 1;
        
        if (!pizzaCount[pizzaType]) {
          pizzaCount[pizzaType] = 0;
        }
        
        pizzaCount[pizzaType] += quantity;
      });
    });
    
    // Convert to array and sort by count
    return Object.entries(pizzaCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Get top 8
  }, [filteredOrders]);
  
  // Order status breakdown
  const orderStatusData = useMemo(() => {
    const statusCount = {
      pending: 0,
      cooking: 0,
      ready: 0,
      delivered: 0
    };
    
    filteredOrders.forEach(order => {
      const status = order.status || 'pending';
      
      if (statusCount[status] !== undefined) {
        statusCount[status] += 1;
      } else {
        statusCount.pending += 1;
      }
    });
    
    // Convert to array for pie chart
    return Object.entries(statusCount)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [filteredOrders]);
  
  // Average preparation time
  const averagePrepTime = useMemo(() => {
    if (filteredOrders.length === 0) return 0;
    
    const totalPrepTime = filteredOrders.reduce((sum, order) => {
      return sum + (order.prepTime || 0);
    }, 0);
    
    return Math.round(totalPrepTime / filteredOrders.length);
  }, [filteredOrders]);
  
  // Total revenue
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, order) => {
      return sum + (order.totalAmount || 0);
    }, 0);
  }, [filteredOrders]);
  
  // Average order value
  const averageOrderValue = useMemo(() => {
    if (filteredOrders.length === 0) return 0;
    return Math.round(totalRevenue / filteredOrders.length);
  }, [filteredOrders, totalRevenue]);
  
  // Busiest times of day
  const busiestTimes = useMemo(() => {
    const hourCounts = Array(24).fill(0);
    
    filteredOrders.forEach(order => {
      const date = new Date(order.orderTime);
      const hour = date.getHours();
      hourCounts[hour] += 1;
    });
    
    // Convert to array for chart
    return hourCounts.map((count, hour) => ({
      hour: `${hour}:00`,
      orders: count
    }));
  }, [filteredOrders]);
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A04AD9', '#E06C75'];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Business Analytics</h1>
      
      {/* Filters */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 bg-gray-100 p-4 rounded-lg">
        <div>
          <label htmlFor="dateRange" className="mr-2 font-medium">Date Range:</label>
          <select 
            id="dateRange" 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded border-gray-300 bg-white p-2"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 3 Months</option>
            <option value="year">Last 12 Months</option>
          </select>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showArchived"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="mr-2 h-4 w-4"
          />
          <label htmlFor="showArchived">Include Archived Orders</label>
        </div>
      </div>
      
      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Orders</h3>
          <p className="text-2xl font-bold">{filteredOrders.length}</p>
          <p className="text-green-600 text-sm">{dateRange === 'day' ? 'Today' : `Last ${dateRange}`}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Revenue</h3>
          <p className="text-2xl font-bold">R{totalRevenue}</p>
          <p className="text-green-600 text-sm">{dateRange === 'day' ? 'Today' : `Last ${dateRange}`}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Avg. Order Value</h3>
          <p className="text-2xl font-bold">R{averageOrderValue}</p>
          <p className="text-green-600 text-sm">{dateRange === 'day' ? 'Today' : `Last ${dateRange}`}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Avg. Prep Time</h3>
          <p className="text-2xl font-bold">{averagePrepTime} min</p>
          <p className="text-green-600 text-sm">{dateRange === 'day' ? 'Today' : `Last ${dateRange}`}</p>
        </div>
      </div>
      
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Sales Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Sales Trend</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={salesByDay}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`R${value}`, 'Sales']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                  name="Sales (R)"
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#82ca9d" 
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Popular Pizzas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Most Popular Pizzas</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={popularPizzas}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="count" 
                  name="Quantity Ordered"
                  fill="#8884d8"
                >
                  {popularPizzas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Order Status Breakdown</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} orders`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Busiest Times */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Busiest Hours of the Day</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={busiestTimes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  interval={1}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} orders`, 'Orders']} />
                <Bar 
                  dataKey="orders" 
                  name="Number of Orders"
                  fill="#8884d8"
                >
                  {busiestTimes.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.orders > 0 ? COLORS[Math.min(5, Math.floor(entry.orders / 2)) % COLORS.length] : '#CCCCCC'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
