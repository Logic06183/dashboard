import React, { useState, useEffect, useMemo } from 'react';
import InventoryDeductionService from '../services/InventoryDeductionService';
import FirebaseService from '../services/FirebaseService';
import DailyNotificationService from '../services/DailyNotificationService';

const EndOfDayModal = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState(1); // 1: Review Orders, 2: Review Usage, 3: Confirm Changes
  const [completedOrders, setCompletedOrders] = useState([]);
  const [archivedOrders, setArchivedOrders] = useState([]);
  const [calculatedUsage, setCalculatedUsage] = useState({});
  const [currentInventory, setCurrentInventory] = useState({});
  const [projectedInventory, setProjectedInventory] = useState({});
  const [processing, setProcessing] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState(new Set());
  const [error, setError] = useState('');

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTodaysData();
    } else {
      // Reset state when modal closes
      setStep(1);
      setCompletedOrders([]);
      setArchivedOrders([]);
      setCalculatedUsage({});
      setSelectedOrderIds(new Set());
      setError('');
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTodaysData = async () => {
    try {
      setProcessing(true);
      setError('');

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Load current orders and archived orders
      const [currentOrders, archivedOrdersData, inventoryData] = await Promise.all([
        FirebaseService.getOrders(),
        FirebaseService.getArchivedOrders(),
        FirebaseService.getInventory()
      ]);

      // Filter today's completed orders (not yet processed)
      const todaysCompletedOrders = currentOrders.filter(order => {
        const orderDate = new Date(order.orderTime);
        const isToday = orderDate >= today && orderDate < tomorrow;
        const isCompleted = order.status === 'ready' || order.status === 'delivered' || 
                           (order.cooked && Array.isArray(order.cooked) && 
                            order.cooked.every(status => status === true));
        return isToday && isCompleted;
      });

      // Also get today's archived orders (already processed)
      const todaysArchivedOrders = archivedOrdersData.filter(order => {
        const orderDate = new Date(order.orderTime);
        return orderDate >= today && orderDate < tomorrow;
      });

      setCompletedOrders(todaysCompletedOrders);
      setArchivedOrders(todaysArchivedOrders);
      setCurrentInventory(inventoryData);

      // Pre-select all completed orders
      const allOrderIds = new Set(todaysCompletedOrders.map(order => order.id || order.orderId));
      setSelectedOrderIds(allOrderIds);

      // Calculate usage for pre-selected orders
      calculateUsageForOrders(todaysCompletedOrders, inventoryData);

    } catch (err) {
      setError(`Failed to load data: ${err.message}`);
      console.error('Error loading today\'s data:', err);
    } finally {
      setProcessing(false);
    }
  };

  const calculateUsageForOrders = (orders, inventory) => {
    const usage = InventoryDeductionService.calculateBatchIngredientUsage(orders);
    const projected = InventoryDeductionService.deductInventoryForOrders(orders, inventory);
    
    setCalculatedUsage(usage);
    setProjectedInventory(projected);
  };

  // Handle order selection changes
  const handleOrderSelection = (orderId) => {
    const newSelection = new Set(selectedOrderIds);
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId);
    } else {
      newSelection.add(orderId);
    }
    setSelectedOrderIds(newSelection);

    // Recalculate usage based on selected orders
    const selectedOrders = completedOrders.filter(order => 
      newSelection.has(order.id || order.orderId)
    );
    calculateUsageForOrders(selectedOrders, currentInventory);
  };

  const handleSelectAll = () => {
    if (selectedOrderIds.size === completedOrders.length) {
      setSelectedOrderIds(new Set()); // Deselect all
      setCalculatedUsage({});
      setProjectedInventory(currentInventory);
    } else {
      const allIds = new Set(completedOrders.map(order => order.id || order.orderId));
      setSelectedOrderIds(allIds); // Select all
      calculateUsageForOrders(completedOrders, currentInventory);
    }
  };

  const processEndOfDay = async () => {
    try {
      setProcessing(true);
      setError('');

      const selectedOrders = completedOrders.filter(order => 
        selectedOrderIds.has(order.id || order.orderId)
      );

      if (selectedOrders.length === 0) {
        setError('Please select at least one order to process');
        return;
      }

      // Process inventory deduction
      const result = await InventoryDeductionService.processEndOfDayInventoryDeduction(selectedOrders);

      // Archive the processed orders
      for (const order of selectedOrders) {
        try {
          await FirebaseService.archiveOrder(order.id || order.orderId);
        } catch (err) {
          console.warn(`Failed to archive order ${order.id || order.orderId}:`, err);
        }
      }

      console.log('End of day processing completed:', result);
      
      // Send daily notification after successful processing
      try {
        const notificationResult = await DailyNotificationService.sendDailyNotification(selectedOrders);
        console.log('Daily notification sent:', notificationResult);
      } catch (notificationError) {
        console.warn('Error sending daily notification:', notificationError);
        // Don't block the main process if notification fails
      }
      
      onComplete(result);
      onClose();

    } catch (err) {
      setError(`Failed to process end of day: ${err.message}`);
      console.error('Error processing end of day:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Get usage summary
  const usageSummary = useMemo(() => {
    const ingredients = Object.entries(calculatedUsage);
    const totalIngredients = ingredients.length;
    const highUsageIngredients = ingredients.filter(([, data]) => data.used > 100).length;
    
    return {
      totalIngredients,
      highUsageIngredients,
      ingredients: ingredients.sort(([, a], [, b]) => b.used - a.used)
    };
  }, [calculatedUsage]);

  // Get low stock warnings
  const lowStockWarnings = useMemo(() => {
    return InventoryDeductionService.getLowStockAlerts(projectedInventory);
  }, [projectedInventory]);

  const formatIngredientName = (ingredient) => {
    return ingredient.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString('en-ZA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return 'Invalid time';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] m-4">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold">End of Day Processing</h2>
            <p className="text-gray-600 mt-1">
              Step {step} of 3 - {step === 1 ? 'Select Orders' : step === 2 ? 'Review Usage' : 'Confirm Changes'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800">
              {error}
            </div>
          )}

          {/* Step 1: Select Orders */}
          {step === 1 && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Today's Completed Orders</h3>
                <p className="text-gray-600">
                  Select the orders that should be included in today's inventory deduction.
                </p>
              </div>

              <div className="mb-4">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {selectedOrderIds.size === completedOrders.length ? 'Deselect All' : 'Select All'}
                </button>
                <span className="ml-3 text-sm text-gray-600">
                  {selectedOrderIds.size} of {completedOrders.length} orders selected
                </span>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="text-left p-3 border-b">Select</th>
                      <th className="text-left p-3 border-b">Order ID</th>
                      <th className="text-left p-3 border-b">Customer</th>
                      <th className="text-left p-3 border-b">Time</th>
                      <th className="text-left p-3 border-b">Items</th>
                      <th className="text-left p-3 border-b">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedOrders.map(order => (
                      <tr key={order.id || order.orderId} className="hover:bg-gray-50">
                        <td className="p-3 border-b">
                          <input
                            type="checkbox"
                            checked={selectedOrderIds.has(order.id || order.orderId)}
                            onChange={() => handleOrderSelection(order.id || order.orderId)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-3 border-b font-mono text-sm">
                          {(order.id || order.orderId || '').slice(-8)}
                        </td>
                        <td className="p-3 border-b">
                          {order.customerName || 'Unknown'}
                        </td>
                        <td className="p-3 border-b">
                          {formatTime(order.orderTime)}
                        </td>
                        <td className="p-3 border-b">
                          {order.pizzas?.length || 0} pizzas, {order.coldDrinks?.length || 0} drinks
                        </td>
                        <td className="p-3 border-b">
                          R{(order.totalAmount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {archivedOrders.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-medium mb-2 text-gray-700">
                    Already Processed Today ({archivedOrders.length} orders)
                  </h4>
                  <p className="text-sm text-gray-600">
                    These orders have already been archived and their inventory deducted.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Review Usage */}
          {step === 2 && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Ingredient Usage Summary</h3>
                <p className="text-gray-600">
                  Review the calculated ingredient usage for {selectedOrderIds.size} selected orders.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Usage Table */}
                <div>
                  <h4 className="font-medium mb-3">Ingredients to be Deducted</h4>
                  <div className="max-h-80 overflow-y-auto border rounded">
                    <table className="w-full border-collapse">
                      <thead className="sticky top-0 bg-gray-50">
                        <tr>
                          <th className="text-left p-2 border-b">Ingredient</th>
                          <th className="text-left p-2 border-b">Usage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usageSummary.ingredients.map(([ingredient, data]) => (
                          <tr key={ingredient} className="hover:bg-gray-50">
                            <td className="p-2 border-b">
                              {formatIngredientName(ingredient)}
                            </td>
                            <td className="p-2 border-b">
                              {data.used.toFixed(1)} {data.unit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Stock Levels After Deduction */}
                <div>
                  <h4 className="font-medium mb-3">Stock Levels After Deduction</h4>
                  {lowStockWarnings.length > 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="font-medium text-yellow-800 mb-2">⚠️ Low Stock Warnings</p>
                      {lowStockWarnings.slice(0, 5).map(item => (
                        <div key={item.ingredient} className="text-sm text-yellow-700">
                          • {formatIngredientName(item.ingredient)}: {item.currentStock}{item.unit}
                          {item.urgency === 'critical' && <span className="text-red-600 ml-1">(OUT OF STOCK)</span>}
                        </div>
                      ))}
                      {lowStockWarnings.length > 5 && (
                        <div className="text-sm text-yellow-700 mt-1">
                          ...and {lowStockWarnings.length - 5} more items
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Summary:</strong> {usageSummary.totalIngredients} ingredients will be updated, 
                  {lowStockWarnings.length > 0 && <span> {lowStockWarnings.length} will be below threshold</span>}
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Confirm Changes */}
          {step === 3 && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Confirm End of Day Processing</h3>
                <p className="text-gray-600">
                  This will update your inventory and archive the selected orders. This action cannot be undone.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded mb-6">
                <h4 className="font-medium mb-3">What will happen:</h4>
                <ul className="space-y-2 text-sm">
                  <li>✓ Deduct ingredients from {selectedOrderIds.size} completed orders</li>
                  <li>✓ Update {usageSummary.totalIngredients} ingredient stock levels</li>
                  <li>✓ Archive {selectedOrderIds.size} orders to completed orders collection</li>
                  <li>✓ Generate low stock alerts for your team</li>
                </ul>
              </div>

              {lowStockWarnings.length > 0 && (
                <div className="bg-red-50 p-4 rounded mb-6">
                  <h4 className="font-medium text-red-800 mb-3">⚠️ Attention Required</h4>
                  <p className="text-sm text-red-700 mb-3">
                    After processing, you will have {lowStockWarnings.length} ingredients below threshold:
                  </p>
                  <div className="text-sm text-red-700">
                    {lowStockWarnings.slice(0, 5).map(item => (
                      <div key={item.ingredient}>
                        • {formatIngredientName(item.ingredient)}: {item.currentStock}{item.unit}
                        {item.urgency === 'critical' && <span className="font-bold"> (CRITICAL - OUT OF STOCK)</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <div>
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  disabled={processing}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Back
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={processing}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              
              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={processing || selectedOrderIds.size === 0}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                >
                  {step === 1 ? `Continue with ${selectedOrderIds.size} orders` : 'Review Changes'}
                </button>
              ) : (
                <button
                  onClick={processEndOfDay}
                  disabled={processing}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
                >
                  {processing ? 'Processing...' : 'Process End of Day'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndOfDayModal;