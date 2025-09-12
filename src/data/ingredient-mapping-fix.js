/**
 * Ingredient Mapping Fix
 * This creates a standardized mapping between recipe ingredients and inventory items
 */

export const INGREDIENT_MAPPING = {
  // Pizza ingredient mappings - from recipe names to inventory names
  'shredded_mozzarella': 'mozzarella',
  'fresh_mozzarella': 'mozzarella', // Both types use same inventory item
  'red_onion': 'onions',
  'caramelised_pineapple': 'pineapple',
  'roasted_garlic': 'garlic',
  'caramelized_onion': 'onions',
  'bell_pepper': 'bell_peppers',
  'pizza_sauce': 'tomato_sauce', // If using different names
  'sourdough_dough': 'dough_balls',
  
  // Meat mappings
  'bacon': 'bacon',
  'pepperoni': 'pepperoni', 
  'ham': 'ham',
  'boerewors': 'boerewors',
  'beef_strips': 'beef',
  'chicken_strips': 'chicken',
  
  // Vegetable mappings
  'mushrooms': 'mushrooms',
  'cherry_tomatoes': 'tomatoes',
  'sun_dried_tomatoes': 'sundried_tomatoes',
  'olives': 'olives',
  'avocado': 'avocado',
  'jalapenos': 'jalapenos',
  'potatoes': 'potatoes',
  
  // Herb and spice mappings
  'basil': 'basil',
  'oregano': 'oregano',
  'rosemary': 'rosemary',
  'thyme': 'thyme',
  'garlic_butter': 'garlic_butter',
  
  // Cheese mappings
  'parmesan': 'parmesan',
  'feta': 'feta',
  'ricotta': 'ricotta',
  
  // Cold drink mappings
  'coke_syrup': 'coke_syrup',
  'sprite_syrup': 'sprite_syrup',
  'fanta_syrup': 'fanta_syrup',
  'carbonated_water': 'carbonated_water'
};

/**
 * Maps a recipe ingredient name to the corresponding inventory item name
 * @param {string} recipeIngredient - The ingredient name as used in recipes
 * @returns {string} The inventory item name
 */
export const mapIngredientToInventory = (recipeIngredient) => {
  return INGREDIENT_MAPPING[recipeIngredient] || recipeIngredient;
};

/**
 * Debug function to check which ingredients are mapped vs unmapped
 * @param {object} recipeIngredients - Ingredients from a recipe
 * @returns {object} Mapping analysis
 */
export const analyzeIngredientMapping = (recipeIngredients) => {
  const analysis = {
    mapped: {},
    unmapped: {},
    total: 0
  };
  
  Object.keys(recipeIngredients).forEach(ingredient => {
    analysis.total++;
    const mappedName = mapIngredientToInventory(ingredient);
    
    if (mappedName !== ingredient) {
      analysis.mapped[ingredient] = mappedName;
    } else if (!INGREDIENT_MAPPING[ingredient]) {
      analysis.unmapped[ingredient] = 'No mapping found';
    }
  });
  
  return analysis;
};