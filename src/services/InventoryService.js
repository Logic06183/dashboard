/**
 * InventoryService.js
 * Service that manages inventory tracking based on orders processed
 */

// Pizza ingredients database - amounts per standard pizza
export const PIZZA_INGREDIENTS = {
  // Base ingredients (used in every pizza unless specified)
  base: {
    'sourdough_dough': { unit: 'ball', amount: 1, category: 'dough' }, // One dough ball per pizza
    'tomato_sauce': { unit: 'ml', amount: 80, category: 'sauce' }, // ~80ml per regular pizza
    'mozzarella_cheese': { unit: 'g', amount: 100, category: 'cheese' } // ~100g per regular pizza
  },
  
  // Pizza-specific ingredients and amounts per pizza type
  pizzas: {
    'The Champ Pizza': {
      ingredients: {
        'pepperoni': { unit: 'g', amount: 60, category: 'meat' },
        'spring_onions': { unit: 'g', amount: 15, category: 'vegetable' },
        'parmesan': { unit: 'g', amount: 20, category: 'cheese' }
      },
      excludes: [] // No excluded base ingredients
    },
    'Pig in Paradise': {
      ingredients: {
        'bacon': { unit: 'g', amount: 50, category: 'meat' },
        'caramelised_pineapple': { unit: 'g', amount: 80, category: 'fruit' }
      },
      excludes: []
    },
    'Margie Pizza': {
      ingredients: {
        'fresh_basil': { unit: 'g', amount: 10, category: 'herb' }
      },
      excludes: [] // Still uses basic sauce and cheese
    },
    'Mushroom Cloud Pizza': {
      ingredients: {
        'mushrooms': { unit: 'g', amount: 100, category: 'vegetable' },
        'goats_cheese': { unit: 'g', amount: 50, category: 'cheese' },
        'sunflower_seeds': { unit: 'g', amount: 10, category: 'seed' },
        'chilli_infused_oil': { unit: 'ml', amount: 10, category: 'oil' },
        'garlic': { unit: 'g', amount: 5, category: 'vegetable' },
        'caramelised_onions': { unit: 'g', amount: 40, category: 'vegetable' }
      },
      excludes: []
    },
    'Spud Pizza': {
      ingredients: {
        'potato_slices': { unit: 'g', amount: 120, category: 'vegetable' },
        'rosemary': { unit: 'g', amount: 5, category: 'herb' },
        'salt_flakes': { unit: 'g', amount: 3, category: 'seasoning' },
        'caramelised_onions': { unit: 'g', amount: 40, category: 'vegetable' },
        'chilli_oil': { unit: 'ml', amount: 10, category: 'oil' },
        'parmesan': { unit: 'g', amount: 20, category: 'cheese' }
      },
      excludes: ['tomato_sauce'] // No tomato sauce
    },
    'Mish-Mash Pizza': {
      ingredients: {
        'parma_ham': { unit: 'g', amount: 50, category: 'meat' },
        'fig_preserve': { unit: 'g', amount: 30, category: 'spread' },
        'goats_cheese': { unit: 'g', amount: 50, category: 'cheese' },
        'rocket': { unit: 'g', amount: 20, category: 'vegetable' }
      },
      excludes: []
    },
    'Lekker\'izza': {
      ingredients: {
        'bacon': { unit: 'g', amount: 40, category: 'meat' },
        'chorizo_sausage': { unit: 'g', amount: 40, category: 'meat' },
        'peppadews': { unit: 'g', amount: 30, category: 'vegetable' },
        'feta': { unit: 'g', amount: 40, category: 'cheese' },
        'fresh_herbs': { unit: 'g', amount: 5, category: 'herb' }
      },
      excludes: []
    },
    'Sunshine Margherita': {
      ingredients: {
        'basil_pesto': { unit: 'g', amount: 60, category: 'sauce' },
        'ricotta_cheese': { unit: 'g', amount: 80, category: 'cheese' },
        'sundried_tomatoes': { unit: 'g', amount: 40, category: 'vegetable' },
        'fresh_basil': { unit: 'g', amount: 10, category: 'herb' }
      },
      excludes: ['tomato_sauce', 'mozzarella_cheese'] // No tomato sauce, uses ricotta instead of mozzarella
    },
    'Vegan Harvest Pizza': {
      ingredients: {
        'mushrooms': { unit: 'g', amount: 80, category: 'vegetable' },
        'baby_marrow': { unit: 'g', amount: 60, category: 'vegetable' },
        'kalamata_olives': { unit: 'g', amount: 30, category: 'vegetable' },
        'sundried_tomatoes': { unit: 'g', amount: 40, category: 'vegetable' },
        'seasonal_herbs': { unit: 'g', amount: 8, category: 'herb' },
        'hummus': { unit: 'g', amount: 50, category: 'spread' },
        'olive_oil': { unit: 'ml', amount: 15, category: 'oil' }
      },
      excludes: ['mozzarella_cheese'] // No cheese on vegan pizza
    },
    'Poppa\'s Pizza': {
      ingredients: {
        'anchovies': { unit: 'g', amount: 30, category: 'seafood' },
        'olives': { unit: 'g', amount: 30, category: 'vegetable' },
        'fresh_basil': { unit: 'g', amount: 10, category: 'herb' }
      },
      excludes: []
    },
    'The Zesty Zucchini': {
      ingredients: {
        'courgette': { unit: 'g', amount: 100, category: 'vegetable' },
        'blue_cheese': { unit: 'g', amount: 40, category: 'cheese' },
        'parmesan': { unit: 'g', amount: 20, category: 'cheese' }
      },
      excludes: ['tomato_sauce'] // No pizza sauce (Pizza Bianca)
    },
    'Chick Tick Boom': {
      ingredients: {
        'chicken_tikka': { unit: 'g', amount: 80, category: 'meat' },
        'peppadews': { unit: 'g', amount: 30, category: 'vegetable' },
        'fresh_coriander': { unit: 'g', amount: 8, category: 'herb' }
      },
      excludes: []
    },
    'Artichoke & Ham': {
      ingredients: {
        'artichoke_hearts': { unit: 'g', amount: 60, category: 'vegetable' },
        'ham': { unit: 'g', amount: 50, category: 'meat' },
        'olives': { unit: 'g', amount: 20, category: 'vegetable' }
      },
      excludes: []
    },
    'Jane\'s Dough': {
      ingredients: {
        'garlic': { unit: 'g', amount: 10, category: 'vegetable' },
        'olives': { unit: 'g', amount: 30, category: 'vegetable' },
        'seasonal_herbs': { unit: 'g', amount: 8, category: 'herb' },
        'olive_oil': { unit: 'ml', amount: 20, category: 'oil' }
      },
      excludes: ['tomato_sauce', 'mozzarella_cheese'] // It's a focaccia, not a pizza
    }
  }
};

