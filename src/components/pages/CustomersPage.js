import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import CustomerMigrationTool from '../CustomerMigrationTool';

// Pizza menu prices for value calculations
const pizzaPrices = {
  'THE CHAMP': 169.00, 'LEKKER\'IZZA': 195.00, 'CHICK TICK BOOM!': 165.00,
  'MISH-MASH': 159.00, 'POPPA\'S': 179.00, 'PIG IN PARADISE': 169.00,
  'ARTICHOKE & HAM': 169.00, 'GLAZE OF GLORY': 159.00, 'MEDITERRANEAN': 175.00,
  'MARGIE': 125.00, 'OWEN!': 169.00, 'CAPRESE': 165.00, 'VEGAN HARVEST': 175.00,
  'VEG SPECIAL': 155.00, 'BUILD YOUR OWN': 139.00, 'SPUD': 139.00,
  'GREEK GODDESS': 139.00, 'QUATTRO FORMAGGI': 169.00, 'MUSHROOM CLOUD': 169.00,
  'Margherita': 125.00, 'Pepperoni': 155.00, 'Vegetarian': 155.00
};

const drinkPrices = {
  'Coca-Cola 330ml': 25.00, 'Coke Zero 330ml': 25.00, 'Sprite 330ml': 25.00,
  'Fanta Orange 330ml': 25.00, 'Appletizer 330ml': 28.00, 'Grapetizer 330ml': 28.00,
  'Still Water 500ml': 18.00, 'Sparkling Water 500ml': 20.00, 'Ice Tea 500ml': 28.00,
  'Red Bull 250ml': 35.00
};

const CustomersPage = ({ orders = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('totalValue');
  const [showMigrationTool, setShowMigrationTool] = useState(false);

  // Helper functions
  const getCustomerSegment = (customer) => {
    if (customer.totalValue >= 500) return 'VIP';
    if (customer.totalOrders >= 5) return 'Frequent';
    if (customer.totalOrders >= 2) return 'Regular';
    return 'New';
  };

  const getRecencyCategory = (daysSince) => {
    if (daysSince <= 7) return 'Active';
    if (daysSince <= 30) return 'Recent';
    return 'At Risk';
  };

  // Customer analytics calculations
  const customerAnalytics = useMemo(() => {
    if (!orders || orders.length === 0) return { customers: [], totalCustomers: 0, segments: {} };

    const customerMap = new Map();
    const now = new Date();

    orders.forEach(order => {
      // Use customerId as primary key if available, fall back to customerName
      const customerKey = order.customerId || order.customerName;
      const customerName = order.customerName;
      const customerPhone = order.phone;
      
      if (!customerKey || !customerName) return;

      let orderValue = 0;
      let pizzaCount = 0;
      let drinkCount = 0;
      const pizzaTypes = [];
      const drinkTypes = [];

      // Calculate pizza value and count
      if (order.pizzas && Array.isArray(order.pizzas)) {
        order.pizzas.forEach(pizza => {
          const quantity = pizza.quantity || 1;
          const pizzaType = pizza.pizzaType || pizza.type || 'Unknown';
          const price = pizzaPrices[pizzaType] || 150; // Default price
          orderValue += price * quantity;
          pizzaCount += quantity;
          pizzaTypes.push(pizzaType);
        });
      } else if (order.pizzaType) {
        // Handle legacy format
        const price = pizzaPrices[order.pizzaType] || 150;
        orderValue += price;
        pizzaCount += 1;
        pizzaTypes.push(order.pizzaType);
      }

      // Calculate drink value and count
      if (order.coldDrinks && Array.isArray(order.coldDrinks)) {
        order.coldDrinks.forEach(drink => {
          const quantity = drink.quantity || 1;
          const drinkType = drink.drinkType || 'Unknown';
          const price = drinkPrices[drinkType] || 25; // Default price
          orderValue += price * quantity;
          drinkCount += quantity;
          drinkTypes.push(drinkType);
        });
      }

      const orderDate = new Date(order.orderTime || order.createdAt || now);
      const daysSinceOrder = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));

      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          id: order.customerId || null,
          name: customerName,
          phone: customerPhone || 'N/A',
          totalOrders: 0,
          totalValue: 0,
          totalPizzas: 0,
          totalDrinks: 0,
          platforms: new Set(),
          pizzaPreferences: new Map(),
          drinkPreferences: new Map(),
          firstOrder: orderDate,
          lastOrder: orderDate,
          daysSinceLastOrder: daysSinceOrder,
          orderHistory: []
        });
      }

      const customer = customerMap.get(customerKey);
      customer.totalOrders += 1;
      customer.totalValue += orderValue;
      customer.totalPizzas += pizzaCount;
      customer.totalDrinks += drinkCount;
      customer.platforms.add(order.platform || 'Unknown');
      
      // Track pizza preferences
      pizzaTypes.forEach(pizza => {
        customer.pizzaPreferences.set(pizza, (customer.pizzaPreferences.get(pizza) || 0) + 1);
      });
      
      // Track drink preferences
      drinkTypes.forEach(drink => {
        customer.drinkPreferences.set(drink, (customer.drinkPreferences.get(drink) || 0) + 1);
      });

      if (orderDate < customer.firstOrder) customer.firstOrder = orderDate;
      if (orderDate > customer.lastOrder) {
        customer.lastOrder = orderDate;
        customer.daysSinceLastOrder = daysSinceOrder;
      }

      customer.orderHistory.push({
        date: orderDate,
        value: orderValue,
        platform: order.platform,
        pizzas: pizzaTypes,
        drinks: drinkTypes
      });
    });

    // Convert to array and add calculated fields
    const customers = Array.from(customerMap.values()).map(customer => ({
      ...customer,
      platforms: Array.from(customer.platforms),
      averageOrderValue: customer.totalValue / customer.totalOrders,
      favoritePizza: customer.pizzaPreferences.size > 0 ? 
        Array.from(customer.pizzaPreferences.entries())
          .sort((a, b) => b[1] - a[1])[0][0] : 'None',
      favoriteDrink: customer.drinkPreferences.size > 0 ? 
        Array.from(customer.drinkPreferences.entries())
          .sort((a, b) => b[1] - a[1])[0][0] : 'None',
      primaryPlatform: customer.platforms[0] || 'Unknown',
      customerSegment: getCustomerSegment(customer),
      recencyCategory: getRecencyCategory(customer.daysSinceLastOrder)
    }));

    // Calculate segments
    const segments = {
      vip: customers.filter(c => c.customerSegment === 'VIP').length,
      frequent: customers.filter(c => c.customerSegment === 'Frequent').length,
      regular: customers.filter(c => c.customerSegment === 'Regular').length,
      new: customers.filter(c => c.customerSegment === 'New').length,
      active: customers.filter(c => c.recencyCategory === 'Active').length,
      recent: customers.filter(c => c.recencyCategory === 'Recent').length,
      atRisk: customers.filter(c => c.recencyCategory === 'At Risk').length
    };

    return {
      customers,
      totalCustomers: customers.length,
      segments,
      totalValue: customers.reduce((sum, c) => sum + c.totalValue, 0),
      averageOrderValue: customers.reduce((sum, c) => sum + c.averageOrderValue, 0) / customers.length || 0
    };
  }, [orders]);

  const getSegmentColor = (segment) => {
    const colors = {
      VIP: 'bg-purple-100 text-purple-800',
      Frequent: 'bg-green-100 text-green-800',
      Regular: 'bg-blue-100 text-blue-800',
      New: 'bg-yellow-100 text-yellow-800'
    };
    return colors[segment] || 'bg-gray-100 text-gray-800';
  };

  const getRecencyColor = (category) => {
    const colors = {
      Active: 'bg-green-100 text-green-800',
      Recent: 'bg-yellow-100 text-yellow-800',
      'At Risk': 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let filtered = customerAnalytics.customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          customer.phone.includes(searchTerm);
      const matchesCategory = filterCategory === 'all' || 
                            customer.customerSegment.toLowerCase() === filterCategory ||
                            customer.recencyCategory.toLowerCase().replace(' ', '-') === filterCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort customers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'totalValue': return b.totalValue - a.totalValue;
        case 'totalOrders': return b.totalOrders - a.totalOrders;
        case 'averageOrderValue': return b.averageOrderValue - a.averageOrderValue;
        case 'lastOrder': return new Date(b.lastOrder) - new Date(a.lastOrder);
        case 'name': return a.name.localeCompare(b.name);
        default: return b.totalValue - a.totalValue;
      }
    });

    return filtered;
  }, [customerAnalytics.customers, searchTerm, filterCategory, sortBy]);

  // Chart data
  const segmentChartData = [
    { name: 'VIP', value: customerAnalytics.segments.vip, color: '#8B5CF6' },
    { name: 'Frequent', value: customerAnalytics.segments.frequent, color: '#10B981' },
    { name: 'Regular', value: customerAnalytics.segments.regular, color: '#3B82F6' },
    { name: 'New', value: customerAnalytics.segments.new, color: '#F59E0B' }
  ];

  const platformData = useMemo(() => {
    const platformCounts = {};
    customerAnalytics.customers.forEach(customer => {
      customer.platforms.forEach(platform => {
        platformCounts[platform] = (platformCounts[platform] || 0) + 1;
      });
    });
    return Object.entries(platformCounts).map(([platform, count]) => ({
      platform,
      customers: count
    }));
  }, [customerAnalytics.customers]);

  const exportCustomerData = () => {
    const csvContent = [
      ['Customer Name', 'Phone', 'Segment', 'Total Orders', 'Total Value', 'Average Order Value', 'Favorite Pizza', 'Primary Platform', 'Last Order'],
      ...filteredCustomers.map(customer => [
        customer.name,
        customer.phone,
        customer.customerSegment,
        customer.totalOrders,
        `R${customer.totalValue.toFixed(2)}`,
        `R${customer.averageOrderValue.toFixed(2)}`,
        customer.favoritePizza,
        customer.primaryPlatform,
        customer.lastOrder.toLocaleDateString('en-ZA')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'customer-analytics.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold mb-6">Customer Analytics</h2>
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500">No customer data available. Orders are needed to generate customer insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Customer Analytics</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMigrationTool(!showMigrationTool)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            🔄 {showMigrationTool ? 'Hide' : 'Show'} Migration Tool
          </button>
          <button
            onClick={exportCustomerData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            💾 Export Data
          </button>
        </div>
      </div>

      {/* Migration Tool */}
      {showMigrationTool && (
        <CustomerMigrationTool orders={orders} />
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Customers</h3>
          <p className="text-3xl font-bold text-gray-900">{customerAnalytics.totalCustomers}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Customer Value</h3>
          <p className="text-3xl font-bold text-green-600">R{customerAnalytics.totalValue.toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Avg Order Value</h3>
          <p className="text-3xl font-bold text-blue-600">R{customerAnalytics.averageOrderValue.toFixed(0)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">VIP Customers</h3>
          <p className="text-3xl font-bold text-purple-600">{customerAnalytics.segments.vip}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Segments */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Customer Segments</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={segmentChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {segmentChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Customer Platform Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={platformData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="platform" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="customers" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search customers by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Customers</option>
            <option value="vip">VIP Customers</option>
            <option value="frequent">Frequent Customers</option>
            <option value="regular">Regular Customers</option>
            <option value="new">New Customers</option>
            <option value="active">Active (Last 7 days)</option>
            <option value="recent">Recent (Last 30 days)</option>
            <option value="at-risk">At Risk (30+ days)</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="totalValue">Total Value</option>
            <option value="totalOrders">Total Orders</option>
            <option value="averageOrderValue">Average Order Value</option>
            <option value="lastOrder">Last Order</option>
            <option value="name">Name</option>
          </select>
        </div>

        {/* Customer Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCustomers.map((customer, index) => (
            <div key={customer.name} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-lg">{customer.name}</h4>
                  <p className="text-gray-600">{customer.phone}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getSegmentColor(customer.customerSegment)}`}>
                    {customer.customerSegment}
                  </span>
                  <div className="mt-1">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRecencyColor(customer.recencyCategory)}`}>
                      {customer.recencyCategory}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="font-semibold">{customer.totalOrders}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Value</p>
                  <p className="font-semibold text-green-600">R{customer.totalValue.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg Order Value</p>
                  <p className="font-semibold">R{customer.averageOrderValue.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Primary Platform</p>
                  <p className="font-semibold">{customer.primaryPlatform}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">Preferences</p>
                <p className="text-sm"><strong>Pizza:</strong> {customer.favoritePizza}</p>
                {customer.favoriteDrink !== 'None' && (
                  <p className="text-sm"><strong>Drink:</strong> {customer.favoriteDrink}</p>
                )}
                <p className="text-sm mt-2 text-gray-600">
                  Last order: {customer.lastOrder.toLocaleDateString('en-ZA')} 
                  ({customer.daysSinceLastOrder} days ago)
                </p>
              </div>
            </div>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No customers found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;