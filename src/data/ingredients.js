// Pizza ingredients database
export const PIZZA_INGREDIENTS = {
  base: {
    'sourdough_dough': { unit: 'ball', amount: 1, category: 'dough' },
    'tomato_sauce': { unit: 'ml', amount: 80, category: 'sauce' },
    'mozzarella_cheese': { unit: 'g', amount: 100, category: 'cheese' }
  },
  pizzas: {
    'Margherita': {
      ingredients: {
        'fresh_basil': { unit: 'g', amount: 10, category: 'herb' },
        'olive_oil': { unit: 'ml', amount: 10, category: 'oil' }
      }
    },
    'Pepperoni': {
      ingredients: {
        'pepperoni': { unit: 'g', amount: 60, category: 'meat' }
      }
    },
    'Vegetarian': {
      ingredients: {
        'mushrooms': { unit: 'g', amount: 40, category: 'vegetable' },
        'bell_peppers': { unit: 'g', amount: 40, category: 'vegetable' },
        'red_onion': { unit: 'g', amount: 30, category: 'vegetable' },
        'olives': { unit: 'g', amount: 20, category: 'vegetable' }
      }
    },
    'Hawaiian': {
      ingredients: {
        'ham': { unit: 'g', amount: 50, category: 'meat' },
        'pineapple': { unit: 'g', amount: 50, category: 'fruit' }
      }
    },
    'Meat Lovers': {
      ingredients: {
        'pepperoni': { unit: 'g', amount: 30, category: 'meat' },
        'sausage': { unit: 'g', amount: 30, category: 'meat' },
        'bacon': { unit: 'g', amount: 30, category: 'meat' },
        'ham': { unit: 'g', amount: 30, category: 'meat' }
      }
    }
  }
};
