/**
 * InventoryDeductionService.js
 * Automatically deducts inventory based on completed orders
 */

import { PIZZA_INGREDIENTS } from '../data/ingredients';
import { mapIngredientToInventory } from '../data/ingredient-mapping-fix';
import FirebaseService from './FirebaseService';

/**
 * Normalize pizza type name to match our ingredient database
 * @param {String} pizzaType - The pizza type from the order
 * @returns {String} Normalized pizza type that matches our ingredient database
 */
const normalizePizzaType = (pizzaType) => {
  if (!pizzaType) return null;
  
  const normalizedInput = String(pizzaType).trim();
  
  // Check if we have a direct mapping
  if (PIZZA_INGREDIENTS.pizzaNameMap && PIZZA_INGREDIENTS.pizzaNameMap[normalizedInput]) {
    return PIZZA_INGREDIENTS.pizzaNameMap[normalizedInput];
  }
  
  // If it's an exact match in our database, return it
  if (PIZZA_INGREDIENTS.pizzas[normalizedInput]) {
    return normalizedInput;
  }
  
  // Try case-insensitive match
  const upperInput = normalizedInput.toUpperCase();
  if (PIZZA_INGREDIENTS.pizzas[upperInput]) {
    return upperInput;
  }
  
  console.warn('No mapping found for pizza type:', pizzaType);
  return null;
};

/**
 * Calculate ingredient usage from a single order
 * @param {Object} order - Order object with pizzas and coldDrinks
 * @returns {Object} Ingredient usage breakdown
 */
export const calculateOrderIngredientUsage = (order) => {
  const usage = {};
  
  if (!order) return usage;
  
  // Process pizzas
  if (order.pizzas && Array.isArray(order.pizzas)) {
    order.pizzas.forEach(pizza => {
      const quantity = pizza.quantity || 1;
      const normalizedPizzaType = normalizePizzaType(pizza.pizzaType || pizza.type);
      
      if (!normalizedPizzaType) return;
      
      const recipe = PIZZA_INGREDIENTS.pizzas[normalizedPizzaType];
      if (!recipe || !recipe.ingredients) return;
      
      // Add base ingredients (sourdough dough - always needed)
      Object.entries(PIZZA_INGREDIENTS.base).forEach(([ingredient, data]) => {
        const inventoryIngredient = mapIngredientToInventory(ingredient);
        if (!usage[inventoryIngredient]) {
          usage[inventoryIngredient] = { used: 0, unit: data.unit, category: data.category };
        }
        usage[inventoryIngredient].used += data.amount * quantity;
      });
      
      // Add pizza-specific ingredients
      Object.entries(recipe.ingredients).forEach(([ingredient, data]) => {
        const inventoryIngredient = mapIngredientToInventory(ingredient);
        if (!usage[inventoryIngredient]) {
          usage[inventoryIngredient] = { used: 0, unit: data.unit, category: data.category };
        }
        usage[inventoryIngredient].used += data.amount * quantity;
      });
    });
  }
  
  // Process cold drinks
  if (order.coldDrinks && Array.isArray(order.coldDrinks)) {
    order.coldDrinks.forEach(drink => {
      const quantity = drink.quantity || 1;
      const drinkType = drink.drinkType;
      
      if (!drinkType || !PIZZA_INGREDIENTS.coldDrinks[drinkType]) return;
      
      const drinkRecipe = PIZZA_INGREDIENTS.coldDrinks[drinkType];
      Object.entries(drinkRecipe.ingredients).forEach(([ingredient, data]) => {
        const inventoryIngredient = mapIngredientToInventory(ingredient);
        if (!usage[inventoryIngredient]) {
          usage[inventoryIngredient] = { used: 0, unit: data.unit, category: data.category };
        }
        usage[inventoryIngredient].used += data.amount * quantity;
      });
    });
  }
  
  return usage;
};

/**
 * Calculate ingredient usage from multiple orders
 * @param {Array} orders - Array of order objects
 * @returns {Object} Total ingredient usage breakdown
 */
export const calculateBatchIngredientUsage = (orders) => {
  const totalUsage = {};
  
  orders.forEach(order => {
    const orderUsage = calculateOrderIngredientUsage(order);
    
    Object.entries(orderUsage).forEach(([ingredient, data]) => {
      if (!totalUsage[ingredient]) {
        totalUsage[ingredient] = { used: 0, unit: data.unit, category: data.category };
      }
      totalUsage[ingredient].used += data.used;
    });
  });
  
  return totalUsage;
};

/**
 * Deduct inventory based on a single completed order
 * @param {Object} order - Completed order object
 * @param {Object} currentInventory - Current inventory state
 * @returns {Object} Updated inventory after deduction
 */
export const deductInventoryForOrder = (order, currentInventory) => {
  const usage = calculateOrderIngredientUsage(order);
  const updatedInventory = { ...currentInventory };
  
  Object.entries(usage).forEach(([ingredient, data]) => {
    if (updatedInventory[ingredient]) {
      // Deduct the used amount from current stock
      const newAmount = Math.max(0, updatedInventory[ingredient].amount - data.used);
      updatedInventory[ingredient] = {
        ...updatedInventory[ingredient],
        amount: newAmount
      };
      
      console.log(`Deducted ${data.used}${data.unit} of ${ingredient}. New amount: ${newAmount}${data.unit}`);
    } else {
      // If ingredient doesn't exist in inventory, create it with 0 stock
      updatedInventory[ingredient] = {
        amount: 0,
        threshold: 10,
        unit: data.unit,
        category: data.category
      };
      
      console.warn(`Ingredient ${ingredient} not found in inventory. Added with 0 stock.`);
    }
  });
  
  return updatedInventory;
};

/**
 * Deduct inventory based on multiple completed orders
 * @param {Array} orders - Array of completed order objects
 * @param {Object} currentInventory - Current inventory state
 * @returns {Object} Updated inventory after deduction
 */
export const deductInventoryForOrders = (orders, currentInventory) => {
  const totalUsage = calculateBatchIngredientUsage(orders);
  const updatedInventory = { ...currentInventory };
  
  Object.entries(totalUsage).forEach(([ingredient, data]) => {
    if (updatedInventory[ingredient]) {
      // Deduct the used amount from current stock
      const newAmount = Math.max(0, updatedInventory[ingredient].amount - data.used);
      updatedInventory[ingredient] = {
        ...updatedInventory[ingredient],
        amount: newAmount
      };
    } else {
      // If ingredient doesn't exist in inventory, create it with 0 stock
      updatedInventory[ingredient] = {
        amount: 0,
        threshold: 10,
        unit: data.unit,
        category: data.category
      };
    }
  });
  
  return updatedInventory;
};

/**
 * Process end-of-day inventory deduction
 * Updates Firebase inventory based on all completed orders
 * @param {Array} completedOrders - Orders that were completed today
 * @returns {Object} Result of the operation
 */
export const processEndOfDayInventoryDeduction = async (completedOrders = []) => {
  try {
    console.log(`Processing end-of-day inventory deduction for ${completedOrders.length} orders`);
    
    // Get current inventory from Firebase
    const currentInventory = await FirebaseService.getInventory();
    
    // Calculate total usage for all completed orders
    const totalUsage = calculateBatchIngredientUsage(completedOrders);
    
    // Deduct from current inventory
    const updatedInventory = deductInventoryForOrders(completedOrders, currentInventory);
    
    // Update inventory in Firebase
    await FirebaseService.updateInventory(updatedInventory);
    
    console.log('End-of-day inventory deduction completed successfully');
    
    return {
      success: true,
      ordersProcessed: completedOrders.length,
      ingredientsUpdated: Object.keys(totalUsage).length,
      usage: totalUsage,
      updatedInventory
    };
  } catch (error) {
    console.error('Error processing end-of-day inventory deduction:', error);
    throw error;
  }
};