// Map of pizza names that appear in orders to their exact name in the PIZZA_INGREDIENTS database
const PIZZA_NAME_MAP = {
  // Sample order pizza names
  'Margie': 'Margie Pizza',
  'Mushroom Cloud': 'Mushroom Cloud Pizza',
  'Ham & Artichoke': 'Artichoke & Ham',
  'Pig n Paradise': 'Pig in Paradise',
  'The Champ': 'The Champ Pizza',
  'Spud': 'Spud Pizza',
  'Mish-Mash': 'Mish-Mash Pizza',
  'Lekkerizza': 'Lekker\'izza',
  'Margherita': 'Sunshine Margherita',
  'Vegan Harvest': 'Vegan Harvest Pizza',
  'Poppa': 'Poppa\'s Pizza',
  'Zesty Zucchini': 'The Zesty Zucchini',
  'Chick Tick': 'Chick Tick Boom',
  'Jane\'s': 'Jane\'s Dough',
  
  // More variations for sample pizzas to increase match chances
  'Artichoke and Ham': 'Artichoke & Ham',
  'Artichoke Ham': 'Artichoke & Ham',
  'Zucchini': 'The Zesty Zucchini',
  'Janes Dough': 'Jane\'s Dough',
  'Sour Dough': 'Jane\'s Dough',
  'Poppa Pizza': 'Poppa\'s Pizza',
  'Margie Margherita': 'Margie Pizza',
  'Sunshine Pizza': 'Sunshine Margherita',
  'Vegan': 'Vegan Harvest Pizza',
  'Chick Tick Boom': 'Chick Tick Boom',
  'Pig Paradise': 'Pig in Paradise',
  'Mish Mash': 'Mish-Mash Pizza',
  'Mushrooms': 'Mushroom Cloud Pizza'
};

/**
 * Normalize pizza type names to match our ingredient database
 * @param {String} pizzaType - The pizza type from the order
 * @returns {String} Normalized pizza type that matches our ingredient database
 */
const normalizePizzaType = (pizzaType) => {
  if (!pizzaType) return null;
  
  // Safe handling for trimming and case normalization
  const normalizedInput = String(pizzaType).trim();
  
  // If it's an exact match in our database, return it
  if (PIZZA_INGREDIENTS.pizzas[normalizedInput]) return normalizedInput;
  
  // Check if we have a direct mapping
  if (PIZZA_NAME_MAP[normalizedInput]) return PIZZA_NAME_MAP[normalizedInput];
  
  // If we don't have a match, try a fuzzy match with various transformations
  
  // 1. Try case-insensitive match
  const lowerCaseInput = normalizedInput.toLowerCase();
  for (const [key, value] of Object.entries(PIZZA_NAME_MAP)) {
    if (key.toLowerCase() === lowerCaseInput) {
      return value;
    }
  }
  
  // 2. Try to find a partial match with the database entries
  const pizzaTypes = Object.keys(PIZZA_INGREDIENTS.pizzas);
  for (const dbPizzaType of pizzaTypes) {
    // Check if the database name contains our pizza type or vice versa, case insensitive
    const dbLower = dbPizzaType.toLowerCase();
    const inputLower = normalizedInput.toLowerCase();
    
    if (dbLower.includes(inputLower) || inputLower.includes(dbLower.replace(' pizza', ''))) {
      return dbPizzaType;
    }
  }
  
  // 3. If all else fails, default to a common pizza to avoid null returns
  console.warn('No mapping found for pizza type:', pizzaType, '- defaulting to Margie Pizza');
  return 'Margie Pizza'; // Default to a common pizza to ensure we get some data
};

/**
 * Process pizza ingredients for inventory tracking
 */
function processPizzaIngredients(pizzaType, recipe, quantity, inventoryUsage) {
  // Add base ingredients (unless excluded)
  Object.entries(PIZZA_INGREDIENTS.base).forEach(([ingredient, details]) => {
    // Skip if this ingredient is excluded for this pizza
    if (recipe.excludes && recipe.excludes.includes(ingredient)) return;
    
    // Add ingredient usage
    if (!inventoryUsage[ingredient]) {
      inventoryUsage[ingredient] = {
        ...details,
        used: 0,
        pizzas: {}
      };
    }
    
    const amountUsed = details.amount * quantity;
    inventoryUsage[ingredient].used += amountUsed;
    
    // Track usage per pizza type
    if (!inventoryUsage[ingredient].pizzas[pizzaType]) {
      inventoryUsage[ingredient].pizzas[pizzaType] = 0;
    }
    inventoryUsage[ingredient].pizzas[pizzaType] += amountUsed;
  });
  
  // Add specific ingredients for this pizza
  Object.entries(recipe.ingredients).forEach(([ingredient, details]) => {
    if (!inventoryUsage[ingredient]) {
      inventoryUsage[ingredient] = {
        ...details,
        used: 0,
        pizzas: {}
      };
    }
    
    const amountUsed = details.amount * quantity;
    inventoryUsage[ingredient].used += amountUsed;
    
    // Track usage per pizza type
    if (!inventoryUsage[ingredient].pizzas[pizzaType]) {
      inventoryUsage[ingredient].pizzas[pizzaType] = 0;
    }
    inventoryUsage[ingredient].pizzas[pizzaType] += amountUsed;
  });
}

/**
 * Calculate inventory usage based on orders
 * @param {Array} orders - Orders to analyze
 * @param {Boolean} onlyCooked - If true, only include cooked/completed orders
 * @returns {Object} Inventory usage report
 */
