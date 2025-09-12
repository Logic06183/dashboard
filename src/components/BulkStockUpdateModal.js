import React, { useState, useEffect, useMemo } from 'react';
import { PIZZA_INGREDIENTS } from '../data/ingredients';

const BulkStockUpdateModal = ({ isOpen, onClose, currentInventory, onSave }) => {
  const [stockUpdates, setStockUpdates] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  // Initialize stock updates when modal opens
  useEffect(() => {
    if (isOpen && currentInventory) {
      const updates = {};
      Object.entries(currentInventory).forEach(([ingredient, data]) => {
        updates[ingredient] = {
          currentAmount: data.amount || 0,
          newAmount: data.amount || 0,
          unit: data.unit,
          category: data.category || 'other',
          selected: false,
          threshold: data.threshold || 10
        };
      });
      
      // Add any ingredients that might be in recipes but not in current inventory
      const allIngredients = new Set();
      
      // Add base ingredients
      Object.keys(PIZZA_INGREDIENTS.base).forEach(ingredient => {
        allIngredients.add(ingredient);
      });
      
      // Add pizza-specific ingredients
      Object.values(PIZZA_INGREDIENTS.pizzas).forEach(pizza => {
        if (pizza.ingredients) {
          Object.keys(pizza.ingredients).forEach(ingredient => {
            allIngredients.add(ingredient);
          });
        }
      });
      
      // Add cold drink ingredients
      if (PIZZA_INGREDIENTS.coldDrinks) {
        Object.values(PIZZA_INGREDIENTS.coldDrinks).forEach(drink => {
          if (drink.ingredients) {
            Object.keys(drink.ingredients).forEach(ingredient => {
              allIngredients.add(ingredient);
            });
          }
        });
      }
      
      // Add prep recipe ingredients
      if (PIZZA_INGREDIENTS.prepRecipes) {
        Object.values(PIZZA_INGREDIENTS.prepRecipes).forEach(recipe => {
          if (recipe.ingredients) {
            Object.keys(recipe.ingredients).forEach(ingredient => {
              allIngredients.add(ingredient);
            });
          }
        });
        // Also add the prep recipe outputs
        Object.keys(PIZZA_INGREDIENTS.prepRecipes).forEach(ingredient => {
          allIngredients.add(ingredient);
        });
      }
      
      // Add missing ingredients
      allIngredients.forEach(ingredient => {
        if (!updates[ingredient]) {
          // Try to get category from ingredient definitions
          let category = 'other';
          let unit = 'g';
          
          if (PIZZA_INGREDIENTS.base[ingredient]) {
            category = PIZZA_INGREDIENTS.base[ingredient].category;
            unit = PIZZA_INGREDIENTS.base[ingredient].unit;
          } else {
            // Search through pizza ingredients
            for (const pizza of Object.values(PIZZA_INGREDIENTS.pizzas)) {
              if (pizza.ingredients && pizza.ingredients[ingredient]) {
                category = pizza.ingredients[ingredient].category;
                unit = pizza.ingredients[ingredient].unit;
                break;
              }
            }
            
            // Search through cold drink ingredients
            if (category === 'other' && PIZZA_INGREDIENTS.coldDrinks) {
              for (const drink of Object.values(PIZZA_INGREDIENTS.coldDrinks)) {
                if (drink.ingredients && drink.ingredients[ingredient]) {
                  category = drink.ingredients[ingredient].category;
                  unit = drink.ingredients[ingredient].unit;
                  break;
                }
              }
            }
            
            // Search through prep recipes
            if (category === 'other' && PIZZA_INGREDIENTS.prepRecipes) {
              for (const recipe of Object.values(PIZZA_INGREDIENTS.prepRecipes)) {
                if (recipe.ingredients && recipe.ingredients[ingredient]) {
                  category = recipe.ingredients[ingredient].category;
                  unit = recipe.ingredients[ingredient].unit;
                  break;
                }
              }
            }
          }
          
          updates[ingredient] = {
            currentAmount: 0,
            newAmount: 0,
            unit: unit,
            category: category,
            selected: false,
            threshold: 10
          };
        }
      });
      
      setStockUpdates(updates);
    }
  }, [isOpen, currentInventory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(['all']);
    Object.values(stockUpdates).forEach(item => {
      cats.add(item.category);
    });
    return Array.from(cats).sort();
  }, [stockUpdates]);

  // Filter ingredients
  const filteredIngredients = useMemo(() => {
    let filtered = Object.entries(stockUpdates);
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(([, item]) => item.category === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(([ingredient]) => 
        ingredient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ingredient.replace(/_/g, ' ').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by selection if toggled
    if (showOnlySelected) {
      filtered = filtered.filter(([, item]) => item.selected);
    }
    
    return filtered.sort(([a], [b]) => a.localeCompare(b));
  }, [stockUpdates, selectedCategory, searchTerm, showOnlySelected]);

  const handleAmountChange = (ingredient, newAmount) => {
    const amount = Math.max(0, parseFloat(newAmount) || 0);
    setStockUpdates(prev => ({
      ...prev,
      [ingredient]: {
        ...prev[ingredient],
        newAmount: amount
      }
    }));
  };

  const handleSelectionToggle = (ingredient) => {
    setStockUpdates(prev => ({
      ...prev,
      [ingredient]: {
        ...prev[ingredient],
        selected: !prev[ingredient].selected
      }
    }));
  };

  const handleSelectAll = () => {
    const hasAnySelected = filteredIngredients.some(([, item]) => item.selected);
    setStockUpdates(prev => {
      const updated = { ...prev };
      filteredIngredients.forEach(([ingredient]) => {
        updated[ingredient] = {
          ...updated[ingredient],
          selected: !hasAnySelected
        };
      });
      return updated;
    });
  };

  const handleQuickSet = (amount) => {
    setStockUpdates(prev => {
      const updated = { ...prev };
      filteredIngredients.forEach(([ingredient, item]) => {
        if (item.selected) {
          updated[ingredient] = {
            ...updated[ingredient],
            newAmount: amount
          };
        }
      });
      return updated;
    });
  };

  const handleSave = () => {
    // Only save changed items
    const changes = {};
    Object.entries(stockUpdates).forEach(([ingredient, item]) => {
      if (item.newAmount !== item.currentAmount) {
        changes[ingredient] = {
          amount: item.newAmount,
          unit: item.unit,
          category: item.category,
          threshold: item.threshold
        };
      }
    });
    
    onSave(changes);
    onClose();
  };

  const getChangesCount = () => {
    return Object.values(stockUpdates).filter(item => 
      item.newAmount !== item.currentAmount
    ).length;
  };

  const getSelectedCount = () => {
    return filteredIngredients.filter(([, item]) => item.selected).length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] m-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold">Bulk Stock Update</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Controls */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium mb-1">Category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium mb-1">Search:</label>
                <input
                  type="text"
                  placeholder="Search ingredients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Show only selected */}
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showOnlySelected}
                    onChange={(e) => setShowOnlySelected(e.target.checked)}
                    className="mr-2"
                  />
                  Show only selected
                </label>
              </div>
            </div>

            {/* Bulk Actions */}
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {filteredIngredients.some(([, item]) => item.selected) ? 'Deselect All' : 'Select All'}
              </button>
              
              <span className="text-sm text-gray-600">
                {getSelectedCount()} selected
              </span>
              
              <div className="border-l pl-2 ml-2">
                <span className="text-sm mr-2">Quick set selected to:</span>
                {[0, 50, 100, 200, 500, 1000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => handleQuickSet(amount)}
                    className="px-2 py-1 mx-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ingredients Table */}
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="text-left p-2 border-b">Select</th>
                  <th className="text-left p-2 border-b">Ingredient</th>
                  <th className="text-left p-2 border-b">Category</th>
                  <th className="text-left p-2 border-b">Current</th>
                  <th className="text-left p-2 border-b">New Amount</th>
                  <th className="text-left p-2 border-b">Unit</th>
                  <th className="text-left p-2 border-b">Change</th>
                </tr>
              </thead>
              <tbody>
                {filteredIngredients.map(([ingredient, item]) => {
                  const change = item.newAmount - item.currentAmount;
                  const hasChange = change !== 0;
                  
                  return (
                    <tr 
                      key={ingredient} 
                      className={`hover:bg-gray-50 ${hasChange ? 'bg-yellow-50' : ''}`}
                    >
                      <td className="p-2 border-b">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => handleSelectionToggle(ingredient)}
                          className="rounded"
                        />
                      </td>
                      <td className="p-2 border-b capitalize font-medium">
                        {ingredient.replace(/_/g, ' ')}
                      </td>
                      <td className="p-2 border-b text-sm capitalize">
                        {item.category}
                      </td>
                      <td className="p-2 border-b">
                        {item.currentAmount}
                      </td>
                      <td className="p-2 border-b">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={item.newAmount}
                          onChange={(e) => handleAmountChange(ingredient, e.target.value)}
                          className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-2 border-b text-sm">
                        {item.unit}
                      </td>
                      <td className="p-2 border-b">
                        {hasChange && (
                          <span className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {change > 0 ? '+' : ''}{change.toFixed(1)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p className="text-sm">
              <strong>{getChangesCount()}</strong> ingredients have changes • 
              <strong> {filteredIngredients.length}</strong> ingredients shown
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={getChangesCount() === 0}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              Save Changes ({getChangesCount()})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkStockUpdateModal;