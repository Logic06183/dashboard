import React, { useState, useEffect, useMemo } from 'react';
import useFirebaseOrders from '../hooks/useFirebaseOrders';
import { PIZZA_INGREDIENTS } from '../data/ingredients';
import { db, firebase } from '../firebase';
import FirebaseService from '../services/FirebaseService';
import InventoryManagerDashboard from './InventoryManagerDashboard';

// UsageAnalysis component to calculate ingredient usage based on orders
const UsageAnalysis = ({ orders }) => {
  const [timeRange, setTimeRange] = useState('today');
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Force a re-render when time range changes
  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
    setForceUpdate(prev => prev + 1); // Force re-render
  };
  
  // Debug: Log the orders we received
  useEffect(() => {
    console.log('Orders received in UsageAnalysis:', orders);
    if (orders && orders.length > 0) {
      console.log('Sample order:', orders[0]);
      if (orders[0].pizzas) {
        console.log('Sample pizza:', orders[0].pizzas[0]);
      }
    }
  }, [orders]);
  
  // Filter orders based on selected time range
  const filteredOrders = useMemo(() => {
    console.log('Filtering orders for time range:', timeRange); 
    console.log('Total orders available:', orders?.length || 0);
    
    if (!orders || orders.length === 0) {
      console.log('No orders available');
      return [];
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const filtered = orders.filter(order => {
      // Handle different date formats from Firebase
      let orderDate;
      if (order.orderTime) {
        orderDate = new Date(order.orderTime);
      } else if (order.createdAt) {
        orderDate = new Date(order.createdAt);
      } else if (order.timestamp) {
        // Firebase timestamp can be a number
        orderDate = new Date(typeof order.timestamp === 'number' ? order.timestamp : order.timestamp.toDate?.());
      } else {
        console.log('Order has no date information:', order);
        return false;
      }
      
      if (isNaN(orderDate.getTime())) {
        console.log('Invalid date for order:', order);
        return false;
      }
      
      switch (timeRange) {
        case 'today':
          return orderDate >= today;
        case 'yesterday':
          return orderDate >= yesterday && orderDate < today;
        case 'last7days':
          return orderDate >= lastWeek;
        case 'last30days':
          return orderDate >= lastMonth;
        case 'alltime':
          return true;
        default:
          return true;
      }
    });
    
    console.log(`Filtered orders for ${timeRange}:`, filtered.length);
    return filtered;
  }, [orders, timeRange, forceUpdate]);
  
  // Calculate daily average usage for each ingredient
  const calculateDailyUsage = (usage, days) => {
    if (days <= 0) return usage;
    const dailyUsage = {};
    Object.entries(usage).forEach(([ingredient, data]) => {
      dailyUsage[ingredient] = {
        ...data,
        used: data.used / days
      };
    });
    return dailyUsage;
  };
  
  // Calculate ingredient usage based on filtered orders
  const ingredientUsage = useMemo(() => {
    console.log('Recalculating ingredient usage...');
    
    if (!filteredOrders || filteredOrders.length === 0) {
      console.log('No filtered orders available');
      return {};
    }
    
    // Process orders to get usage
    const usage = {};
    
    // Initialize with all ingredients
    const allIngredients = new Set();
    Object.keys(PIZZA_INGREDIENTS.base).forEach(ingredient => {
      allIngredients.add(ingredient);
    });
    Object.values(PIZZA_INGREDIENTS.pizzas).forEach(pizza => {
      Object.keys(pizza.ingredients).forEach(ingredient => {
        allIngredients.add(ingredient);
      });
    });
    // Add cold drink ingredients
    Object.values(PIZZA_INGREDIENTS.coldDrinks || {}).forEach(drink => {
      Object.keys(drink.ingredients).forEach(ingredient => {
        allIngredients.add(ingredient);
      });
    });
    
    allIngredients.forEach(ingredient => {
      usage[ingredient] = { used: 0, unit: '', category: '' };
    });
    
    // Calculate usage from orders
    filteredOrders.forEach(order => {
      if (!order.pizzas || !Array.isArray(order.pizzas)) return;
      
      order.pizzas.forEach(pizza => {
        const quantity = pizza.quantity || 1;
        let pizzaType = pizza.pizzaType || pizza.type;
        
        if (!pizzaType) return;
        
        // Convert to title case
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
        } else if (pizzaType.includes('Hawaiian')) {
          pizzaType = 'Hawaiian';
        } else if (pizzaType.includes('Meat') && (pizzaType.includes('Lover') || pizzaType.includes('Feast'))) {
          pizzaType = 'Meat Lovers';
        } else if (pizzaType.includes('Mushroom') && pizzaType.includes('Cloud')) {
          pizzaType = 'Mushroom Cloud Pizza';
        } else if (pizzaType.includes('Champ')) {
          pizzaType = 'The Champ';
        } else if (pizzaType.includes('Sourdough') && pizzaType.includes('Special')) {
          pizzaType = 'Sourdough Special';
        } else if (pizzaType.includes('Vegan')) {
          pizzaType = 'Vegan Delight';
        }
        
        if (!PIZZA_INGREDIENTS.pizzas[pizzaType]) return;
        
        // Add base ingredients
        Object.entries(PIZZA_INGREDIENTS.base).forEach(([ingredient, data]) => {
          if (!usage[ingredient]) {
            usage[ingredient] = { used: 0, unit: data.unit, category: data.category };
          }
          usage[ingredient].used += data.amount * quantity;
          usage[ingredient].unit = data.unit;
          usage[ingredient].category = data.category;
        });
        
        // Add pizza-specific ingredients
        Object.entries(PIZZA_INGREDIENTS.pizzas[pizzaType].ingredients).forEach(([ingredient, data]) => {
          if (!usage[ingredient]) {
            usage[ingredient] = { used: 0, unit: data.unit, category: data.category };
          }
          usage[ingredient].used += data.amount * quantity;
          usage[ingredient].unit = data.unit;
          usage[ingredient].category = data.category;
        });
      });
      
      // Process cold drinks
      if (order.coldDrinks && Array.isArray(order.coldDrinks)) {
        order.coldDrinks.forEach(drink => {
          const drinkQuantity = drink.quantity || 1;
          const drinkType = drink.drinkType;
          
          if (PIZZA_INGREDIENTS.coldDrinks && PIZZA_INGREDIENTS.coldDrinks[drinkType]) {
            Object.entries(PIZZA_INGREDIENTS.coldDrinks[drinkType].ingredients).forEach(([ingredient, data]) => {
              if (!usage[ingredient]) {
                usage[ingredient] = { used: 0, unit: data.unit, category: data.category };
              }
              usage[ingredient].used += data.amount * drinkQuantity;
              usage[ingredient].unit = data.unit;
              usage[ingredient].category = data.category;
            });
          }
        });
      }
    });
    
    // Calculate daily usage based on time range
    let days = 1;
    switch (timeRange) {
      case 'yesterday':
        days = 1;
        break;
      case 'last7days':
        days = 7;
        break;
      case 'last30days':
        days = 30;
        break;
      case 'alltime':
        // Estimate days based on oldest order
        if (filteredOrders.length > 0) {
          const now = new Date();
          let oldestDate = now;
          
          filteredOrders.forEach(order => {
            let orderDate;
            if (order.orderTime) {
              orderDate = new Date(order.orderTime);
            } else if (order.createdAt) {
              orderDate = new Date(order.createdAt);
            } else if (order.timestamp) {
              orderDate = new Date(typeof order.timestamp === 'number' ? order.timestamp : order.timestamp.toDate?.());
            }
            
            if (orderDate && orderDate < oldestDate) {
              oldestDate = orderDate;
            }
          });
          
          const diffTime = Math.abs(now - oldestDate);
          days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          days = Math.max(1, days);
        }
        break;
      default:
        days = 1;
    }
    
    // For daily average, divide by number of days
    if (days > 1) {
      return calculateDailyUsage(usage, days);
    }
    
    return usage;
  }, [filteredOrders, timeRange]);
  
  return (
    <div>
      <div className="mb-4">
        <div className="flex space-x-2">
          <button 
            onClick={() => handleTimeRangeChange('today')}
            className={`px-3 py-1 rounded ${timeRange === 'today' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
          >
            Today
          </button>
          <button 
            onClick={() => handleTimeRangeChange('yesterday')}
            className={`px-3 py-1 rounded ${timeRange === 'yesterday' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
          >
            Yesterday
          </button>
          <button 
            onClick={() => handleTimeRangeChange('last7days')}
            className={`px-3 py-1 rounded ${timeRange === 'last7days' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
          >
            Last 7 Days
          </button>
          <button 
            onClick={() => handleTimeRangeChange('last30days')}
            className={`px-3 py-1 rounded ${timeRange === 'last30days' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
          >
            Last 30 Days
          </button>
          <button 
            onClick={() => handleTimeRangeChange('alltime')}
            className={`px-3 py-1 rounded ${timeRange === 'alltime' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
          >
            All Time
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 border-b">Ingredient</th>
              <th className="text-left p-3 border-b">Category</th>
              <th className="text-left p-3 border-b">Amount Used</th>
              <th className="text-left p-3 border-b">Unit</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(ingredientUsage)
              .sort(([a], [b]) => a.localeCompare(b)) // Sort alphabetically
              .map(([ingredient, data]) => (
              <tr key={ingredient} className="hover:bg-gray-50">
                <td className="p-3 border-b capitalize">{ingredient.replace(/_/g, ' ')}</td>
                <td className="p-3 border-b capitalize">{data.category}</td>
                <td className="p-3 border-b">{data.used.toFixed(2)}</td>
                <td className="p-3 border-b">{data.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Main InventoryManagement component
const InventoryManagement = ({ orders: propOrders = [] }) => {
  const [activeView, setActiveView] = useState('usage');
  const [inventory, setInventory] = useState({});
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [editingThreshold, setEditingThreshold] = useState(null);
  const [thresholdValue, setThresholdValue] = useState('');
  const [editingAmount, setEditingAmount] = useState(null);
  const [amountValue, setAmountValue] = useState('');
  const [customAmount, setCustomAmount] = useState(1);
  const [showLowStockNotification, setShowLowStockNotification] = useState(false);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [forecastDays, setForecastDays] = useState(7);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [bulkUpdateData, setBulkUpdateData] = useState({});
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());
  const [stockHistory, setStockHistory] = useState([]);
  
  // Get orders from Firebase
  const { data: firebaseOrders = [], loading: ordersLoading } = useFirebaseOrders();
  
  // Combine prop orders and Firebase orders
  const orders = useMemo(() => {
    return [...propOrders, ...firebaseOrders];
  }, [propOrders, firebaseOrders]);
  
  // Load stock history from localStorage
  useEffect(() => {
    try {
      const savedHistory = JSON.parse(localStorage.getItem('stockHistory') || '[]');
      setStockHistory(savedHistory);
    } catch (error) {
      console.error('Error loading stock history:', error);
    }
  }, []);
  
  // Load inventory data
  useEffect(() => {
    const loadInventory = async () => {
      try {
        setInventoryLoading(true);
        setInventoryError(null);
        console.log('Starting inventory load from Firebase...');

        // Get inventory data using FirebaseService
        const inventoryData = await FirebaseService.getInventory();

        console.log('Loaded inventory data from Firebase:', inventoryData);
        console.log('Number of ingredients loaded:', Object.keys(inventoryData).length);

        // Note: If inventory is empty, that's fine - the analytics will show no data
        // Staff should use the Daily Stock Entry page (/stock) to add initial inventory
        
        // Debug - ensure amount is a number for all items
        Object.entries(inventoryData).forEach(([ingredient, data]) => {
          if (typeof data.amount !== 'number') {
            console.warn(`Converting amount for ${ingredient} from ${typeof data.amount} to number`);
            // Convert to number or default to 0
            inventoryData[ingredient].amount = Number(data.amount) || 0;
          }
        });
        
        console.log('Final inventory data to be set:', inventoryData);
        console.log('Final ingredient count:', Object.keys(inventoryData).length);
        
        setInventory(inventoryData);
        setInventoryLoading(false);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        setInventoryError(error.message);
        setInventoryLoading(false);
      }
    };
    
    loadInventory();
  }, []);

  // Save inventory data to Firebase
  const saveInventoryToFirebase = async () => {
    try {
      setSaveStatus('Saving inventory...');

      // Update inventory using FirebaseService
      await FirebaseService.updateInventory(inventory);

      setSaveStatus('Inventory saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving inventory:', error);
      setSaveStatus(`Error: ${error.message}`);
    }
  };
  
  // Check if stock is low
  const isLowStock = (ingredient) => {
    const item = inventory[ingredient];
    return item && item.amount <= (item.threshold || 0);
  };
  
  // Calculate total inventory cost
  const calculateInventoryCost = () => {
    let totalCost = 0;
    console.log('Calculating inventory cost. Inventory:', inventory);
    
    Object.entries(inventory).forEach(([ingredient, data]) => {
      // Get cost per unit from PIZZA_INGREDIENTS
      let costPerUnit = 0;
      console.log(`Processing ingredient: ${ingredient}, data:`, data);
      
      // Check base ingredients
      if (PIZZA_INGREDIENTS.base[ingredient]) {
        costPerUnit = PIZZA_INGREDIENTS.base[ingredient].cost || 0;
        console.log(`Found in base ingredients. Cost per unit: ${costPerUnit}`);
      } else {
        // Check pizza-specific ingredients
        for (const pizza of Object.values(PIZZA_INGREDIENTS.pizzas)) {
          if (pizza.ingredients && pizza.ingredients[ingredient]) {
            costPerUnit = pizza.ingredients[ingredient].cost || 0;
            console.log(`Found in pizza ingredients. Cost per unit: ${costPerUnit}`);
            break;
          }
        }
        
        // Check cold drink ingredients if not found yet
        if (costPerUnit === 0 && PIZZA_INGREDIENTS.coldDrinks) {
          for (const drink of Object.values(PIZZA_INGREDIENTS.coldDrinks)) {
            if (drink.ingredients && drink.ingredients[ingredient]) {
              costPerUnit = drink.ingredients[ingredient].cost || 0;
              console.log(`Found in cold drink ingredients. Cost per unit: ${costPerUnit}`);
              break;
            }
          }
        }
      }
      
      // Check if data.amount is a valid number
      const amount = typeof data.amount === 'number' ? data.amount : 0;
      
      // Calculate cost for this ingredient
      const ingredientCost = amount * costPerUnit;
      console.log(`Ingredient cost calculation: ${amount} * ${costPerUnit} = ${ingredientCost}`);
      totalCost += ingredientCost;
    });
    
    console.log(`Total inventory cost: ${totalCost}`);
    return isNaN(totalCost) ? '0.00' : totalCost.toFixed(2);
  };
  
  // Check for low stock items and update notification
  useEffect(() => {
    const lowItems = Object.entries(inventory)
      .filter(([ingredient, data]) => isLowStock(ingredient))
      .map(([ingredient, data]) => ({
        name: ingredient,
        amount: data.amount,
        threshold: data.threshold || 0,
        unit: data.unit
      }));
    
    setLowStockItems(lowItems);
    setShowLowStockNotification(lowItems.length > 0);
  }, [inventory]);

  // Increment inventory item amount
  const handleIncrement = (ingredient, amount = 1) => {
    const oldAmount = inventory[ingredient]?.amount || 0;
    const newAmount = oldAmount + amount;
    
    logStockChange(ingredient, oldAmount, newAmount, 'increment');
    
    setInventory(prev => ({
      ...prev,
      [ingredient]: {
        ...prev[ingredient],
        amount: newAmount
      }
    }));
  };

  // Decrement inventory item amount
  const handleDecrement = (ingredient, amount = 1) => {
    const oldAmount = inventory[ingredient]?.amount || 0;
    const newAmount = Math.max(0, oldAmount - amount);
    
    logStockChange(ingredient, oldAmount, newAmount, 'decrement');
    
    setInventory(prev => ({
      ...prev,
      [ingredient]: {
        ...prev[ingredient],
        amount: newAmount
      }
    }));
  };
  
  // Start editing threshold
  const startEditingThreshold = (ingredient) => {
    setEditingThreshold(ingredient);
    setThresholdValue(inventory[ingredient]?.threshold?.toString() || '10');
  };
  
  // Save threshold
  const saveThreshold = (ingredient) => {
    const threshold = parseInt(thresholdValue, 10);
    if (!isNaN(threshold) && threshold >= 0) {
      setInventory(prev => ({
        ...prev,
        [ingredient]: {
          ...prev[ingredient],
          threshold
        }
      }));
    }
    setEditingThreshold(null);
  };
  
  // Start editing amount
  const startEditingAmount = (ingredient) => {
    setEditingAmount(ingredient);
    setAmountValue(inventory[ingredient]?.amount?.toString() || '0');
  };
  
  // Save amount
  const saveAmount = (ingredient) => {
    const amount = parseInt(amountValue, 10);
    if (!isNaN(amount) && amount >= 0) {
      // Log stock change
      logStockChange(ingredient, inventory[ingredient]?.amount || 0, amount, 'manual_update');
      
      setInventory(prev => ({
        ...prev,
        [ingredient]: {
          ...prev[ingredient],
          amount
        }
      }));
    }
    setEditingAmount(null);
  };
  
  // Log stock changes for history tracking
  const logStockChange = (ingredient, oldAmount, newAmount, changeType, user = 'Team Member') => {
    const change = {
      ingredient,
      oldAmount,
      newAmount,
      difference: newAmount - oldAmount,
      changeType, // 'manual_update', 'increment', 'decrement', 'bulk_update', 'usage_deduction'
      user,
      timestamp: new Date().toISOString()
    };
    
    setStockHistory(prev => [change, ...prev].slice(0, 100)); // Keep last 100 changes
    
    // Also save to localStorage for persistence
    try {
      const existingHistory = JSON.parse(localStorage.getItem('stockHistory') || '[]');
      const updatedHistory = [change, ...existingHistory].slice(0, 100);
      localStorage.setItem('stockHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving stock history:', error);
    }
  };
  
  // Toggle category collapse
  const toggleCategoryCollapse = (category) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };
  
  // Handle bulk update modal
  const openBulkUpdateModal = () => {
    // Initialize bulk update data with current amounts
    const bulkData = {};
    Object.entries(inventory).forEach(([ingredient, data]) => {
      bulkData[ingredient] = {
        currentAmount: data.amount,
        newAmount: data.amount,
        category: data.category,
        unit: data.unit,
        selected: false
      };
    });
    setBulkUpdateData(bulkData);
    setShowBulkUpdateModal(true);
  };
  
  // Apply bulk updates
  const applyBulkUpdates = () => {
    const updatedInventory = { ...inventory };
    let changesCount = 0;
    
    Object.entries(bulkUpdateData).forEach(([ingredient, data]) => {
      if (data.selected && data.newAmount !== data.currentAmount) {
        // Log the change
        logStockChange(ingredient, data.currentAmount, data.newAmount, 'bulk_update');
        
        updatedInventory[ingredient] = {
          ...updatedInventory[ingredient],
          amount: data.newAmount
        };
        changesCount++;
      }
    });
    
    setInventory(updatedInventory);
    setShowBulkUpdateModal(false);
    
    if (changesCount > 0) {
      setSaveStatus(`Bulk update applied to ${changesCount} ingredients. Don't forget to save!`);
      setTimeout(() => setSaveStatus(''), 5000);
    }
  };
  
  // Handle bulk update data changes
  const updateBulkItem = (ingredient, field, value) => {
    setBulkUpdateData(prev => ({
      ...prev,
      [ingredient]: {
        ...prev[ingredient],
        [field]: value
      }
    }));
  };
  
  // Quick preset adjustments
  const applyPresetAdjustment = (ingredient, adjustment) => {
    const oldAmount = inventory[ingredient]?.amount || 0;
    const newAmount = Math.max(0, oldAmount + adjustment);
    
    logStockChange(ingredient, oldAmount, newAmount, adjustment > 0 ? 'increment' : 'decrement');
    
    setInventory(prev => ({
      ...prev,
      [ingredient]: {
        ...prev[ingredient],
        amount: newAmount
      }
    }));
  };

  // Function to calculate daily average usage for each ingredient
  const calculateDailyUsage = (usage, days) => {
    if (days <= 0) return usage;
    const dailyUsage = {};
    Object.entries(usage).forEach(([ingredient, data]) => {
      dailyUsage[ingredient] = {
        ...data,
        used: data.used / days
      };
    });
    return dailyUsage;
  };
  
  // Process orders to calculate weekly usage
  const processWeeklyUsage = () => {
    if (!orders || orders.length === 0) {
      return {};
    }
    
    const now = new Date();
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const weekOrders = orders.filter(order => {
      let orderDate;
      if (order.orderTime) {
        orderDate = new Date(order.orderTime);
      } else if (order.createdAt) {
        orderDate = new Date(order.createdAt);
      } else if (order.timestamp) {
        orderDate = new Date(typeof order.timestamp === 'number' ? order.timestamp : order.timestamp.toDate?.());
      } else {
        return false;
      }
      
      return orderDate >= lastWeek;
    });
    
    // Process orders to get usage
    const usage = {};
    
    // Initialize with all ingredients
    const allIngredients = new Set();
    Object.keys(PIZZA_INGREDIENTS.base).forEach(ingredient => {
      allIngredients.add(ingredient);
    });
    Object.values(PIZZA_INGREDIENTS.pizzas).forEach(pizza => {
      Object.keys(pizza.ingredients).forEach(ingredient => {
        allIngredients.add(ingredient);
      });
    });
    // Add cold drink ingredients
    Object.values(PIZZA_INGREDIENTS.coldDrinks || {}).forEach(drink => {
      Object.keys(drink.ingredients).forEach(ingredient => {
        allIngredients.add(ingredient);
      });
    });
    
    allIngredients.forEach(ingredient => {
      usage[ingredient] = { used: 0, unit: '', category: '' };
    });
    
    // Calculate usage from orders
    weekOrders.forEach(order => {
      if (!order.pizzas || !Array.isArray(order.pizzas)) return;
      
      order.pizzas.forEach(pizza => {
        const quantity = pizza.quantity || 1;
        let pizzaType = pizza.pizzaType || pizza.type;
        
        if (!pizzaType) return;
        
        // Convert to title case
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
        } else if (pizzaType.includes('Hawaiian')) {
          pizzaType = 'Hawaiian';
        } else if (pizzaType.includes('Meat') && (pizzaType.includes('Lover') || pizzaType.includes('Feast'))) {
          pizzaType = 'Meat Lovers';
        } else if (pizzaType.includes('Mushroom') && pizzaType.includes('Cloud')) {
          pizzaType = 'Mushroom Cloud Pizza';
        } else if (pizzaType.includes('Champ')) {
          pizzaType = 'The Champ';
        } else if (pizzaType.includes('Sourdough') && pizzaType.includes('Special')) {
          pizzaType = 'Sourdough Special';
        } else if (pizzaType.includes('Vegan')) {
          pizzaType = 'Vegan Delight';
        }
        
        if (!PIZZA_INGREDIENTS.pizzas[pizzaType]) return;
        
        // Add base ingredients
        Object.entries(PIZZA_INGREDIENTS.base).forEach(([ingredient, data]) => {
          if (!usage[ingredient]) {
            usage[ingredient] = { used: 0, unit: data.unit, category: data.category };
          }
          usage[ingredient].used += data.amount * quantity;
          usage[ingredient].unit = data.unit;
          usage[ingredient].category = data.category;
        });
        
        // Add pizza-specific ingredients
        Object.entries(PIZZA_INGREDIENTS.pizzas[pizzaType].ingredients).forEach(([ingredient, data]) => {
          if (!usage[ingredient]) {
            usage[ingredient] = { used: 0, unit: data.unit, category: data.category };
          }
          usage[ingredient].used += data.amount * quantity;
          usage[ingredient].unit = data.unit;
          usage[ingredient].category = data.category;
        });
      });
      
      // Process cold drinks
      if (order.coldDrinks && Array.isArray(order.coldDrinks)) {
        order.coldDrinks.forEach(drink => {
          const drinkQuantity = drink.quantity || 1;
          const drinkType = drink.drinkType;
          
          if (PIZZA_INGREDIENTS.coldDrinks && PIZZA_INGREDIENTS.coldDrinks[drinkType]) {
            Object.entries(PIZZA_INGREDIENTS.coldDrinks[drinkType].ingredients).forEach(([ingredient, data]) => {
              if (!usage[ingredient]) {
                usage[ingredient] = { used: 0, unit: data.unit, category: data.category };
              }
              usage[ingredient].used += data.amount * drinkQuantity;
              usage[ingredient].unit = data.unit;
              usage[ingredient].category = data.category;
            });
          }
        });
      }
    });
    
    // Calculate daily usage
    return calculateDailyUsage(usage, 7);
  };
  
  // Calculate daily usage from the last week
  const lastWeekUsage = useMemo(() => processWeeklyUsage(), [orders]);
  
  // Process forecast data based on inventory and usage
  const processForecastData = () => {
    // Calculate forecast for each ingredient
    const forecast = [];
    
    Object.entries(inventory).forEach(([ingredient, data]) => {
      const dailyUsage = lastWeekUsage[ingredient]?.used || 0;
      const daysRemaining = dailyUsage > 0 ? Math.floor(data.amount / dailyUsage) : 999;
      const reorderDate = new Date();
      reorderDate.setDate(reorderDate.getDate() + daysRemaining);
      
      // Get cost per unit
      let costPerUnit = 0;
      if (PIZZA_INGREDIENTS.base[ingredient]) {
        costPerUnit = PIZZA_INGREDIENTS.base[ingredient].cost || 0;
      } else {
        for (const pizza of Object.values(PIZZA_INGREDIENTS.pizzas)) {
          if (pizza.ingredients[ingredient]) {
            costPerUnit = pizza.ingredients[ingredient].cost || 0;
            break;
          }
        }
        
        // Check cold drink ingredients
        if (costPerUnit === 0 && PIZZA_INGREDIENTS.coldDrinks) {
          for (const drink of Object.values(PIZZA_INGREDIENTS.coldDrinks)) {
            if (drink.ingredients && drink.ingredients[ingredient]) {
              costPerUnit = drink.ingredients[ingredient].cost || 0;
              break;
            }
          }
        }
      }
      
      forecast.push({
        name: ingredient,
        currentStock: data.amount,
        unit: data.unit,
        dailyUsage: dailyUsage.toFixed(2),
        daysRemaining: daysRemaining,
        reorderDate: reorderDate,
        costPerUnit: costPerUnit,
        category: data.category
      });
    });
    
    // Sort by days remaining (ascending)
    return forecast.sort((a, b) => a.daysRemaining - b.daysRemaining);
  };
  
  // Calculate forecast data
  const forecastData = useMemo(() => processForecastData(), [inventory, lastWeekUsage, forecastDays]);
  
  // Helper function to get category emoji
  const getCategoryEmoji = (category) => {
    const emojis = {
      dough: '🍞',
      cheese: '🧀',
      meat: '🍖',
      vegetable: '🥬',
      sauce: '🍅',
      herb: '🌿',
      oil: '🫒',
      fruit: '🍍',
      fish: '🌠',
      beverage_ingredient: '🥤',
      packaging: '📦',
      beverage_finished: '🥤',
      other: '🍽️'
    };
    return emojis[category] || '🍽️';
  };
  
  // Group inventory by category
  const inventoryByCategory = useMemo(() => {
    const categories = {};
    
    Object.entries(inventory).forEach(([ingredient, data]) => {
      const category = data.category || 'other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push({ name: ingredient, ...data });
    });
    
    // Sort categories and ingredients within each category
    Object.keys(categories).forEach(category => {
      categories[category].sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return categories;
  }, [inventory]);
  
  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const cats = new Set(['all']);
    Object.keys(inventory).forEach(ingredient => {
      cats.add(inventory[ingredient].category || 'other');
    });
    return Array.from(cats).sort();
  }, [inventory]);
  
  // Filter inventory items based on search term and category
  const filteredInventory = useMemo(() => {
    let filtered = Object.entries(inventory);
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(([ingredient]) => 
        ingredient.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(([ingredient, data]) => 
        (data.category || 'other') === selectedCategory
      );
    }
    
    return filtered;
  }, [inventory, searchTerm, selectedCategory]);

  if (inventoryLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Inventory Management</h2>
        <div className="flex items-center justify-center p-4">
          <p>Loading inventory data...</p>
        </div>
      </div>
    );
  }

  if (inventoryError) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Inventory Management</h2>
        <div className="p-4">
          <p className="text-red-600">Error: {inventoryError}</p>
        </div>
      </div>
    );
  }
  
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Inventory Management</h2>
      
      {showLowStockNotification && (
        <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md">
          <div className="flex items-center">
            <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="font-bold">Low Stock Alert</h3>
          </div>
          <p className="mt-2">The following ingredients are running low:</p>
          <ul className="mt-2 ml-6 list-disc">
            {lowStockItems.map(item => (
              <li key={item.name}>
                <span className="font-semibold capitalize">{item.name.replace(/_/g, ' ')}</span>: {item.amount} {item.unit} 
                (threshold: {item.threshold} {item.unit})
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mb-6">
        {/* Tab navigation - Analytics Only (Stock Entry is in Daily Stock Entry page) */}
        <div className="grid grid-cols-2 md:flex gap-2 md:space-x-4">
          <button
            onClick={() => setActiveView('usage')}
            className={`px-3 py-2 rounded text-sm md:text-base font-medium transition-colors ${
              activeView === 'usage' ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            <span className="md:hidden">📈 Usage</span>
            <span className="hidden md:inline">📈 Usage Analysis</span>
          </button>
          <button
            onClick={() => setActiveView('forecast')}
            className={`px-3 py-2 rounded text-sm md:text-base font-medium transition-colors ${
              activeView === 'forecast' ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            <span className="md:hidden">🔮 Forecast</span>
            <span className="hidden md:inline">🔮 Inventory Forecast</span>
          </button>
          <button
            onClick={() => setActiveView('manager')}
            className={`px-3 py-2 rounded text-sm md:text-base font-medium transition-colors ${
              activeView === 'manager' ? 'bg-purple-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            <span className="md:hidden">📄 Manager</span>
            <span className="hidden md:inline">📄 Manager Dashboard</span>
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded p-4 shadow">
        
        {activeView === 'usage' && (
          <div>
            <h3 className="font-semibold mb-4">Usage Analysis</h3>
            <UsageAnalysis orders={orders} />
          </div>
        )}

        {activeView === 'manager' && (
          <InventoryManagerDashboard />
        )}

        {activeView === 'forecast' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-xl">Inventory Forecast</h3>
              <div className="flex items-center space-x-2">
                <label htmlFor="forecastDays" className="text-sm">Forecast Period:</label>
                <select
                  id="forecastDays"
                  value={forecastDays}
                  onChange={(e) => setForecastDays(parseInt(e.target.value))}
                  className="border rounded px-2 py-1"
                >
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold">Ingredients Running Low</h4>
                <p className="text-3xl font-bold text-red-600">{lowStockItems.length}</p>
                <p className="text-sm text-gray-600">Need immediate attention</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold">Estimated Weekly Cost</h4>
                <p className="text-3xl font-bold text-green-600">
                  R{forecastData
                    .reduce((total, item) => total + (parseFloat(item.dailyUsage) * 7 * item.costPerUnit), 0)
                    .toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Based on current usage</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold">Most Used Ingredient</h4>
                {forecastData.length > 0 ? (
                  <>
                    <p className="text-xl font-bold text-purple-600 capitalize">
                      {forecastData.sort((a, b) => parseFloat(b.dailyUsage) - parseFloat(a.dailyUsage))[0].name.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {forecastData.sort((a, b) => parseFloat(b.dailyUsage) - parseFloat(a.dailyUsage))[0].dailyUsage} {forecastData.sort((a, b) => parseFloat(b.dailyUsage) - parseFloat(a.dailyUsage))[0].unit}/day
                    </p>
                  </>
                ) : (
                  <p className="text-gray-600">No data available</p>
                )}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 border-b">Ingredient</th>
                    <th className="text-left p-3 border-b">Category</th>
                    <th className="text-left p-3 border-b">Current Stock</th>
                    <th className="text-left p-3 border-b">Daily Usage</th>
                    <th className="text-left p-3 border-b">Days Remaining</th>
                    <th className="text-left p-3 border-b">Reorder Date</th>
                    <th className="text-left p-3 border-b">Cost Per Unit</th>
                    <th className="text-left p-3 border-b">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {forecastData.map(item => (
                    <tr 
                      key={item.name} 
                      className={item.daysRemaining <= 7 ? 'bg-red-50' : item.daysRemaining <= 14 ? 'bg-yellow-50' : 'hover:bg-gray-50'}
                    >
                      <td className="p-3 border-b capitalize">{item.name.replace(/_/g, ' ')}</td>
                      <td className="p-3 border-b capitalize">{item.category}</td>
                      <td className="p-3 border-b">{item.currentStock} {item.unit}</td>
                      <td className="p-3 border-b">{item.dailyUsage} {item.unit}/day</td>
                      <td className="p-3 border-b font-semibold">{item.daysRemaining === 999 ? '∞' : item.daysRemaining}</td>
                      <td className="p-3 border-b">
                        {item.daysRemaining === 999 ? 'N/A' : item.reorderDate.toLocaleDateString()}
                      </td>
                      <td className="p-3 border-b">R{item.costPerUnit.toFixed(2)}/{item.unit}</td>
                      <td className="p-3 border-b">
                        <span 
                          className={`px-2 py-1 rounded text-xs ${item.daysRemaining <= 7 ? 'bg-red-100 text-red-700' : item.daysRemaining <= 14 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}
                        >
                          {item.daysRemaining <= 7 ? 'Order Now' : item.daysRemaining <= 14 ? 'Order Soon' : 'Good Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryManagement;