/**
 * Get low stock alerts based on current inventory levels
 * @param {Object} inventory - Current inventory state
 * @returns {Array} Array of low stock items with details
 */
export const getLowStockAlerts = (inventory) => {
  const lowStockItems = [];
  
  Object.entries(inventory).forEach(([ingredient, data]) => {
    if (data.amount <= (data.threshold || 10)) {
      lowStockItems.push({
        ingredient,
        currentStock: data.amount,
        threshold: data.threshold || 10,
        unit: data.unit,
        category: data.category,
        urgency: data.amount === 0 ? 'critical' : 'low'
      });
    }
  });
  
  // Sort by urgency (critical first) then by how far below threshold
  return lowStockItems.sort((a, b) => {
    if (a.urgency === 'critical' && b.urgency !== 'critical') return -1;
    if (b.urgency === 'critical' && a.urgency !== 'critical') return 1;
    
    const aDeficit = a.threshold - a.currentStock;
    const bDeficit = b.threshold - b.currentStock;
    return bDeficit - aDeficit;
  });
};

/**
 * Generate daily stock notification message for management
 * @param {Object} inventory - Current inventory state
 * @param {Array} todaysUsage - Usage from today's orders
 * @returns {Object} Notification details
 */
export const generateDailyStockNotification = (inventory, todaysUsage = []) => {
  const lowStockItems = getLowStockAlerts(inventory);
  const criticalItems = lowStockItems.filter(item => item.urgency === 'critical');
  const lowItems = lowStockItems.filter(item => item.urgency === 'low');
  
  // Group items by category for easier reading
  const groupedLowStock = {};
  lowStockItems.forEach(item => {
    const category = item.category || 'other';
    if (!groupedLowStock[category]) {
      groupedLowStock[category] = [];
    }
    groupedLowStock[category].push(item);
  });
  
  return {
    hasAlerts: lowStockItems.length > 0,
    criticalCount: criticalItems.length,
    lowStockCount: lowItems.length,
    totalItemsLow: lowStockItems.length,
    criticalItems,
    lowItems,
    groupedLowStock,
    message: generateNotificationMessage(lowStockItems, todaysUsage),
    timestamp: new Date().toISOString()
  };
};

/**
 * Generate human-readable notification message
 * @param {Array} lowStockItems - Items that are low in stock
 * @param {Array} todaysUsage - Usage from today
 * @returns {String} Notification message
 */
const generateNotificationMessage = (lowStockItems, todaysUsage) => {
  if (lowStockItems.length === 0) {
    return "✅ All inventory levels are above threshold. No immediate action needed.";
  }
  
  const criticalItems = lowStockItems.filter(item => item.urgency === 'critical');
  const lowItems = lowStockItems.filter(item => item.urgency === 'low');
  
  let message = "📊 Daily Inventory Update:\\n\\n";
  
  if (criticalItems.length > 0) {
    message += `🚨 CRITICAL - OUT OF STOCK (${criticalItems.length} items):\\n`;
    criticalItems.forEach(item => {
      message += `• ${item.ingredient.replace(/_/g, ' ')}: ${item.currentStock}${item.unit} (need to reorder immediately)\\n`;
    });
    message += "\\n";
  }
  
  if (lowItems.length > 0) {
    message += `⚠️ LOW STOCK (${lowItems.length} items):\\n`;
    lowItems.forEach(item => {
      message += `• ${item.ingredient.replace(/_/g, ' ')}: ${item.currentStock}${item.unit} (threshold: ${item.threshold}${item.unit})\\n`;
    });
  }
  
  return message;
};

// Export all functions
const InventoryDeductionService = {
  calculateOrderIngredientUsage,
  calculateBatchIngredientUsage,
  deductInventoryForOrder,
  deductInventoryForOrders,
  processEndOfDayInventoryDeduction,
  getLowStockAlerts,
  generateDailyStockNotification,
  normalizePizzaType
};

export default InventoryDeductionService;