// Pizza ingredients database
export const PIZZA_INGREDIENTS = {
  base: {
    'sourdough_dough': { unit: 'ball', amount: 1, category: 'dough', cost: 12.50 },
    'tomato_sauce': { unit: 'ml', amount: 80, category: 'sauce', cost: 0.05 },
    'mozzarella_cheese': { unit: 'g', amount: 100, category: 'cheese', cost: 0.12 }
  },
  pizzas: {
    'Margherita': {
      ingredients: {
        'fresh_basil': { unit: 'g', amount: 10, category: 'herb', cost: 0.20 },
        'olive_oil': { unit: 'ml', amount: 10, category: 'oil', cost: 0.15 }
      }
    },
    'Pepperoni': {
      ingredients: {
        'pepperoni': { unit: 'g', amount: 60, category: 'meat', cost: 0.18 }
      }
    },
    'Vegetarian': {
      ingredients: {
        'mushrooms': { unit: 'g', amount: 40, category: 'vegetable', cost: 0.08 },
        'bell_peppers': { unit: 'g', amount: 40, category: 'vegetable', cost: 0.06 },
        'red_onion': { unit: 'g', amount: 30, category: 'vegetable', cost: 0.04 },
        'olives': { unit: 'g', amount: 20, category: 'vegetable', cost: 0.10 }
      }
    },
    'Hawaiian': {
      ingredients: {
        'ham': { unit: 'g', amount: 50, category: 'meat', cost: 0.15 },
        'pineapple': { unit: 'g', amount: 50, category: 'fruit', cost: 0.08 }
      }
    },
    'Meat Lovers': {
      ingredients: {
        'pepperoni': { unit: 'g', amount: 30, category: 'meat', cost: 0.09 },
        'sausage': { unit: 'g', amount: 30, category: 'meat', cost: 0.12 },
        'bacon': { unit: 'g', amount: 30, category: 'meat', cost: 0.14 },
        'ham': { unit: 'g', amount: 30, category: 'meat', cost: 0.09 }
      }
    },
    // John Dough's specialty pizzas
    'Mushroom Cloud Pizza': {
      ingredients: {
        'mushrooms': { unit: 'g', amount: 80, category: 'vegetable', cost: 0.16 },
        'truffle_oil': { unit: 'ml', amount: 15, category: 'oil', cost: 0.75 },
        'garlic': { unit: 'g', amount: 10, category: 'vegetable', cost: 0.05 },
        'thyme': { unit: 'g', amount: 5, category: 'herb', cost: 0.10 },
        'parmesan_cheese': { unit: 'g', amount: 30, category: 'cheese', cost: 0.18 }
      }
    },
    'The Champ': {
      ingredients: {
        'chicken': { unit: 'g', amount: 60, category: 'meat', cost: 0.20 },
        'bacon': { unit: 'g', amount: 30, category: 'meat', cost: 0.14 },
        'avocado': { unit: 'g', amount: 40, category: 'vegetable', cost: 0.25 },
        'ranch_sauce': { unit: 'ml', amount: 20, category: 'sauce', cost: 0.08 }
      }
    },
    'Sourdough Special': {
      ingredients: {
        'prosciutto': { unit: 'g', amount: 40, category: 'meat', cost: 0.35 },
        'arugula': { unit: 'g', amount: 20, category: 'vegetable', cost: 0.12 },
        'cherry_tomatoes': { unit: 'g', amount: 30, category: 'vegetable', cost: 0.10 },
        'balsamic_glaze': { unit: 'ml', amount: 15, category: 'sauce', cost: 0.15 }
      }
    },
    'Vegan Delight': {
      ingredients: {
        'vegan_cheese': { unit: 'g', amount: 80, category: 'cheese', cost: 0.25 },
        'spinach': { unit: 'g', amount: 30, category: 'vegetable', cost: 0.08 },
        'roasted_peppers': { unit: 'g', amount: 40, category: 'vegetable', cost: 0.12 },
        'artichoke_hearts': { unit: 'g', amount: 35, category: 'vegetable', cost: 0.18 },
        'plant_based_sausage': { unit: 'g', amount: 50, category: 'meat', cost: 0.30 }
      }
    }
  }
};
