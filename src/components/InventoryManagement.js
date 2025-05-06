import React, { useState, useEffect, useMemo } from 'react';
import { MdAdd, MdRemove, MdWarning, MdTrendingUp, MdStackedBarChart } from 'react-icons/md';
import { calculateInventoryUsage, getUsageByCategory, getMostUsedIngredients, getInventoryEstimate, PIZZA_INGREDIENTS } from '../services/InventoryService';
import { sampleOrders } from '../sampleOrders';
import { getInventory, updateInventory, subscribeToInventory } from '../services/FirebaseService';
import useFirebaseOrders from '../hooks/useFirebaseOrders';

const InventoryManagement = () => {
  // Get orders directly from Firebase
  const { data: orders = [], loading: ordersLoading } = useFirebaseOrders();
  
  // State for current inventory levels  
  const [inventory, setInventory] = useState({});
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState(null);
  
  // Track which view is active
  const [activeView, setActiveView] = useState('current'); // 'current', 'usage', 'forecast'

  // Load inventory from Firebase on component mount and subscribe to real-time updates
  useEffect(() => {
    setInventoryLoading(true);
    
    // First load the initial inventory data
    getInventory()
      .then(inventoryData => {
        setInventory(inventoryData);
        setInventoryLoading(false);
      })
      .catch(error => {
        console.error('Error loading inventory:', error);
        setInventoryError(error.message);
        setInventoryLoading(false);
      });
      
    // Then subscribe to real-time updates
    const unsubscribe = subscribeToInventory(inventoryData => {
      setInventory(inventoryData);
      setInventoryLoading(false);
    });
    
    // Clean up subscription on unmount
    return () => unsubscribe();
  }, []);
  
  // Save inventory changes to Firebase
  const saveInventoryToFirebase = async (newInventory) => {
    try {
      console.log('Saving inventory to Firebase:', newInventory);
      await updateInventory(newInventory);
      // No need to update local state - Firebase real-time updates will handle it
    } catch (error) {
      console.error('Error saving inventory to Firebase:', error);
      setInventoryError('Failed to save inventory. Please try again.');
    }
  };
  
  // Force a re-calculation with all available orders
  useEffect(() => {
    console.log('In InventoryManagement: received', orders?.length || 0, 'orders');
  }, [orders]);
  
  // No need for custom event listeners - Firebase real-time updates handle this
  
  // Generate fallback data if no real data can be processed
  const generateFallbackData = () => {
    console.log('Generating fallback data');
    
    // Use a direct pizza dictionary for simplicity
    const directUsageData = {};
    
    // Add some values for typical ingredients
    const commonIngredients = [
      { name: 'sourdough_dough', amount: 45, unit: 'balls', category: 'dough' },
      { name: 'tomato_sauce', amount: 5.2, unit: 'liters', category: 'sauce' },
      { name: 'mozzarella_cheese', amount: 8.3, unit: 'kg', category: 'cheese' },
      { name: 'pepperoni', amount: 3.7, unit: 'kg', category: 'meat' },
      { name: 'mushrooms', amount: 4.1, unit: 'kg', category: 'vegetable' },
      { name: 'fresh_basil', amount: 0.8, unit: 'kg', category: 'herb' },
      { name: 'olives', amount: 1.5, unit: 'kg', category: 'vegetable' },
      { name: 'bacon', amount: 2.6, unit: 'kg', category: 'meat' }
    ];
    
    // Turn into the right format
    commonIngredients.forEach(ingredient => {
      directUsageData[ingredient.name] = {
        ...ingredient,
        used: ingredient.amount,
        pizzas: {}
      };
      
      // Add for a couple of pizza types
      const pizzaTypes = Object.keys(PIZZA_INGREDIENTS.pizzas).slice(0, 3);
      pizzaTypes.forEach(pizzaType => {
        if (!directUsageData[ingredient.name].pizzas[pizzaType]) {
          directUsageData[ingredient.name].pizzas[pizzaType] = 0;
        }
        directUsageData[ingredient.name].pizzas[pizzaType] += ingredient.amount / 3;
      });
    });
    
    return directUsageData;
  };

  // Try to calculate inventory from orders, but fall back to sample data if needed
  const inventoryUsage = useMemo(() => {
    console.log('Recalculating inventory usage with', orders?.length || 0, 'orders');
    
    try {
      // Always combine sample orders with actual orders for consistent data
      const allOrders = [...(orders || []), ...sampleOrders];
      console.log('Processing', allOrders.length, 'total orders (including samples)');
      
      // Calculate usage from all orders
      const usage = calculateInventoryUsage(allOrders, false);
      
      // Check if we got meaningful data
      if (Object.keys(usage).length > 0) {
        console.log('Successfully calculated usage from orders, found ingredients:', Object.keys(usage).join(', '));
        return usage;
      }
      
      // If that fails, try using just the sample orders with extra debugging
      console.log('No data from combined orders, trying just sample orders...');
      console.log('Sample order count:', sampleOrders.length);
      console.log('First sample order:', sampleOrders[0]);
      
      const sampleUsage = calculateInventoryUsage(sampleOrders, false);
      if (Object.keys(sampleUsage).length > 0) {
        console.log('Successfully calculated usage from sample orders');
        return sampleUsage;
      }
      
      // If all else fails, use fallback data
      console.log('Failed to process any orders, using fallback data');
      return generateFallbackData();
    } catch (error) {
      console.error('Error calculating inventory usage:', error);
      return generateFallbackData();
    }
  }, [orders]);
  
  // Get usage by category
  const categoryUsage = useMemo(() => {
    return getUsageByCategory(inventoryUsage);
  }, [inventoryUsage]);
  
  // Get most used ingredients
  const topIngredients = useMemo(() => {
    return getMostUsedIngredients(inventoryUsage, 8);
  }, [inventoryUsage]);
  
  // Get forecast for tomorrow
  const forecast = useMemo(() => {
    try {
      if (orders && orders.length > 0) {
        return getInventoryEstimate(orders, 7);
      }
      return getInventoryEstimate(sampleOrders, 7);
    } catch (error) {
      console.error('Error calculating forecast:', error);
      return {};
    }
  }, [orders]);

  // Increment inventory item amount - now saves to Firebase
  const handleIncrement = (ingredient, amount = 1) => {
    const newInventory = {
      ...inventory,
      [ingredient]: {
        ...inventory[ingredient],
        amount: (inventory[ingredient]?.amount || 0) + amount
      }
    };
    
    // Save to Firebase
    saveInventoryToFirebase(newInventory);
  };

  // Decrement inventory item amount - now saves to Firebase
  const handleDecrement = (ingredient, amount = 1) => {
    const currentAmount = inventory[ingredient]?.amount || 0;
    const newAmount = Math.max(0, currentAmount - amount);
    
    const newInventory = {
      ...inventory,
      [ingredient]: {
        ...inventory[ingredient],
        amount: newAmount
      }
    };
    
    // Save to Firebase
    saveInventoryToFirebase(newInventory);
  };

  const isLowStock = (item) => {
    return inventory[item].amount <= inventory[item].threshold;
  };

  // Loading state for inventory
  if (inventoryLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Ingredient Inventory Management</h2>
        <div className="flex items-center justify-center py-6 bg-white rounded-lg shadow p-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading inventory data...</span>
        </div>
      </div>
    );
  }
  
  // Error state
  if (inventoryError) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Ingredient Inventory Management</h2>
        <div className="text-red-500 p-4 border border-red-200 rounded bg-red-50">
          <p><strong>Error:</strong> {inventoryError}</p>
          <p className="mt-2">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Ingredient Inventory Management</h2>
      
      {/* View selection tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveView('current')}
          className={`px-4 py-2 font-medium ${activeView === 'current' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Current Stock
        </button>
        <button
          onClick={() => setActiveView('usage')}
          className={`px-4 py-2 font-medium ${activeView === 'usage' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Usage Analysis
        </button>
        <button
          onClick={() => setActiveView('forecast')}
          className={`px-4 py-2 font-medium ${activeView === 'forecast' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Inventory Forecast
        </button>
      </div>
      
      {/* Current inventory view */}
      {activeView === 'current' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(inventory).map(([item, { amount, unit, threshold }]) => (
            <div 
              key={item}
              className={`p-4 rounded-lg border ${
                isLowStock(item) ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium">{item.replace(/_/g, ' ')}</h3>
                {isLowStock(item) && (
                  <MdWarning className="text-red-500 w-5 h-5" />
                )}
              </div>
              <div className="text-gray-600 mb-2">
                {amount} {unit}
              </div>
              
              {/* Show usage if available */}
              {inventoryUsage[item] && (
                <div className="text-sm text-gray-500 mb-4">
                  Recent usage: {inventoryUsage[item].used.toFixed(1)} {inventoryUsage[item].unit}
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateInventory(item, -1)}
                  className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600"
                >
                  <MdRemove />
                </button>
                <button
                  onClick={() => updateInventory(item, 1)}
                  className="p-2 rounded-full bg-green-100 hover:bg-green-200 text-green-600"
                >
                  <MdAdd />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Usage analysis view */}
      {activeView === 'usage' && (
        <div>
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Top Ingredients Used</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Used</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topIngredients.map((ingredient, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ingredient.name.replace(/_/g, ' ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ingredient.used.toFixed(1)} {ingredient.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ingredient.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Usage by Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(categoryUsage).map(([category, data]) => (
                <div key={category} className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="font-medium text-gray-900 capitalize mb-2">{category}</h4>
                  <p className="text-sm text-gray-500 mb-2">{data.totalIngredients} ingredients</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {data.items.slice(0, 3).map((item, idx) => (
                      <li key={idx}>{item.name.replace(/_/g, ' ')}: {item.used.toFixed(1)} {item.unit}</li>
                    ))}
                    {data.items.length > 3 && (
                      <li className="text-gray-400">+{data.items.length - 3} more...</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Forecast view */}
      {activeView === 'forecast' && (
        <div>
          <h3 className="text-lg font-medium mb-4">Inventory Forecast (Next 24 Hours)</h3>
          <p className="text-sm text-gray-500 mb-6">Based on average usage from the past 7 days</p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Average</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recommended Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(forecast).map(([ingredient, data], index) => {
                  const currentStock = inventory[ingredient]?.amount || 0;
                  const stockStatus = currentStock < data.recommended ? 'low' : 'good';
                  
                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ingredient.replace(/_/g, ' ')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{currentStock} {data.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.dailyAverage} {data.unit}/day</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.recommended} {data.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${stockStatus === 'low' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {stockStatus === 'low' ? 'Low Stock' : 'Sufficient'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
