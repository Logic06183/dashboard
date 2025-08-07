// Pizza ingredients database
export const PIZZA_INGREDIENTS = {
  base: {
    'sourdough_dough': { unit: 'ball', amount: 1, category: 'dough', cost: 12.50 },
    'tomato_sauce': { unit: 'ml', amount: 80, category: 'sauce', cost: 0.05 },
    'mozzarella_cheese': { unit: 'g', amount: 100, category: 'cheese', cost: 0.12 },
    'garlic_butter': { unit: 'g', amount: 30, category: 'sauce', cost: 0.10 }
  },
  pizzas: {
    // Non-pizza items
    'DOUGH BALLS': {
      ingredients: {
        'sourdough_dough': { unit: 'ball', amount: 0.5, category: 'dough', cost: 6.25 },
        'garlic_butter': { unit: 'g', amount: 30, category: 'sauce', cost: 0.10 }
      }
    },
    'STRETCHED BASE WITH SAUCE': {
      ingredients: {
        'sourdough_dough': { unit: 'ball', amount: 1, category: 'dough', cost: 12.50 },
        'tomato_sauce': { unit: 'ml', amount: 80, category: 'sauce', cost: 0.05 }
      }
    },
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

    // John Dough's specialty pizzas
    'Mushroom Cloud Pizza': {
      ingredients: {
        'mushrooms': { unit: 'g', amount: 80, category: 'vegetable', cost: 0.16 },
        'caramelised_onions': { unit: 'g', amount: 40, category: 'vegetable', cost: 0.08 },
        'goat_cheese': { unit: 'g', amount: 50, category: 'cheese', cost: 0.25 },
        'banhoek_chilli_oil': { unit: 'ml', amount: 10, category: 'oil', cost: 0.20 },
        'sunflower_seeds': { unit: 'g', amount: 15, category: 'topping', cost: 0.10 }
      }
    },

    'Quattro Formaggi': {
      ingredients: {
        'mozzarella_cheese': { unit: 'g', amount: 40, category: 'cheese', cost: 0.10 },
        'provolone_cheese': { unit: 'g', amount: 40, category: 'cheese', cost: 0.20 },
        'blue_cheese': { unit: 'g', amount: 30, category: 'cheese', cost: 0.25 },
        'parmesan_cheese': { unit: 'g', amount: 25, category: 'cheese', cost: 0.18 },
        'red_onion': { unit: 'g', amount: 20, category: 'vegetable', cost: 0.05 },
        'fig_jam': { unit: 'ml', amount: 15, category: 'sauce', cost: 0.20 }
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
    'Spud Pizza': {
      ingredients: {
        'potato': { unit: 'g', amount: 80, category: 'vegetable', cost: 0.08 },
        'onion': { unit: 'g', amount: 30, category: 'vegetable', cost: 0.04 },
        'rosemary': { unit: 'g', amount: 5, category: 'herb', cost: 0.10 },
        'chilli_oil': { unit: 'ml', amount: 10, category: 'oil', cost: 0.15 },
        'parmesan_cheese': { unit: 'g', amount: 25, category: 'cheese', cost: 0.18 }
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
    },
    'THE CHAMP': {
      ingredients: {
        'pepperoni': { unit: 'g', amount: 60, category: 'meat', cost: 0.18 },
        'sourdough': { unit: 'g', amount: 50, category: 'dough', cost: 0.15 },
        'red_onion': { unit: 'g', amount: 30, category: 'vegetable', cost: 0.05 },
        'parmesan': { unit: 'g', amount: 25, category: 'cheese', cost: 0.20 }
      }
    },
    'LEKKER\'IZZA': {
      ingredients: {
        'anchovies': { unit: 'g', amount: 30, category: 'fish', cost: 0.25 },
        'olives': { unit: 'g', amount: 25, category: 'vegetable', cost: 0.15 },
        'mozzarella': { unit: 'g', amount: 80, category: 'cheese', cost: 0.22 },
        'basil': { unit: 'g', amount: 10, category: 'herb', cost: 0.10 }
      }
    },
    'CHICK TICK BOOM!': {
      ingredients: {
        'chicken_tikka': { unit: 'g', amount: 70, category: 'meat', cost: 0.25 },
        'peppadew': { unit: 'g', amount: 30, category: 'vegetable', cost: 0.15 },
        'coriander': { unit: 'g', amount: 10, category: 'herb', cost: 0.12 }
      }
    },
    'MISH-MASH': {
      ingredients: {
        'parma_ham': { unit: 'g', amount: 50, category: 'meat', cost: 0.30 },
        'fig_jam': { unit: 'ml', amount: 30, category: 'sauce', cost: 0.20 },
        'goats_cheese': { unit: 'g', amount: 40, category: 'cheese', cost: 0.25 },
        'rocket': { unit: 'g', amount: 15, category: 'vegetable', cost: 0.10 }
      }
    },
    'POPPA\'S': {
      ingredients: {
        'bacon': { unit: 'g', amount: 40, category: 'meat', cost: 0.20 },
        'pepperoni': { unit: 'g', amount: 40, category: 'meat', cost: 0.18 },
        'biltong': { unit: 'g', amount: 30, category: 'meat', cost: 0.35 },
        'peppadews': { unit: 'g', amount: 20, category: 'vegetable', cost: 0.12 },
        'mozzarella': { unit: 'g', amount: 60, category: 'cheese', cost: 0.15 },
        'red_onion': { unit: 'g', amount: 30, category: 'vegetable', cost: 0.05 },
        'chutney': { unit: 'ml', amount: 15, category: 'sauce', cost: 0.10 },
        'feta': { unit: 'g', amount: 30, category: 'cheese', cost: 0.18 }
      }
    },
    'PIG IN PARADISE': {
      ingredients: {
        'cheese': { unit: 'g', amount: 70, category: 'cheese', cost: 0.16 },
        'bacon': { unit: 'g', amount: 50, category: 'meat', cost: 0.22 },
        'caramelised_pineapple': { unit: 'g', amount: 50, category: 'fruit', cost: 0.15 },
        'sourdough_base': { unit: 'ball', amount: 1, category: 'dough', cost: 0.25 }
      }
    },
    'ARTICHOKE & HAM': {
      ingredients: {
        'mozzarella': { unit: 'g', amount: 60, category: 'cheese', cost: 0.15 },
        'ham': { unit: 'g', amount: 50, category: 'meat', cost: 0.18 },
        'mushrooms': { unit: 'g', amount: 40, category: 'vegetable', cost: 0.12 },
        'artichoke': { unit: 'g', amount: 40, category: 'vegetable', cost: 0.22 },
        'olives': { unit: 'g', amount: 20, category: 'vegetable', cost: 0.15 }
      }
    },
    'GLAZE OF GLORY': {
      ingredients: {
        'balsamic_glaze': { unit: 'ml', amount: 20, category: 'sauce', cost: 0.18 },
        'bacon': { unit: 'g', amount: 50, category: 'meat', cost: 0.22 },
        'feta': { unit: 'g', amount: 40, category: 'cheese', cost: 0.20 },
        'red_onion': { unit: 'g', amount: 30, category: 'vegetable', cost: 0.05 }
      }
    },
    'MEDITERRANEAN': {
      ingredients: {
        'mushrooms': { unit: 'g', amount: 40, category: 'vegetable', cost: 0.12 },
        'zucchini': { unit: 'g', amount: 40, category: 'vegetable', cost: 0.08 },
        'olives': { unit: 'g', amount: 25, category: 'vegetable', cost: 0.15 },
        'sun_dried_tomatoes': { unit: 'g', amount: 30, category: 'vegetable', cost: 0.20 },
        'herbs': { unit: 'g', amount: 5, category: 'herb', cost: 0.10 },
        'hummus': { unit: 'ml', amount: 30, category: 'sauce', cost: 0.16 },
        'olive_oil': { unit: 'ml', amount: 15, category: 'oil', cost: 0.08 }
      }
    },
    'MARGIE': {
      ingredients: {
        'mozzarella': { unit: 'g', amount: 80, category: 'cheese', cost: 0.18 },
        'basil': { unit: 'g', amount: 10, category: 'herb', cost: 0.10 },
        'tomato_sauce': { unit: 'ml', amount: 80, category: 'sauce', cost: 0.05 }
      }
    },
    'OWEN!': {
      ingredients: {
        'pizza_sauce': { unit: 'ml', amount: 60, category: 'sauce', cost: 0.08 },
        'shredded_cheese': { unit: 'g', amount: 100, category: 'cheese', cost: 0.22 },
        'sourdough_base': { unit: 'ball', amount: 1, category: 'dough', cost: 0.25 }
      }
    },
    'CAPRESE': {
      ingredients: {
        'mozzarella': { unit: 'g', amount: 80, category: 'cheese', cost: 0.20 },
        'tomatoes': { unit: 'g', amount: 60, category: 'vegetable', cost: 0.10 },
        'balsamic_glaze': { unit: 'ml', amount: 15, category: 'sauce', cost: 0.15 },
        'basil_pesto': { unit: 'ml', amount: 20, category: 'sauce', cost: 0.22 }
      }
    },
    'VEGAN HARVEST': {
      ingredients: {
        'mushrooms': { unit: 'g', amount: 40, category: 'vegetable', cost: 0.12 },
        'zucchini': { unit: 'g', amount: 40, category: 'vegetable', cost: 0.08 },
        'olives': { unit: 'g', amount: 25, category: 'vegetable', cost: 0.15 },
        'sun_dried_tomatoes': { unit: 'g', amount: 30, category: 'vegetable', cost: 0.20 },
        'herbs': { unit: 'g', amount: 5, category: 'herb', cost: 0.10 },
        'hummus': { unit: 'ml', amount: 30, category: 'sauce', cost: 0.16 },
        'olive_oil': { unit: 'ml', amount: 15, category: 'oil', cost: 0.08 }
      }
    },
    'VEG SPECIAL': {
      ingredients: {
        'mushrooms': { unit: 'g', amount: 50, category: 'vegetable', cost: 0.15 },
        'bell_peppers': { unit: 'g', amount: 45, category: 'vegetable', cost: 0.12 },
        'olives': { unit: 'g', amount: 25, category: 'vegetable', cost: 0.15 },
        'cherry_tomatoes': { unit: 'g', amount: 40, category: 'vegetable', cost: 0.10 },
        'caramelized_onions': { unit: 'g', amount: 35, category: 'vegetable', cost: 0.08 },
        'mozzarella': { unit: 'g', amount: 120, category: 'cheese', cost: 0.25 }
      }
    },
    'BUILD YOUR OWN': {
      ingredients: {
        'sourdough_dough': { unit: 'ball', amount: 1, category: 'dough', cost: 12.50 },
        'tomato_sauce': { unit: 'ml', amount: 80, category: 'sauce', cost: 0.05 },
        'mozzarella_cheese': { unit: 'g', amount: 100, category: 'cheese', cost: 0.12 }
      }
    }
  }
};
