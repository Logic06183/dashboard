import React, { useState, useEffect } from 'react';
import useFirebaseOrders from '../hooks/useFirebaseOrders';
import { PIZZA_INGREDIENTS } from '../data/ingredients';

const InventoryManagement = ({ orders: propOrders = [] }) => {
  const { data: firebaseOrders = [], loading: ordersLoading } = useFirebaseOrders();
  
  // Combine orders from props and Firebase if available
  const orders = propOrders.length > 0 ? propOrders : firebaseOrders;
  const [inventory, setInventory] = useState({});
  const [activeView, setActiveView] = useState('current');
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState(null);

  // Load inventory data
  useEffect(() => {
    const loadInventory = async () => {
      try {
        setInventoryLoading(true);
        // Simulated inventory data
        const mockInventory = {
          'sourdough_dough': { amount: 50, unit: 'balls', category: 'dough', threshold: 20 },
          'tomato_sauce': { amount: 8, unit: 'liters', category: 'sauce', threshold: 3 },
          'mozzarella_cheese': { amount: 12, unit: 'kg', category: 'cheese', threshold: 5 },
          'pepperoni': { amount: 6, unit: 'kg', category: 'meat', threshold: 2 },
          'mushrooms': { amount: 4, unit: 'kg', category: 'vegetable', threshold: 2 },
          'fresh_basil': { amount: 1.5, unit: 'kg', category: 'herb', threshold: 0.5 }
        };
        setInventory(mockInventory);
        setInventoryLoading(false);
      } catch (error) {
        console.error('Error loading inventory:', error);
        setInventoryError('Failed to load inventory data');
        setInventoryLoading(false);
      }
    };
    loadInventory();
  }, []);

  // Check if stock is low
  const isLowStock = (ingredient) => {
    const item = inventory[ingredient];
    return item && item.amount <= (item.threshold || 0);
  };

  // Increment inventory item amount
  const handleIncrement = (ingredient, amount = 1) => {
    setInventory(prev => ({
      ...prev,
      [ingredient]: {
        ...prev[ingredient],
        amount: (prev[ingredient]?.amount || 0) + amount
      }
    }));
  };

  // Decrement inventory item amount
  const handleDecrement = (ingredient, amount = 1) => {
    setInventory(prev => ({
      ...prev,
      [ingredient]: {
        ...prev[ingredient],
        amount: Math.max(0, (prev[ingredient]?.amount || 0) - amount)
      }
    }));
  };

  if (inventoryLoading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Inventory Management</h2>
        <div className="flex items-center justify-center p-4">
          <p>Loading inventory data...</p>
        </div>
      </div>
    );
  }

  if (inventoryError) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Inventory Management</h2>
        <div className="p-4">
          <p className="text-red-600">Error: {inventoryError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Inventory Management</h2>
      
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveView('current')}
            className={activeView === 'current' ? 'font-bold' : ''}
          >
            Current Stock
          </button>
          <button
            onClick={() => setActiveView('usage')}
            className={activeView === 'usage' ? 'font-bold' : ''}
          >
            Usage Analysis
          </button>
          <button
            onClick={() => setActiveView('forecast')}
            className={activeView === 'forecast' ? 'font-bold' : ''}
          >
            Inventory Forecast
          </button>
        </div>
      </div>

      <div className="bg-white rounded p-4">
        {activeView === 'current' && (
          <div>
            <h3 className="font-semibold mb-4">Current Stock Levels</h3>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Ingredient</th>
                  <th className="text-left">Category</th>
                  <th className="text-left">Amount</th>
                  <th className="text-left">Unit</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(inventory).map(([ingredient, data]) => (
                  <tr key={ingredient}>
                    <td>{ingredient.replace(/_/g, ' ')}</td>
                    <td>{data.category}</td>
                    <td>{data.amount}</td>
                    <td>{data.unit}</td>
                    <td>{isLowStock(ingredient) ? 'Low Stock' : 'In Stock'}</td>
                    <td>
                      <button onClick={() => handleDecrement(ingredient)}>-</button>
                      <button onClick={() => handleIncrement(ingredient)} className="ml-2">+</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {activeView === 'usage' && (
          <div>
            <h3 className="font-semibold mb-4">Usage Analysis</h3>
            <p>Usage analysis will be implemented here.</p>
          </div>
        )}

        {activeView === 'forecast' && (
          <div>
            <h3 className="font-semibold mb-4">Inventory Forecast</h3>
            <p>Inventory forecast will be implemented here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryManagement;
