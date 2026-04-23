/**
 * Ingredient Mapping Fix
 * This creates a standardized mapping between recipe ingredients and inventory items
 */

// IMPORTANT: Recipe ingredient names must match inventory key names exactly.
// EasyStockEntry saves stock under the raw recipe name, and InventoryDeductionService
// deducts using the mapped name. If these differ, deductions silently fail.
// Only add a mapping here if an ingredient is genuinely stored under a DIFFERENT key
// in Firebase than it is named in the recipe (e.g. a legacy rename).
export const INGREDIENT_MAPPING = {};

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