/**
 * SimpleInventoryInput.js
 * User-friendly inventory input interface with click-to-increase/decrease
 */

import React, { useState, useEffect } from 'react';
import { PIZZA_INGREDIENTS } from '../data/ingredients';

const SimpleInventoryInput = ({ currentInventory, onSave, onClose }) => {
  const [inventory, setInventory] = useState({});
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize inventory with all ingredients
  useEffect(() => {
    const allIngredients = new Set();
    
    // Add base ingredients
    Object.keys(PIZZA_INGREDIENTS.base).forEach(ingredient => {
      allIngredients.add(ingredient);
    });
    
    // Add pizza-specific ingredients
    Object.values(PIZZA_INGREDIENTS.pizzas).forEach(pizza => {
      if (pizza.ingredients) {
        Object.keys(pizza.ingredients).forEach(ingredient => {
          allIngredients.add(ingredient);
        });
      }
    });
    
    // Add cold drink ingredients
    if (PIZZA_INGREDIENTS.coldDrinks) {
      Object.values(PIZZA_INGREDIENTS.coldDrinks).forEach(drink => {
        if (drink.ingredients) {
          Object.keys(drink.ingredients).forEach(ingredient => {
            allIngredients.add(ingredient);
          });
        }
      });
    }

    // Initialize inventory state
    const inventoryState = {};
    allIngredients.forEach(ingredient => {
      const current = currentInventory[ingredient];
      const ingredientData = getIngredientData(ingredient);
      
      inventoryState[ingredient] = {
        amount: current?.amount || 0,
        unit: current?.unit || ingredientData.unit,
        category: current?.category || ingredientData.category,
        threshold: current?.threshold || ingredientData.threshold || 10
      };
    });
    
    setInventory(inventoryState);
  }, [currentInventory]);

  // Get ingredient data from the recipes
  const getIngredientData = (ingredient) => {
    // Check base ingredients first
    if (PIZZA_INGREDIENTS.base[ingredient]) {
      return PIZZA_INGREDIENTS.base[ingredient];
    }
    
    // Check pizza ingredients
    for (const pizza of Object.values(PIZZA_INGREDIENTS.pizzas)) {
      if (pizza.ingredients && pizza.ingredients[ingredient]) {
        return pizza.ingredients[ingredient];
      }
    }
    
    // Check cold drink ingredients
    if (PIZZA_INGREDIENTS.coldDrinks) {
      for (const drink of Object.values(PIZZA_INGREDIENTS.coldDrinks)) {
        if (drink.ingredients && drink.ingredients[ingredient]) {
          return drink.ingredients[ingredient];
        }
      }
    }
    
    // Default values
    return {
      unit: 'g',
      category: 'other',
      threshold: 10
    };
  };

  // Adjust ingredient amount
  const adjustAmount = (ingredient, delta) => {
    setInventory(prev => ({
      ...prev,
      [ingredient]: {
        ...prev[ingredient],
        amount: Math.max(0, prev[ingredient].amount + delta)
      }
    }));
  };

  // Set specific amount
  const setAmount = (ingredient, amount) => {
    setInventory(prev => ({
      ...prev,
      [ingredient]: {
        ...prev[ingredient],
        amount: Math.max(0, amount)
      }
    }));
  };

  // Get categories
  const categories = ['all', ...new Set(Object.values(inventory).map(item => item.category))];

  // Filter ingredients
  const filteredIngredients = Object.entries(inventory).filter(([ingredient, data]) => {
    const matchesCategory = filter === 'all' || data.category === filter;
    const matchesSearch = !searchTerm || 
      ingredient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingredient.replace(/_/g, ' ').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort by category, then by name
  const sortedIngredients = filteredIngredients.sort(([a, dataA], [b, dataB]) => {
    if (dataA.category !== dataB.category) {
      return dataA.category.localeCompare(dataB.category);
    }
    return a.localeCompare(b);
  });

  // Format ingredient name for display
  const formatName = (ingredient) => {
    return ingredient.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get status color based on stock level
  const getStatusColor = (ingredient, data) => {
    if (data.amount === 0) return 'text-red-600 bg-red-50';
    if (data.amount <= data.threshold) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  // Save inventory
  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(inventory);
    } catch (error) {
      console.error('Error saving inventory:', error);
    } finally {
      setSaving(false);
    }
  };

  // Quick set buttons for common amounts
  const getQuickSetAmounts = (ingredient, unit) => {
    if (unit === 'balls') return [0, 10, 20, 50];
    if (unit === 'ml' || unit === 'L') return [0, 500, 1000, 2000];
    if (unit === 'g' || unit === 'kg') return [0, 100, 500, 1000];
    return [0, 10, 50, 100];
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">📦 Update Current Stock Levels</h2>
        <p className="text-gray-600">
          Use the + and - buttons to update how much you currently have in stock. 
          The system will track usage automatically.
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-sm font-medium mb-1">Category:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Items' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Search:</label>
          <input
            type="text"
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="text-sm text-gray-600">
          Showing {sortedIngredients.length} items
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {sortedIngredients.map(([ingredient, data]) => (
          <div key={ingredient} className={`border rounded-lg p-4 ${getStatusColor(ingredient, data)}`}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium">{formatName(ingredient)}</h3>
                <p className="text-sm opacity-75 capitalize">{data.category}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">
                  {data.amount} {data.unit}
                </div>
                <div className="text-xs opacity-75">
                  Low: {data.threshold} {data.unit}
                </div>
              </div>
            </div>

            {/* Amount Controls */}
            <div className="space-y-3">
              {/* Large Adjustment Buttons */}
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => adjustAmount(ingredient, -100)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium"
                  disabled={data.amount === 0}
                >
                  -100
                </button>
                <button
                  onClick={() => adjustAmount(ingredient, -10)}
                  className="px-3 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 font-medium"
                  disabled={data.amount === 0}
                >
                  -10
                </button>
                <button
                  onClick={() => adjustAmount(ingredient, -1)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-medium"
                  disabled={data.amount === 0}
                >
                  -1
                </button>
                <button
                  onClick={() => adjustAmount(ingredient, 1)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 font-medium"
                >
                  +1
                </button>
                <button
                  onClick={() => adjustAmount(ingredient, 10)}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 font-medium"
                >
                  +10
                </button>
                <button
                  onClick={() => adjustAmount(ingredient, 100)}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-medium"
                >
                  +100
                </button>
              </div>

              {/* Quick Set Buttons */}
              <div>
                <p className="text-xs text-center mb-1 opacity-75">Quick Set:</p>
                <div className="flex justify-center space-x-1">
                  {getQuickSetAmounts(ingredient, data.unit).map(amount => (
                    <button
                      key={amount}
                      onClick={() => setAmount(ingredient, amount)}
                      className={`px-2 py-1 text-xs rounded ${
                        data.amount === amount 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Input */}
              <div>
                <input
                  type="number"
                  min="0"
                  value={data.amount}
                  onChange={(e) => setAmount(ingredient, parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1 text-center border rounded focus:ring-1 focus:ring-blue-500 bg-white"
                  placeholder="Enter amount"
                />
              </div>
            </div>

            {/* Status Indicator */}
            <div className="mt-2 text-center">
              {data.amount === 0 && (
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                  🚨 OUT OF STOCK
                </span>
              )}
              {data.amount > 0 && data.amount <= data.threshold && (
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                  ⚠️ LOW STOCK
                </span>
              )}
              {data.amount > data.threshold && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  ✅ GOOD STOCK
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium mb-2">📊 Stock Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-red-600">
              {Object.values(inventory).filter(item => item.amount === 0).length}
            </div>
            <div className="text-sm text-gray-600">Out of Stock</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-600">
              {Object.values(inventory).filter(item => item.amount > 0 && item.amount <= item.threshold).length}
            </div>
            <div className="text-sm text-gray-600">Low Stock</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {Object.values(inventory).filter(item => item.amount > item.threshold).length}
            </div>
            <div className="text-sm text-gray-600">Good Stock</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">
              R{Object.entries(inventory).reduce((total, [ingredient, data]) => {
                const cost = getIngredientData(ingredient).cost || 0.01;
                return total + (data.amount * cost);
              }, 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total Value</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
};

export default SimpleInventoryInput;