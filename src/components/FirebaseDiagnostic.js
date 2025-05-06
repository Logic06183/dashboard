import React, { useState, useEffect } from 'react';
import useFirebaseOrders from '../hooks/useFirebaseOrders';
import { createOrder, updatePizzaStatus, getOrderById } from '../services/FirebaseService';

/**
 * FirebaseDiagnostic component
 * 
 * A diagnostic tool to verify Firebase integration and help troubleshoot problems
 * Shows real-time order updates and allows creating test orders to verify data flow
 */
const FirebaseDiagnostic = () => {
  // Use our custom hook to get real-time order updates
  const { data: orders, loading, error } = useFirebaseOrders();
  
  // Local state for test orders
  const [testOrderId, setTestOrderId] = useState('');
  const [diagnosticLog, setDiagnosticLog] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Add to diagnostic log
  const logMessage = (message, type = 'info') => {
    const timestamp = new Date().toISOString();
    setDiagnosticLog(prev => [
      { message, timestamp, type },
      ...prev.slice(0, 19) // Keep last 20 messages
    ]);
  };
  
  // Create a test order to verify Firebase write operations
  const handleCreateTestOrder = async () => {
    try {
      logMessage('Creating test order in Firebase...', 'info');
      
      const testOrder = {
        customerName: 'Firebase Test',
        platform: 'Test',
        pizzas: [
          {
            pizzaType: 'Test Pizza',
            quantity: 1,
            totalPrice: 100,
            specialInstructions: 'Firebase diagnostic test',
            isCooked: false
          }
        ],
        status: 'pending',
        cooked: [false],
        orderTime: new Date().toISOString(),
        totalAmount: 100,
        createdAt: new Date().toISOString()
      };
      
      const savedOrder = await createOrder(testOrder);
      setTestOrderId(savedOrder.id);
      logMessage(`Test order created with ID: ${savedOrder.id}`, 'success');
      
      // Select the new order
      fetchOrderDetails(savedOrder.id);
    } catch (error) {
      logMessage(`Error creating test order: ${error.message}`, 'error');
      console.error('Error creating test order:', error);
    }
  };
  
  // Update pizza status to verify write operations
  const handleTogglePizzaStatus = async (orderId, pizzaIndex, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      logMessage(`Updating pizza ${pizzaIndex} in order ${orderId} to ${newStatus ? 'cooked' : 'not cooked'}...`, 'info');
      
      const updatedOrder = await updatePizzaStatus(orderId, pizzaIndex, newStatus);
      logMessage(`Order status updated successfully`, 'success');
      
      // Refresh order details
      fetchOrderDetails(orderId);
    } catch (error) {
      logMessage(`Error updating pizza status: ${error.message}`, 'error');
      console.error('Error updating pizza status:', error);
    }
  };
  
  // Fetch a specific order's details
  const fetchOrderDetails = async (orderId) => {
    try {
      logMessage(`Fetching details for order ${orderId}...`, 'info');
      const order = await getOrderById(orderId);
      
      if (order) {
        setSelectedOrder(order);
        logMessage(`Order details retrieved successfully`, 'success');
      } else {
        logMessage(`Order ${orderId} not found`, 'error');
        setSelectedOrder(null);
      }
    } catch (error) {
      logMessage(`Error fetching order details: ${error.message}`, 'error');
      console.error('Error fetching order details:', error);
      setSelectedOrder(null);
    }
  };
  
  // View an order's details
  const handleViewOrder = (orderId) => {
    fetchOrderDetails(orderId);
  };
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4 text-purple-800">Firebase Diagnostic Tool</h1>
      <p className="mb-4 text-gray-600">
        This tool helps verify that Firebase is correctly integrated as the single source of truth for your Pizza Dashboard.
      </p>
      
      {/* Test Actions */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Test Firebase Integration</h2>
        <div className="flex space-x-4">
          <button 
            onClick={handleCreateTestOrder} 
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Create Test Order
          </button>
        </div>
      </div>
      
      {/* Diagnostic Log */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Diagnostic Log</h2>
        <div className="bg-gray-900 text-white p-4 rounded-lg h-60 overflow-y-auto">
          {diagnosticLog.length === 0 ? (
            <p className="text-gray-400">No diagnostic messages yet.</p>
          ) : (
            <ul className="space-y-1">
              {diagnosticLog.map((log, index) => (
                <li 
                  key={index} 
                  className={`font-mono text-sm ${
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'success' ? 'text-green-400' : 'text-blue-400'
                  }`}
                >
                  [{log.timestamp.slice(11, 19)}] {log.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Real-time Orders Display */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Real-time Orders (From Firebase)</h2>
        {loading ? (
          <p className="text-gray-600">Loading orders from Firebase...</p>
        ) : error ? (
          <p className="text-red-600">Error loading orders: {error.message}</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-600">No orders found in Firebase.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border-b text-left">Order ID</th>
                  <th className="py-2 px-4 border-b text-left">Customer</th>
                  <th className="py-2 px-4 border-b text-left">Status</th>
                  <th className="py-2 px-4 border-b text-left">Created</th>
                  <th className="py-2 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b font-mono text-sm">{order.id}</td>
                    <td className="py-2 px-4 border-b">{order.customerName || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        order.status === 'ready' ? 'bg-green-100 text-green-800' : 
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status || 'unknown'}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <button 
                        onClick={() => handleViewOrder(order.id)}
                        className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Selected Order Details */}
      {selectedOrder && (
        <div className="border rounded-lg p-4 bg-purple-50">
          <h2 className="text-xl font-semibold mb-2">Order Details</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p><strong>Order ID:</strong> <span className="font-mono">{selectedOrder.id}</span></p>
              <p><strong>Customer:</strong> {selectedOrder.customerName || 'N/A'}</p>
              <p><strong>Platform:</strong> {selectedOrder.platform || 'N/A'}</p>
              <p><strong>Status:</strong> {selectedOrder.status || 'unknown'}</p>
            </div>
            <div>
              <p><strong>Created:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
              <p><strong>Updated:</strong> {selectedOrder.updatedAt ? new Date(selectedOrder.updatedAt).toLocaleString() : 'N/A'}</p>
              <p><strong>Total Amount:</strong> R{selectedOrder.totalAmount || 0}</p>
            </div>
          </div>
          
          <h3 className="font-semibold mb-2">Pizzas</h3>
          {selectedOrder.pizzas && selectedOrder.pizzas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 border-b text-left">#</th>
                    <th className="py-2 px-4 border-b text-left">Type</th>
                    <th className="py-2 px-4 border-b text-left">Qty</th>
                    <th className="py-2 px-4 border-b text-left">Instructions</th>
                    <th className="py-2 px-4 border-b text-left">Status</th>
                    <th className="py-2 px-4 border-b text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.pizzas.map((pizza, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{index + 1}</td>
                      <td className="py-2 px-4 border-b">{pizza.pizzaType}</td>
                      <td className="py-2 px-4 border-b">{pizza.quantity}</td>
                      <td className="py-2 px-4 border-b">
                        {pizza.specialInstructions || 'None'}
                      </td>
                      <td className="py-2 px-4 border-b">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          (pizza.isCooked || (selectedOrder.cooked && selectedOrder.cooked[index])) 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {(pizza.isCooked || (selectedOrder.cooked && selectedOrder.cooked[index])) 
                            ? 'Cooked' 
                            : 'Cooking'}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b">
                        <button 
                          onClick={() => handleTogglePizzaStatus(
                            selectedOrder.id, 
                            index, 
                            pizza.isCooked || (selectedOrder.cooked && selectedOrder.cooked[index])
                          )}
                          className={`px-3 py-1 rounded text-sm ${
                            (pizza.isCooked || (selectedOrder.cooked && selectedOrder.cooked[index])) 
                              ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {(pizza.isCooked || (selectedOrder.cooked && selectedOrder.cooked[index])) 
                            ? 'Mark Not Cooked' 
                            : 'Mark Cooked'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No pizzas found for this order.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FirebaseDiagnostic;