export const calculateInventoryUsage = (orders, onlyCooked = false) => {
  console.log('InventoryService: calculating usage from', orders?.length || 0, 'orders');
  
  // For debugging order data
  if (orders?.length > 0) {
    console.log('Sample order:', JSON.stringify(orders[0]));
    if (orders[0]?.pizzas?.length > 0) {
      console.log('Sample pizza:', JSON.stringify(orders[0].pizzas[0]));
    }
  }
  
  // Ensure we have orders with valid data
  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    console.log('No valid orders to process');
    return {};
  }
  
  // Filter orders if needed (for cooked orders, be more lenient with status checks)
  let filteredOrders = orders;
  if (onlyCooked) {
    filteredOrders = orders.filter(order => {
      // Accept orders marked as 'ready', 'completed', or 'delivered'
      if (['ready', 'completed', 'delivered'].includes(order.status)) return true;
      
      // Also check the cooked array if available
      if (order.cooked && Array.isArray(order.cooked) && order.pizzas) {
        const allCooked = order.cooked.every(status => status === true);
        return allCooked && order.cooked.length === order.pizzas.length;
      }
      
      return false;
    });
  }
  
  console.log('Filtered to', filteredOrders.length, 'orders for inventory usage');
  
  // Initialize usage tracking
  const inventoryUsage = {};
  let processedPizzaCount = 0;
  let processedOrderCount = 0;
  
  // Process each order
  filteredOrders.forEach(order => {
    // Ensure order has pizzas
    if (!order.pizzas || !Array.isArray(order.pizzas)) {
      console.log('Order has no valid pizzas:', order.orderId || order.id);
      return;
    }
    
    let orderHasValidPizzas = false;
    
    // Process each pizza in the order
    order.pizzas.forEach(pizza => {
      // Get pizza type from either field and normalize it
      const rawPizzaType = pizza.pizzaType || pizza.type; // Support both field names
      const normalizedPizzaType = normalizePizzaType(rawPizzaType);
      
      // Set a default quantity if none exists or it's invalid
      let quantity = 1;
      if (pizza.quantity && !isNaN(pizza.quantity)) {
        quantity = Number(pizza.quantity);
      }
      
      console.log(`Processing pizza: ${rawPizzaType} → ${normalizedPizzaType}, quantity: ${quantity}`);
      
      // Check if we have data for this pizza type
      if (!normalizedPizzaType) {
        console.log('Pizza has no valid type or no matching recipe:', rawPizzaType);
        return;
      }
      
      // Get this pizza's recipe
      const recipe = PIZZA_INGREDIENTS.pizzas[normalizedPizzaType];
      if (!recipe) {
        console.log(`No recipe found for ${normalizedPizzaType}, using default`);
        return;
      }
      
      // Mark that this order has at least one valid pizza
      orderHasValidPizzas = true;
      processedPizzaCount++;
      
      // Process this pizza's ingredients
      processPizzaIngredients(normalizedPizzaType, recipe, quantity, inventoryUsage);
    });
    
    // Count orders that actually contributed to inventory usage
    if (orderHasValidPizzas) {
      processedOrderCount++;
    }
  });
  
  console.log(`Calculated inventory usage from ${processedOrderCount} orders (${processedPizzaCount} pizzas): ${Object.keys(inventoryUsage).length} ingredients`);
  
  // If we didn't process any pizzas, something's wrong
  if (processedPizzaCount === 0) {
    console.warn('No pizzas were processed! Double-check the order data.');
  }
  
  return inventoryUsage;
};

/**
 * Get inventory usage by category
 * @param {Object} inventoryUsage - The inventory usage data
 * @returns {Object} Usage by category
 */
export const getUsageByCategory = (inventoryUsage) => {
  const categories = {};
  
  Object.entries(inventoryUsage).forEach(([ingredient, details]) => {
    const category = details.category || 'other';
    
    if (!categories[category]) {
      categories[category] = {
        totalIngredients: 0,
        items: []
      };
    }
    
    categories[category].items.push({
      name: ingredient,
      used: details.used,
      unit: details.unit
    });
    
    categories[category].totalIngredients++;
  });
  
  return categories;
};

/**
 * Get most used ingredients
 * @param {Object} inventoryUsage - The inventory usage data
 * @param {Number} limit - Maximum number of ingredients to return
 * @returns {Array} Top used ingredients
 */
export const getMostUsedIngredients = (inventoryUsage, limit = 10) => {
  return Object.entries(inventoryUsage)
    .map(([name, details]) => ({
      name,
      used: details.used,
      unit: details.unit,
      category: details.category
    }))
    .sort((a, b) => b.used - a.used)
    .slice(0, limit);
};

/**
 * Get inventory estimate for tomorrow based on historical usage
 * @param {Array} orders - Historical orders
 * @param {Number} days - Number of days to consider for historical data
 * @returns {Object} Estimated inventory needs for tomorrow
 */
export const getInventoryEstimate = (orders, days = 7) => {
  // Filter to only include recent orders within specified days
  const now = new Date();
  const cutoffDate = new Date();
  cutoffDate.setDate(now.getDate() - days);
  
  const recentOrders = orders.filter(order => {
    if (!order.orderTime) return false;
    const orderDate = new Date(order.orderTime);
    return orderDate >= cutoffDate;
  });
  
  // Calculate usage based on these orders
  const inventoryUsage = calculateInventoryUsage(recentOrders, true);
  
  // Calculate daily average
  const dailyEstimate = {};
  Object.entries(inventoryUsage).forEach(([ingredient, details]) => {
    dailyEstimate[ingredient] = {
      ...details,
      dailyAverage: parseFloat((details.used / days).toFixed(2)),
      recommended: parseFloat((details.used / days * 1.3).toFixed(2)) // Add 30% buffer
    };
  });
  
  return dailyEstimate;
};

// Export all functions and constants
const inventoryService = {
  calculateInventoryUsage,
  getUsageByCategory,
  getMostUsedIngredients,
  getInventoryEstimate,
  PIZZA_INGREDIENTS
};

export default inventoryService;