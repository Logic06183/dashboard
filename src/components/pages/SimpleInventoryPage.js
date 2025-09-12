/**
 * SimpleInventoryPage.js
 * Easy-to-use inventory management page for the team
 */

import React, { useState, useEffect } from 'react';
import SimpleInventoryInput from '../SimpleInventoryInput';
import FirebaseService from '../../services/FirebaseService';

const SimpleInventoryPage = () => {
  const [currentInventory, setCurrentInventory] = useState({});
  const [loading, setLoading] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [updateMessage, setUpdateMessage] = useState('');

  // Load current inventory
  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const inventory = await FirebaseService.getInventory();
      setCurrentInventory(inventory);
      
      // Check last updated time
      const lastUpdate = localStorage.getItem('lastInventoryUpdate');
      if (lastUpdate) {
        setLastUpdated(new Date(lastUpdate));
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
      setUpdateMessage('Error loading inventory. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Save inventory updates
  const handleSaveInventory = async (newInventory) => {
    try {
      await FirebaseService.updateInventory(newInventory);
      setCurrentInventory(newInventory);
      setShowInput(false);
      setLastUpdated(new Date());
      localStorage.setItem('lastInventoryUpdate', new Date().toISOString());
      
      const changedCount = Object.keys(newInventory).length;
      setUpdateMessage(`✅ Successfully updated ${changedCount} ingredients!`);
      
      // Clear message after 5 seconds
      setTimeout(() => setUpdateMessage(''), 5000);
    } catch (error) {
      console.error('Error saving inventory:', error);
      setUpdateMessage('❌ Error saving inventory. Please try again.');
      setTimeout(() => setUpdateMessage(''), 5000);
    }
  };

  // Get stock summary
  const getStockSummary = () => {
    const items = Object.values(currentInventory);
    return {
      total: items.length,
      outOfStock: items.filter(item => item.amount === 0).length,
      lowStock: items.filter(item => item.amount > 0 && item.amount <= (item.threshold || 10)).length,
      goodStock: items.filter(item => item.amount > (item.threshold || 10)).length
    };
  };

  const stockSummary = getStockSummary();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading current stock levels...</p>
          </div>
        </div>
      </div>
    );
  }

  if (showInput) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SimpleInventoryInput
          currentInventory={currentInventory}
          onSave={handleSaveInventory}
          onClose={() => setShowInput(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">📦 Current Stock Levels</h1>
          <p className="text-gray-600">
            Keep track of what's currently in the kitchen. Click "Update Stock" to add new deliveries or adjust quantities.
          </p>
        </div>

        {/* Status Messages */}
        {updateMessage && (
          <div className={`mb-6 p-4 rounded-lg border ${
            updateMessage.includes('✅') 
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {updateMessage}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stockSummary.total}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stockSummary.goodStock}</div>
              <div className="text-sm text-gray-600">Good Stock</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stockSummary.lowStock}</div>
              <div className="text-sm text-gray-600">Low Stock</div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stockSummary.outOfStock}</div>
              <div className="text-sm text-gray-600">Out of Stock</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap gap-4">
          <button
            onClick={() => setShowInput(true)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium flex items-center"
          >
            <span className="mr-2">📦</span>
            Update Stock Levels
          </button>
          <button
            onClick={() => loadInventory()}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center"
          >
            <span className="mr-2">🔄</span>
            Refresh
          </button>
        </div>

        {/* Last Updated Info */}
        {lastUpdated && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Last Updated:</strong> {lastUpdated.toLocaleDateString('en-ZA')} at {lastUpdated.toLocaleTimeString('en-ZA', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        )}

        {/* Quick Stock Overview */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">📊 Stock Overview</h2>
            
            {/* Critical Items */}
            {stockSummary.outOfStock > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-medium text-red-800 mb-2">🚨 Out of Stock ({stockSummary.outOfStock} items)</h3>
                <div className="text-sm text-red-700">
                  {Object.entries(currentInventory)
                    .filter(([, item]) => item.amount === 0)
                    .slice(0, 5)
                    .map(([ingredient]) => (
                      <div key={ingredient} className="mb-1">
                        • {ingredient.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    ))
                  }
                  {stockSummary.outOfStock > 5 && (
                    <div className="font-medium">...and {stockSummary.outOfStock - 5} more items</div>
                  )}
                </div>
              </div>
            )}

            {/* Low Stock Items */}
            {stockSummary.lowStock > 0 && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h3 className="font-medium text-orange-800 mb-2">⚠️ Low Stock ({stockSummary.lowStock} items)</h3>
                <div className="text-sm text-orange-700">
                  {Object.entries(currentInventory)
                    .filter(([, item]) => item.amount > 0 && item.amount <= (item.threshold || 10))
                    .slice(0, 5)
                    .map(([ingredient, item]) => (
                      <div key={ingredient} className="mb-1">
                        • {ingredient.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {item.amount} {item.unit}
                      </div>
                    ))
                  }
                  {stockSummary.lowStock > 5 && (
                    <div className="font-medium">...and {stockSummary.lowStock - 5} more items</div>
                  )}
                </div>
              </div>
            )}

            {/* All Good */}
            {stockSummary.outOfStock === 0 && stockSummary.lowStock === 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="text-green-800">
                  <div className="text-4xl mb-2">🎉</div>
                  <h3 className="font-medium mb-1">All Stock Levels Look Good!</h3>
                  <p className="text-sm">No items are out of stock or running low.</p>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">💡 How to Use This Page</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Click "Update Stock Levels" to add new deliveries or adjust quantities</li>
                <li>• Use the + and - buttons to quickly adjust amounts</li>
                <li>• The system automatically tracks what gets used for orders</li>
                <li>• Red items are completely out of stock and need immediate attention</li>
                <li>• Orange items are running low and should be reordered soon</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleInventoryPage;