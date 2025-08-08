import React, { useState, useMemo } from 'react';
import { PIZZA_INGREDIENTS } from '../data/ingredients';

const InventoryUsageSummary = ({ orders = [] }) => {
  const [timeRange, setTimeRange] = useState('last7days');
  const [summaryFormat, setSummaryFormat] = useState('detailed');

  // Filter orders based on selected time range
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    return orders.filter(order => {
      let orderDate;
      if (order.orderTime) {
        orderDate = new Date(order.orderTime);
      } else if (order.createdAt) {
        orderDate = new Date(order.createdAt);
      } else {
        return false;
      }

      if (isNaN(orderDate.getTime())) return false;

      switch (timeRange) {
        case 'today':
          return orderDate >= today;
        case 'yesterday':
          return orderDate >= yesterday && orderDate < today;
        case 'last7days':
          return orderDate >= lastWeek;
        case 'last30days':
          return orderDate >= lastMonth;
        default:
          return true;
      }
    });
  }, [orders, timeRange]);

  // Calculate comprehensive usage statistics
  const usageStats = useMemo(() => {
    if (!filteredOrders || filteredOrders.length === 0) {
      return {
        ingredients: {},
        totalCost: 0,
        totalOrders: 0,
        totalPizzas: 0,
        totalDrinks: 0,
        categories: {},
        reorderRecommendations: []
      };
    }

    // Initialize all ingredients
    const ingredients = {};
    const categories = {};
    
    const addIngredient = (ingredient, data) => {
      if (!ingredients[ingredient]) {
        ingredients[ingredient] = {
          used: 0,
          cost: 0,
          unit: data.unit,
          category: data.category,
          unitCost: data.cost
        };
      }
    };

    // Add base ingredients
    Object.entries(PIZZA_INGREDIENTS.base).forEach(([ingredient, data]) => {
      addIngredient(ingredient, data);
    });

    // Add pizza-specific ingredients
    Object.values(PIZZA_INGREDIENTS.pizzas).forEach(pizza => {
      Object.entries(pizza.ingredients).forEach(([ingredient, data]) => {
        addIngredient(ingredient, data);
      });
    });

    // Add cold drink ingredients
    Object.values(PIZZA_INGREDIENTS.coldDrinks || {}).forEach(drink => {
      Object.entries(drink.ingredients).forEach(([ingredient, data]) => {
        addIngredient(ingredient, data);
      });
    });

    let totalOrders = filteredOrders.length;
    let totalPizzas = 0;
    let totalDrinks = 0;

    // Calculate usage from orders
    filteredOrders.forEach(order => {
      // Process pizzas
      if (order.pizzas && Array.isArray(order.pizzas)) {
        order.pizzas.forEach(pizza => {
          const quantity = pizza.quantity || 1;
          totalPizzas += quantity;
          let pizzaType = pizza.pizzaType || pizza.type;
          
          if (!pizzaType) return;

          // Normalize pizza type
          pizzaType = pizzaType.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

          // Handle variations
          if (pizzaType.includes('Margherita') || pizzaType.includes('Margarita')) {
            pizzaType = 'Margherita';
          } else if (pizzaType.includes('Pepperoni')) {
            pizzaType = 'Pepperoni';
          } else if (pizzaType.includes('Vegetarian') || pizzaType.includes('Veggie')) {
            pizzaType = 'Vegetarian';
          }

          if (!PIZZA_INGREDIENTS.pizzas[pizzaType]) return;

          // Add base ingredients
          Object.entries(PIZZA_INGREDIENTS.base).forEach(([ingredient, data]) => {
            ingredients[ingredient].used += data.amount * quantity;
            ingredients[ingredient].cost += data.cost * data.amount * quantity;
          });

          // Add pizza-specific ingredients
          Object.entries(PIZZA_INGREDIENTS.pizzas[pizzaType].ingredients).forEach(([ingredient, data]) => {
            if (ingredients[ingredient]) {
              ingredients[ingredient].used += data.amount * quantity;
              ingredients[ingredient].cost += data.cost * data.amount * quantity;
            }
          });
        });
      }

      // Process cold drinks
      if (order.coldDrinks && Array.isArray(order.coldDrinks)) {
        order.coldDrinks.forEach(drink => {
          const drinkQuantity = drink.quantity || 1;
          totalDrinks += drinkQuantity;
          const drinkType = drink.drinkType;

          if (PIZZA_INGREDIENTS.coldDrinks && PIZZA_INGREDIENTS.coldDrinks[drinkType]) {
            Object.entries(PIZZA_INGREDIENTS.coldDrinks[drinkType].ingredients).forEach(([ingredient, data]) => {
              if (ingredients[ingredient]) {
                ingredients[ingredient].used += data.amount * drinkQuantity;
                ingredients[ingredient].cost += data.cost * data.amount * drinkQuantity;
              }
            });
          }
        });
      }
    });

    // Calculate category totals
    Object.entries(ingredients).forEach(([ingredient, data]) => {
      const category = data.category;
      if (!categories[category]) {
        categories[category] = {
          totalCost: 0,
          totalUsage: 0,
          items: []
        };
      }
      categories[category].totalCost += data.cost;
      categories[category].totalUsage += data.used;
      categories[category].items.push({
        name: ingredient,
        used: data.used,
        cost: data.cost,
        unit: data.unit
      });
    });

    const totalCost = Object.values(ingredients).reduce((sum, item) => sum + item.cost, 0);

    return {
      ingredients,
      totalCost,
      totalOrders,
      totalPizzas,
      totalDrinks,
      categories,
      timeRange
    };
  }, [filteredOrders, timeRange]);

  // Generate summary text
  const generateSummaryText = () => {
    const { totalOrders, totalPizzas, totalDrinks, totalCost, categories, ingredients } = usageStats;
    
    const timeRangeLabels = {
      'today': 'Today',
      'yesterday': 'Yesterday',
      'last7days': 'Last 7 Days',
      'last30days': 'Last 30 Days'
    };

    const period = timeRangeLabels[timeRange] || timeRange;
    const date = new Date().toLocaleDateString('en-ZA');

    let summary = `JOHN DOUGH'S SOURDOUGH PIZZERIA - INGREDIENT USAGE SUMMARY\n`;
    summary += `Generated: ${date}\n`;
    summary += `Period: ${period}\n`;
    summary += `=" + "=".repeat(60) + "\n\n`;
    
    summary += `OVERVIEW:\n`;
    summary += `Total Orders: ${totalOrders}\n`;
    summary += `Total Pizzas: ${totalPizzas}\n`;
    summary += `Total Cold Drinks: ${totalDrinks}\n`;
    summary += `Total Ingredient Cost: R${totalCost.toFixed(2)}\n\n`;

    // Category breakdown
    summary += `COST BY CATEGORY:\n`;
    Object.entries(categories)
      .sort(([,a], [,b]) => b.totalCost - a.totalCost)
      .forEach(([category, data]) => {
        summary += `${category.toUpperCase()}: R${data.totalCost.toFixed(2)}\n`;
      });
    summary += `\n`;

    if (summaryFormat === 'detailed') {
      // Top ingredients by cost
      summary += `TOP INGREDIENTS BY COST:\n`;
      Object.entries(ingredients)
        .filter(([,data]) => data.used > 0)
        .sort(([,a], [,b]) => b.cost - a.cost)
        .slice(0, 10)
        .forEach(([ingredient, data]) => {
          summary += `${ingredient.replace(/_/g, ' ').toUpperCase()}: ${data.used.toFixed(2)} ${data.unit} (R${data.cost.toFixed(2)})\n`;
        });
      summary += `\n`;

      // Reorder recommendations
      summary += `REORDER RECOMMENDATIONS:\n`;
      const lowStockItems = Object.entries(ingredients)
        .filter(([,data]) => data.used > 0)
        .sort(([,a], [,b]) => b.used - a.used)
        .slice(0, 15);
      
      lowStockItems.forEach(([ingredient, data]) => {
        const dailyUsage = timeRange === 'last7days' ? data.used / 7 : 
                          timeRange === 'last30days' ? data.used / 30 : data.used;
        const weeklyNeed = dailyUsage * 7;
        summary += `${ingredient.replace(/_/g, ' ').toUpperCase()}: ${weeklyNeed.toFixed(2)} ${data.unit} per week\n`;
      });
    }

    summary += `\n${"=".repeat(60)}\n`;
    summary += `Report generated by John Dough's Pizza Dashboard\n`;
    summary += `Linden, Johannesburg, South Africa\n`;

    return summary;
  };

  // Copy to clipboard functionality
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateSummaryText());
    alert('Summary copied to clipboard!');
  };

  // Email functionality (placeholder)
  const emailSummary = () => {
    const subject = encodeURIComponent(`Inventory Usage Summary - ${new Date().toLocaleDateString('en-ZA')}`);
    const body = encodeURIComponent(generateSummaryText());
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  if (!usageStats.totalOrders) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Inventory Usage Summary</h3>
        <p className="text-gray-600">No orders found for the selected time range.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Inventory Usage Summary</h3>
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 Days</option>
            <option value="last30days">Last 30 Days</option>
          </select>
          <select
            value={summaryFormat}
            onChange={(e) => setSummaryFormat(e.target.value)}
            className="border rounded px-3 py-1"
          >
            <option value="summary">Summary</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800">Total Orders</h4>
          <p className="text-2xl font-bold text-blue-600">{usageStats.totalOrders}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800">Pizzas Made</h4>
          <p className="text-2xl font-bold text-green-600">{usageStats.totalPizzas}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-semibold text-purple-800">Drinks Served</h4>
          <p className="text-2xl font-bold text-purple-600">{usageStats.totalDrinks}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h4 className="font-semibold text-orange-800">Total Cost</h4>
          <p className="text-2xl font-bold text-orange-600">R{usageStats.totalCost.toFixed(2)}</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="mb-6">
        <h4 className="font-semibold mb-3">Cost by Category</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(usageStats.categories)
            .sort(([,a], [,b]) => b.totalCost - a.totalCost)
            .map(([category, data]) => (
            <div key={category} className="border rounded-lg p-3">
              <h5 className="font-medium capitalize">{category.replace(/_/g, ' ')}</h5>
              <p className="text-lg font-semibold text-blue-600">R{data.totalCost.toFixed(2)}</p>
              <p className="text-sm text-gray-600">{data.items.length} items</p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={copyToClipboard}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          📋 Copy to Clipboard
        </button>
        <button
          onClick={emailSummary}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          📧 Email Summary
        </button>
        <button
          onClick={() => window.print()}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          🖨️ Print
        </button>
      </div>

      {/* Summary Preview */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-3">Summary Preview</h4>
        <pre className="text-sm whitespace-pre-wrap font-mono bg-white p-4 rounded border overflow-x-auto">
          {generateSummaryText()}
        </pre>
      </div>
    </div>
  );
};

export default InventoryUsageSummary;