import React, { useState, useEffect } from 'react';
import { MdAdd, MdRemove, MdWarning } from 'react-icons/md';

const InventoryManagement = () => {
  const [inventory, setInventory] = useState(() => {
    const savedInventory = localStorage.getItem('inventory');
    return savedInventory ? JSON.parse(savedInventory) : {
      dough: { amount: 100, unit: 'balls', threshold: 20 },
      sauce: { amount: 50, unit: 'liters', threshold: 10 },
      cheese: { amount: 40, unit: 'kg', threshold: 8 },
      pepperoni: { amount: 30, unit: 'kg', threshold: 5 },
      mushrooms: { amount: 25, unit: 'kg', threshold: 5 },
      onions: { amount: 20, unit: 'kg', threshold: 4 },
      bellPeppers: { amount: 15, unit: 'kg', threshold: 3 },
      olives: { amount: 10, unit: 'kg', threshold: 2 }
    };
  });

  useEffect(() => {
    localStorage.setItem('inventory', JSON.stringify(inventory));
  }, [inventory]);

  const updateInventory = (item, change) => {
    setInventory(prev => ({
      ...prev,
      [item]: {
        ...prev[item],
        amount: Math.max(0, prev[item].amount + change)
      }
    }));
  };

  const isLowStock = (item) => {
    return inventory[item].amount <= inventory[item].threshold;
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Inventory Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(inventory).map(([item, { amount, unit, threshold }]) => (
          <div 
            key={item}
            className={`p-4 rounded-lg border ${
              isLowStock(item) ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium capitalize">{item}</h3>
              {isLowStock(item) && (
                <MdWarning className="text-red-500 w-5 h-5" />
              )}
            </div>
            <div className="text-gray-600 mb-4">
              {amount} {unit}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateInventory(item, -1)}
                className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-600"
              >
                <MdRemove />
              </button>
              <button
                onClick={() => updateInventory(item, 1)}
                className="p-2 rounded-full bg-green-100 hover:bg-green-200 text-green-600"
              >
                <MdAdd />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryManagement;
