// Pizza ingredients database - Updated with real measurements from John Dough's team
export const PIZZA_INGREDIENTS = {
  base: {
    'sourdough_dough': { unit: 'ball', amount: 1, category: 'dough', cost: 12.50 },
    // Note: Pizza sauce and mozzarella amounts vary per pizza, handled in pizza-specific ingredients
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
        'pizza_sauce': { unit: 'ml', amount: 60, category: 'sauce', cost: 0.05 }
      }
    },
    
    // Real measurements from John Dough's team
    'THE CHAMP': {
      ingredients: {
        'pepperoni': { unit: 'g', amount: 74, category: 'meat', cost: 0.18 },
        'red_onion': { unit: 'g', amount: 8, category: 'vegetable', cost: 0.04 },
        'parmesan': { unit: 'g', amount: 8, category: 'cheese', cost: 0.18 },
        'shredded_mozzarella': { unit: 'g', amount: 94, category: 'cheese', cost: 0.12 },
        'pizza_sauce': { unit: 'ml', amount: 60, category: 'sauce', cost: 0.05 }
      }
    },
    'PIG IN PARADISE': {
      ingredients: {
        'bacon': { unit: 'g', amount: 64, category: 'meat', cost: 0.14 },
        'caramelised_pineapple': { unit: 'g', amount: 130, category: 'fruit', cost: 0.08 },
        'shredded_mozzarella': { unit: 'g', amount: 94, category: 'cheese', cost: 0.12 },
        'pizza_sauce': { unit: 'ml', amount: 60, category: 'sauce', cost: 0.05 }
      }
    },
    'MARGIE': {
      ingredients: {
        'shredded_mozzarella': { unit: 'g', amount: 94, category: 'cheese', cost: 0.12 },
        'fresh_mozzarella': { unit: 'g', amount: 80, category: 'cheese', cost: 0.15 },
        'basil': { unit: 'g', amount: 3.5, category: 'herb', cost: 0.20 },
        'pizza_sauce': { unit: 'ml', amount: 60, category: 'sauce', cost: 0.05 }
      }
    },
    'MUSHROOM CLOUD': {
      ingredients: {
        'mushrooms': { unit: 'g', amount: 86, category: 'vegetable', cost: 0.08 },
        'goats_cheese': { unit: 'g', amount: 30, category: 'cheese', cost: 0.25 },
        'sunflower_seeds': { unit: 'g', amount: 2, category: 'topping', cost: 0.10 },
        'shredded_mozzarella': { unit: 'g', amount: 94, category: 'cheese', cost: 0.12 },
        'caramelised_onions': { unit: 'g', amount: 100, category: 'vegetable', cost: 0.08 },
        'chilli_oil': { unit: 'ml', amount: 2, category: 'oil', cost: 0.15 },
        'pizza_sauce': { unit: 'ml', amount: 60, category: 'sauce', cost: 0.05 }
      }
    },
    'SPUD': {
      ingredients: {
        'potato_slices': { unit: 'g', amount: 100, category: 'vegetable', cost: 0.08 },
        'shredded_mozzarella': { unit: 'g', amount: 94, category: 'cheese', cost: 0.12 },
        'caramelised_onions': { unit: 'g', amount: 76, category: 'vegetable', cost: 0.08 },
        'chilli_oil': { unit: 'ml', amount: 2, category: 'oil', cost: 0.15 },
        'parmesan': { unit: 'g', amount: 8, category: 'cheese', cost: 0.18 }
      }
    },
    'MISH-MASH': {
      ingredients: {
        'parma_ham': { unit: 'g', amount: 40, category: 'meat', cost: 0.35 },
        'fig_preserve': { unit: 'g', amount: 45, category: 'spread', cost: 0.20 },
        'goats_cheese': { unit: 'g', amount: 30, category: 'cheese', cost: 0.25 },
        'shredded_mozzarella': { unit: 'g', amount: 94, category: 'cheese', cost: 0.12 },
        'rocket': { unit: 'g', amount: 20, category: 'vegetable', cost: 0.12 },
        'pizza_sauce': { unit: 'ml', amount: 60, category: 'sauce', cost: 0.05 }
      }
    },
    'LEKKER\'IZZA': {
      ingredients: {
        'bacon': { unit: 'g', amount: 64, category: 'meat', cost: 0.14 },
        'pepperoni': { unit: 'g', amount: 64, category: 'meat', cost: 0.18 },
        'peppadews': { unit: 'g', amount: 30, category: 'vegetable', cost: 0.15 },
        'shredded_mozzarella': { unit: 'g', amount: 94, category: 'cheese', cost: 0.12 },
        'feta': { unit: 'g', amount: 32, category: 'cheese', cost: 0.18 },
        'red_onion': { unit: 'g', amount: 8, category: 'vegetable', cost: 0.04 },
        'biltong': { unit: 'g', amount: 24, category: 'meat', cost: 0.35 },
        'chutney': { unit: 'g', amount: 12, category: 'sauce', cost: 0.10 },
        'pizza_sauce': { unit: 'ml', amount: 60, category: 'sauce', cost: 0.05 }
      }
    },
    'VEGAN HARVEST': {
      ingredients: {
        'mushrooms': { unit: 'g', amount: 55, category: 'vegetable', cost: 0.08 },
        'baby_marrow': { unit: 'g', amount: 40, category: 'vegetable', cost: 0.08 },
        'kalamata_olives': { unit: 'g', amount: 50, category: 'vegetable', cost: 0.10 },
        'sundried_tomatoes': { unit: 'g', amount: 60, category: 'vegetable', cost: 0.20 },
        'hummus': { unit: 'g', amount: 56, category: 'spread', cost: 0.16 },
        'pizza_sauce': { unit: 'ml', amount: 60, category: 'sauce', cost: 0.05 },
        'olive_oil': { unit: 'ml', amount: 2, category: 'oil', cost: 0.15 }
      }
    },
    'POPPA\'S': {
      ingredients: {
        'anchovies': { unit: 'g', amount: 34, category: 'fish', cost: 0.25 },
        'kalamata_olives': { unit: 'g', amount: 50, category: 'vegetable', cost: 0.10 },
        'fresh_mozzarella': { unit: 'g', amount: 80, category: 'cheese', cost: 0.15 },
        'shredded_mozzarella': { unit: 'g', amount: 94, category: 'cheese', cost: 0.12 },
        'basil': { unit: 'g', amount: 3.5, category: 'herb', cost: 0.20 },
        'pizza_sauce': { unit: 'ml', amount: 60, category: 'sauce', cost: 0.05 }
      }
    },
    'CHICK TICK BOOM': {
      ingredients: {
        'spicy_chicken_tikka': { unit: 'g', amount: 100, category: 'meat', cost: 0.25 },
        'peppadews': { unit: 'g', amount: 30, category: 'vegetable', cost: 0.15 },
        'fresh_coriander': { unit: 'g', amount: 3.5, category: 'herb', cost: 0.12 },
        'shredded_mozzarella': { unit: 'g', amount: 94, category: 'cheese', cost: 0.12 },
        'pizza_sauce': { unit: 'ml', amount: 60, category: 'sauce', cost: 0.05 }
      }
    },
    'ARTICHOKE & HAM': {
      ingredients: {
        'ham': { unit: 'g', amount: 40, category: 'meat', cost: 0.15 },
        'mushrooms': { unit: 'g', amount: 55, category: 'vegetable', cost: 0.08 },
        'artichoke_leaves': { unit: 'g', amount: 100, category: 'vegetable', cost: 0.22 },
        'olives': { unit: 'g', amount: 50, category: 'vegetable', cost: 0.10 },
        'shredded_mozzarella': { unit: 'g', amount: 94, category: 'cheese', cost: 0.12 },
        'pizza_sauce': { unit: 'ml', amount: 60, category: 'sauce', cost: 0.05 }
      }
    },
    'GLAZE OF GLORY': {
      ingredients: {
        'pizza_sauce': { unit: 'ml', amount: 60, category: 'sauce', cost: 0.05 },
        'shredded_mozzarella': { unit: 'g', amount: 94, category: 'cheese', cost: 0.12 },
        'bacon': { unit: 'g', amount: 64, category: 'meat', cost: 0.14 },
        'red_onion': { unit: 'g', amount: 8, category: 'vegetable', cost: 0.04 },
        'feta': { unit: 'g', amount: 32, category: 'cheese', cost: 0.18 },
        'balsamic_glaze': { unit: 'ml', amount: 10, category: 'sauce', cost: 0.15 }
      }
    },
    'MEDITERRANEAN': {
      ingredients: {
        'pizza_sauce': { unit: 'ml', amount: 60, category: 'sauce', cost: 0.05 },
        'shredded_mozzarella': { unit: 'g', amount: 94, category: 'cheese', cost: 0.12 },
        'baby_marrow': { unit: 'g', amount: 40, category: 'vegetable', cost: 0.08 },
        'olives': { unit: 'g', amount: 50, category: 'vegetable', cost: 0.10 },
        'sundried_tomatoes': { unit: 'g', amount: 60, category: 'vegetable', cost: 0.20 },
        'feta': { unit: 'g', amount: 32, category: 'cheese', cost: 0.18 },
        'garlic': { unit: 'g', amount: 2, category: 'vegetable', cost: 0.05 }
      }
    },
    'QUATTRO FORMAGGI': {
      ingredients: {
        'shredded_mozzarella': { unit: 'g', amount: 94, category: 'cheese', cost: 0.12 },
        'provolone': { unit: 'g', amount: 64, category: 'cheese', cost: 0.20 },
        'fig_preserve': { unit: 'g', amount: 45, category: 'spread', cost: 0.20 },
        'red_onion': { unit: 'g', amount: 8, category: 'vegetable', cost: 0.04 },
        'parmesan': { unit: 'g', amount: 10, category: 'cheese', cost: 0.18 },
        'blue_cheese': { unit: 'g', amount: 25, category: 'cheese', cost: 0.25 }
      }
    },
    'CAPRESE': {
      ingredients: {
        'pizza_sauce': { unit: 'ml', amount: 60, category: 'sauce', cost: 0.05 },
        'shredded_mozzarella': { unit: 'g', amount: 94, category: 'cheese', cost: 0.12 },
        'baby_tomatoes': { unit: 'g', amount: 100, category: 'vegetable', cost: 0.10 },
        'fresh_mozzarella': { unit: 'g', amount: 80, category: 'cheese', cost: 0.15 },
        'basil_pesto': { unit: 'g', amount: 6, category: 'sauce', cost: 0.22 },
        'balsamic_glaze': { unit: 'ml', amount: 10, category: 'sauce', cost: 0.15 },
        'basil': { unit: 'g', amount: 3.5, category: 'herb', cost: 0.20 }
      }
    },
    'OWEN': {
      ingredients: {
        'pizza_sauce': { unit: 'ml', amount: 60, category: 'sauce', cost: 0.05 },
        'shredded_mozzarella': { unit: 'g', amount: 94, category: 'cheese', cost: 0.12 }
      }
    },
    'BUILD YOUR OWN': {
      ingredients: {
        'pizza_sauce': { unit: 'ml', amount: 60, category: 'sauce', cost: 0.05 },
        'shredded_mozzarella': { unit: 'g', amount: 94, category: 'cheese', cost: 0.12 }
      }
    }
  },
  
  // Prep recipes - these create ingredients used in pizzas
  prepRecipes: {
    'caramelised_onions': {
      // Makes enough caramelised onions for multiple pizzas
      yield: 1000, // grams of finished product
      ingredients: {
        'white_onions': { unit: 'g', amount: 1000, category: 'vegetable', cost: 0.04 },
        'brown_sugar': { unit: 'g', amount: 80, category: 'baking', cost: 0.02 },
        'oil': { unit: 'ml', amount: 100, category: 'oil', cost: 0.08 },
        'balsamic_vinegar': { unit: 'ml', amount: 50, category: 'condiment', cost: 0.15 },
        'rosemary': { unit: 'g', amount: 10, category: 'herb', cost: 0.10 }
      }
    },
    'caramelised_pineapple': {
      yield: 800, // grams of finished product (after cooking/draining)
      ingredients: {
        'pineapple_tin': { unit: 'tin', amount: 1, category: 'fruit', cost: 25.00 },
        'brown_sugar': { unit: 'g', amount: 100, category: 'baking', cost: 0.02 },
        'oil': { unit: 'ml', amount: 100, category: 'oil', cost: 0.08 }
      }
    },
    'potato_slices': {
      yield: 1200, // grams of finished crispy potatoes
      ingredients: {
        'potatoes': { unit: 'g', amount: 1400, category: 'vegetable', cost: 0.06 },
        'oil': { unit: 'ml', amount: 100, category: 'oil', cost: 0.08 },
        'rosemary': { unit: 'g', amount: 30, category: 'herb', cost: 0.10 },
        'salt': { unit: 'g', amount: 10, category: 'seasoning', cost: 0.01 }
      }
    },
    'hummus': {
      yield: 500, // grams of finished hummus
      ingredients: {
        'chickpeas_tin': { unit: 'tin', amount: 2, category: 'legume', cost: 18.00 },
        'chickpea_liquid': { unit: 'ml', amount: 70, category: 'liquid', cost: 0.01 },
        'garlic': { unit: 'g', amount: 10, category: 'vegetable', cost: 0.05 },
        'salt': { unit: 'g', amount: 10, category: 'seasoning', cost: 0.01 },
        'tahini': { unit: 'g', amount: 80, category: 'paste', cost: 0.50 },
        'black_pepper': { unit: 'g', amount: 1, category: 'spice', cost: 0.05 },
        'lemon_juice': { unit: 'ml', amount: 3, category: 'citrus', cost: 0.02 }
      }
    }
  },
  
  // Cold drinks ingredient mapping
  coldDrinks: {
    'Coca-Cola 330ml': {
      ingredients: {
        'coke_syrup': { unit: 'ml', amount: 40, category: 'beverage_ingredient', cost: 0.08 },
        'carbonated_water': { unit: 'ml', amount: 290, category: 'beverage_ingredient', cost: 0.02 },
        'disposable_cup': { unit: 'piece', amount: 1, category: 'packaging', cost: 0.12 }
      }
    },
    'Coke Zero 330ml': {
      ingredients: {
        'coke_zero_syrup': { unit: 'ml', amount: 40, category: 'beverage_ingredient', cost: 0.08 },
        'carbonated_water': { unit: 'ml', amount: 290, category: 'beverage_ingredient', cost: 0.02 },
        'disposable_cup': { unit: 'piece', amount: 1, category: 'packaging', cost: 0.12 }
      }
    },
    'Sprite 330ml': {
      ingredients: {
        'sprite_syrup': { unit: 'ml', amount: 40, category: 'beverage_ingredient', cost: 0.07 },
        'carbonated_water': { unit: 'ml', amount: 290, category: 'beverage_ingredient', cost: 0.02 },
        'disposable_cup': { unit: 'piece', amount: 1, category: 'packaging', cost: 0.12 }
      }
    },
    'Fanta Orange 330ml': {
      ingredients: {
        'fanta_syrup': { unit: 'ml', amount: 40, category: 'beverage_ingredient', cost: 0.07 },
        'carbonated_water': { unit: 'ml', amount: 290, category: 'beverage_ingredient', cost: 0.02 },
        'disposable_cup': { unit: 'piece', amount: 1, category: 'packaging', cost: 0.12 }
      }
    },
    'Appletizer 330ml': {
      ingredients: {
        'appletizer_bottle': { unit: 'piece', amount: 1, category: 'beverage_finished', cost: 18.50 }
      }
    },
    'Grapetizer 330ml': {
      ingredients: {
        'grapetizer_bottle': { unit: 'piece', amount: 1, category: 'beverage_finished', cost: 18.50 }
      }
    },
    'Still Water 500ml': {
      ingredients: {
        'water_bottle_500ml': { unit: 'piece', amount: 1, category: 'beverage_finished', cost: 12.00 }
      }
    },
    'Sparkling Water 500ml': {
      ingredients: {
        'sparkling_water_bottle': { unit: 'piece', amount: 1, category: 'beverage_finished', cost: 14.00 }
      }
    },
    'Ice Tea 500ml': {
      ingredients: {
        'ice_tea_concentrate': { unit: 'ml', amount: 100, category: 'beverage_ingredient', cost: 0.15 },
        'water': { unit: 'ml', amount: 400, category: 'beverage_ingredient', cost: 0.01 },
        'ice': { unit: 'g', amount: 50, category: 'beverage_ingredient', cost: 0.02 },
        'disposable_cup_500ml': { unit: 'piece', amount: 1, category: 'packaging', cost: 0.15 }
      }
    },
    'Red Bull 250ml': {
      ingredients: {
        'red_bull_can': { unit: 'piece', amount: 1, category: 'beverage_finished', cost: 25.00 }
      }
    }
  },
  
  // Pizza name mapping for order processing
  pizzaNameMap: {
    // Map various order names to our standardized pizza names
    'The Champ': 'THE CHAMP',
    'Pig in Paradise': 'PIG IN PARADISE', 
    'Margie Pizza': 'MARGIE',
    'Margie': 'MARGIE',
    'Mushroom Cloud Pizza': 'MUSHROOM CLOUD',
    'Mushroom Cloud': 'MUSHROOM CLOUD',
    'Spud Pizza': 'SPUD',
    'Spud': 'SPUD',
    'Mish-Mash Pizza': 'MISH-MASH',
    'Mish-Mash': 'MISH-MASH',
    'Lekker\'izza Pizza': 'LEKKER\'IZZA',
    'Lekkerizza': 'LEKKER\'IZZA',
    'Vegan Harvest Pizza': 'VEGAN HARVEST',
    'Vegan Harvest': 'VEGAN HARVEST',
    'Poppa\'s Pizza': 'POPPA\'S',
    'Poppa': 'POPPA\'S',
    'Chick Tick Boom': 'CHICK TICK BOOM',
    'Artichoke & Ham': 'ARTICHOKE & HAM',
    'Glaze of Glory': 'GLAZE OF GLORY',
    'Mediterranean': 'MEDITERRANEAN',
    'Quattro Formaggi': 'QUATTRO FORMAGGI',
    'Caprese': 'CAPRESE',
    'Owen': 'OWEN'
  }
};