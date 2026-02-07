/**
 * EasyStockEntry.js
 * SUPER SIMPLE inventory entry interface for staff
 * No confusing dropdowns or complex features - just type in the numbers!
 */

import React, { useState, useEffect } from 'react';
import { PIZZA_INGREDIENTS } from '../data/ingredients';
import FirebaseService from '../services/FirebaseService';
import TutorialOverlay from './TutorialOverlay';

const EasyStockEntry = () => {
  const [stockLevels, setStockLevels] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Tutorial steps for first-time users
  const tutorialSteps = [
    {
      icon: '👋',
      title: 'Welcome to Daily Stock Entry!',
      description: 'This is where you update your ingredient inventory levels. Let\'s take a quick tour to show you how easy it is!',
      tips: [
        'This tutorial only shows once',
        'You can restart it anytime by clicking the info button'
      ]
    },
    {
      icon: '📦',
      title: 'All Your Ingredients in One Place',
      description: 'All 69 ingredients are organized into categories like Dough, Sauce, Cheese, Meat, Vegetables, and more. Scroll down to see them all organized by type.',
      tips: [
        'Categories have color-coded headers',
        'Each category shows how many items it contains'
      ]
    },
    {
      icon: '🔍',
      title: 'Search for Ingredients',
      description: 'Use the search box at the top to quickly find specific ingredients. Just type "mozzarella" or "tomato" and the list will filter automatically.',
      tips: [
        'Search works instantly as you type',
        'Search by ingredient name or category'
      ]
    },
    {
      icon: '➕',
      title: 'Update Stock Levels',
      description: 'Each ingredient has quick buttons (+1, +10, +100) and (-1, -10) to adjust quantities quickly. Or type the exact amount in the input box below.',
      tips: [
        'Use buttons for quick adjustments',
        'Type exact numbers for large quantities',
        'Current stock shows in big numbers'
      ]
    },
    {
      icon: '💾',
      title: 'Save Your Changes',
      description: 'When you\'re done updating all ingredients, click the big green "Save All Stock Levels" button at the bottom. All your changes will be saved to Firebase!',
      tips: [
        'The save button is always visible at the bottom',
        'You must click Save for changes to take effect',
        'A success message will confirm when saved'
      ]
    },
    {
      icon: '✅',
      title: 'You\'re All Set!',
      description: 'That\'s it! You now know how to manage your inventory. Remember: the system automatically deducts ingredients when orders are placed, so you just need to add new stock when it arrives.',
      tips: [
        'Stock deducts automatically with each order',
        'Update stock when new deliveries arrive',
        'Check regularly for low stock items'
      ]
    }
  ];

  // Load current stock on mount
  useEffect(() => {
    loadCurrentStock();
  }, []);

  const loadCurrentStock = async () => {
    try {
      setLoading(true);
      const currentStock = await FirebaseService.getInventory();

      // Initialize all ingredients from recipes
      const allIngredients = {};

      // Helper function to add ingredient
      const addIngredient = (ingredientName, data) => {
        if (!allIngredients[ingredientName]) {
          allIngredients[ingredientName] = {
            name: ingredientName,
            amount: currentStock[ingredientName]?.amount || 0,
            unit: data.unit || 'g',
            category: data.category || 'other'
          };
        }
      };

      // Get all unique ingredients from pizza recipes
      Object.values(PIZZA_INGREDIENTS.pizzas || {}).forEach(pizza => {
        if (pizza.ingredients) {
          Object.entries(pizza.ingredients).forEach(([ingredientName, data]) => {
            addIngredient(ingredientName, data);
          });
        }
      });

      // Add base ingredients (dough, etc.)
      Object.entries(PIZZA_INGREDIENTS.base || {}).forEach(([ingredientName, data]) => {
        addIngredient(ingredientName, data);
      });

      // Add all prep recipe ingredients (raw materials for caramelised onions, hummus, etc.)
      Object.values(PIZZA_INGREDIENTS.prepRecipes || {}).forEach(recipe => {
        if (recipe.ingredients) {
          Object.entries(recipe.ingredients).forEach(([ingredientName, data]) => {
            addIngredient(ingredientName, data);
          });
        }
      });

      // Add all cold drink ingredients (syrups, bottles, cups, etc.)
      Object.values(PIZZA_INGREDIENTS.coldDrinks || {}).forEach(drink => {
        if (drink.ingredients) {
          Object.entries(drink.ingredients).forEach(([ingredientName, data]) => {
            addIngredient(ingredientName, data);
          });
        }
      });

      setStockLevels(allIngredients);
    } catch (error) {
      console.error('Error loading stock:', error);
      setMessage('⚠️ Error loading current stock');
    } finally {
      setLoading(false);
    }
  };

  // Update a stock amount
  const updateAmount = (ingredientName, newAmount) => {
    setStockLevels(prev => ({
      ...prev,
      [ingredientName]: {
        ...prev[ingredientName],
        amount: Math.max(0, parseFloat(newAmount) || 0)
      }
    }));
  };

  // Quick adjust (+/- buttons)
  const adjustAmount = (ingredientName, change) => {
    const current = stockLevels[ingredientName]?.amount || 0;
    updateAmount(ingredientName, current + change);
  };

  // Save to Firebase
  const saveStock = async () => {
    try {
      setSaving(true);
      setMessage('');

      // Convert to format expected by Firebase
      const inventoryData = {};
      Object.entries(stockLevels).forEach(([name, data]) => {
        inventoryData[name] = {
          amount: data.amount,
          unit: data.unit,
          category: data.category,
          threshold: data.threshold || 100
        };
      });

      await FirebaseService.updateInventory(inventoryData);

      setMessage('✅ Stock levels saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving stock:', error);
      setMessage('❌ Error saving stock. Please try again.');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Group ingredients by category
  const categorizedIngredients = {};
  Object.entries(stockLevels).forEach(([name, data]) => {
    const category = data.category || 'other';
    if (!categorizedIngredients[category]) {
      categorizedIngredients[category] = [];
    }
    categorizedIngredients[category].push({ name, ...data });
  });

  // Sort categories - organized logically for daily stock entry
  const categoryOrder = [
    'dough', 'sauce', 'cheese', 'meat', 'fish', 'vegetable', 'herb', 'fruit',
    'topping', 'oil', 'spread', 'paste',
    'baking', 'seasoning', 'spice', 'condiment', 'citrus',
    'legume', 'liquid',
    'beverage_ingredient', 'beverage_finished', 'packaging',
    'other'
  ];
  const sortedCategories = Object.keys(categorizedIngredients).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  // Format ingredient name for display
  const formatName = (name) => {
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Filter ingredients by search
  const filterIngredients = (ingredients) => {
    if (!searchTerm) return ingredients;
    return ingredients.filter(ing =>
      formatName(ing.name).toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading current stock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      {/* Tutorial Overlay */}
      <TutorialOverlay
        steps={tutorialSteps}
        tutorialKey="stock_entry"
        autoStart={true}
      />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📦 Daily Stock Entry</h1>
          <p className="text-gray-600 text-lg">
            Enter how much of each ingredient you currently have in stock. Type in the numbers and click Save.
          </p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <p className="text-lg font-semibold">{message}</p>
          </div>
        )}

        {/* Search Box */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <input
            type="text"
            placeholder="🔍 Search for an ingredient (e.g., 'mozzarella', 'tomato')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Ingredients by Category */}
        <div className="space-y-6">
          {sortedCategories.map(category => {
            const ingredients = filterIngredients(categorizedIngredients[category]);
            if (ingredients.length === 0) return null;

            return (
              <div key={category} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Category Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                  <h2 className="text-2xl font-bold text-white capitalize">
                    {category === 'dough' && '🍞'}
                    {category === 'sauce' && '🍅'}
                    {category === 'cheese' && '🧀'}
                    {category === 'meat' && '🥓'}
                    {category === 'fish' && '🐟'}
                    {category === 'vegetable' && '🥬'}
                    {category === 'herb' && '🌿'}
                    {category === 'fruit' && '🍍'}
                    {category === 'topping' && '✨'}
                    {category === 'oil' && '🫒'}
                    {category === 'spread' && '🥜'}
                    {category === 'paste' && '🥫'}
                    {category === 'baking' && '🧁'}
                    {category === 'seasoning' && '🧂'}
                    {category === 'spice' && '🌶️'}
                    {category === 'condiment' && '🍯'}
                    {category === 'citrus' && '🍋'}
                    {category === 'legume' && '🫘'}
                    {category === 'liquid' && '💧'}
                    {category === 'beverage_ingredient' && '🥤'}
                    {category === 'beverage_finished' && '🍾'}
                    {category === 'packaging' && '🥤'}
                    {category === 'other' && '📦'}
                    {' '}{category.replace(/_/g, ' ')}
                  </h2>
                </div>

                {/* Ingredients List */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ingredients.map(ingredient => (
                      <div
                        key={ingredient.name}
                        className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                      >
                        {/* Ingredient Name */}
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {formatName(ingredient.name)}
                          </h3>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {ingredient.unit}
                          </span>
                        </div>

                        {/* Current Amount Display */}
                        <div className="mb-3">
                          <div className="text-3xl font-bold text-center py-2 bg-gray-50 rounded">
                            {ingredient.amount} <span className="text-lg text-gray-500">{ingredient.unit}</span>
                          </div>
                        </div>

                        {/* Quick Adjust Buttons */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <button
                            onClick={() => adjustAmount(ingredient.name, -10)}
                            disabled={ingredient.amount === 0}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded font-semibold hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            -10
                          </button>
                          <button
                            onClick={() => adjustAmount(ingredient.name, -1)}
                            disabled={ingredient.amount === 0}
                            className="px-3 py-2 bg-orange-100 text-orange-700 rounded font-semibold hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => updateAmount(ingredient.name, 0)}
                            className="px-3 py-2 bg-gray-100 text-gray-700 rounded font-semibold hover:bg-gray-200"
                          >
                            Clear
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <button
                            onClick={() => adjustAmount(ingredient.name, 1)}
                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded font-semibold hover:bg-blue-200"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => adjustAmount(ingredient.name, 10)}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded font-semibold hover:bg-green-200"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => adjustAmount(ingredient.name, 100)}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded font-semibold hover:bg-green-200"
                          >
                            +100
                          </button>
                        </div>

                        {/* Direct Number Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Or type exact amount:
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={ingredient.amount}
                            onChange={(e) => updateAmount(ingredient.name, e.target.value)}
                            className="w-full px-4 py-2 text-lg border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-center font-semibold"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save Button - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 p-4 shadow-lg z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="text-gray-600">
              <p className="font-semibold">
                {Object.keys(stockLevels).length} ingredients ready to save
              </p>
            </div>
            <button
              onClick={saveStock}
              disabled={saving}
              className="px-8 py-4 bg-green-500 text-white text-xl font-bold rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg transition-colors"
            >
              {saving ? '💾 Saving...' : '💾 Save All Stock Levels'}
            </button>
          </div>
        </div>

        {/* Bottom padding to prevent content being hidden by fixed button */}
        <div className="h-24"></div>
      </div>
    </div>
  );
};

export default EasyStockEntry;
