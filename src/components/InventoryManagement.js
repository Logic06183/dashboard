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
  const [activeView, setActiveView] = useState('current'); // 'current', 'usage', 'forecast'
  
  // Calculate usage and forecast data
  const usageData = useMemo(() => calculateInventoryUsage(orders), [orders]);
  const inventoryByCategory = useMemo(() => getUsageByCategory(usageData), [usageData]);
  const inventoryForecast = useMemo(() => getInventoryEstimate(orders), [orders]);
  
  // Load inventory from Firebase on component mount
  useEffect(() => {
    setInventoryLoading(true);
    
    // First load the initial inventory data
    getInventory()
      .then(inventoryData => {
        // Initialize any missing ingredients from PIZZA_INGREDIENTS
        const fullInventory = { ...inventoryData };
        Object.entries(PIZZA_INGREDIENTS.base).forEach(([ingredient, details]) => {
          if (!fullInventory[ingredient]) {
            fullInventory[ingredient] = {
              amount: 0,
              unit: details.unit,
              category: details.category,
              name: ingredient.replace(/_/g, ' ')
            };
          }
        });
        Object.values(PIZZA_INGREDIENTS.pizzas).forEach(pizza => {
          Object.entries(pizza.ingredients).forEach(([ingredient, details]) => {
            if (!fullInventory[ingredient]) {
              fullInventory[ingredient] = {
                amount: 0,
                unit: details.unit,
                category: details.category,
                name: ingredient.replace(/_/g, ' ')
              };
            }
          });
        });
        setInventory(fullInventory);
        setInventoryLoading(false);
      })
      .catch(error => {
        console.error('Error loading inventory:', error);
        setInventoryError(error.message);
        setInventoryLoading(false);
      });
      
    // Subscribe to real-time updates
    const unsubscribe = subscribeToInventory(inventoryData => {
      setInventory(prev => {
        const newInventory = { ...prev, ...inventoryData };
        // Check for low stock and trigger warnings
        Object.entries(newInventory).forEach(([ingredient, data]) => {
          if (isLowStock(data)) {
            console.warn(`Low stock alert: ${data.name} (${data.amount} ${data.unit})`);          }
        });
        return newInventory;
      });
    });
    
    return () => unsubscribe();
  }, []);

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

      {/* Loading state */}
      {inventoryLoading && (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading inventory data...</p>
        </div>
      )}
      
      {/* Error state */}
      {inventoryError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{inventoryError}</p>
        </div>
      )}
      
      {/* View selector */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200">
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
      {/* Main content area */}
      {activeView === 'current' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">Current Stock Levels</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Table rows will go here */}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
        Usage Analysis
      </button>
      <button
        onClick={() => setActiveView('forecast')}
        className={`px-4 py-2 font-medium ${activeView === 'forecast' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
      >
        Inventory Forecast
      </button>
    </div>

    {/* Main content area */}
    {!inventoryLoading && !inventoryError && (
      <div className="space-y-6">
        {/* Current stock view */}
        {activeView === 'current' && (
          <div>
            <h3 className="text-lg font-medium mb-4">Current Stock Levels</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingredient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
