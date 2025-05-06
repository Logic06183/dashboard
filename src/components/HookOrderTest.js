import React, { useState } from 'react';
import useFirestore from '../hooks/useFirestore';

/**
 * A minimal order form that uses the existing useFirestore hook
 * instead of directly interacting with Firebase
 */
const HookOrderTest = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [logs, setLogs] = useState([]);
  
  // Use the existing hook with orders collection
  const [orders, addOrder, updateOrder, removeOrder, loading] = useFirestore('orders', []);
  
  const addLog = (message) => {
    console.log(`[HookOrderTest] ${message}`);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  const createTestOrder = async () => {
    setIsSubmitting(true);
    addLog('Creating test order using useFirestore hook...');
    
    try {
      // Create a simple test order
      const newOrder = {
        customerName: 'Hook Test Order',
        createdAt: new Date().toISOString(),
        orderTime: new Date().toISOString(),
        status: 'pending',
        pizzas: [
          {
            pizzaType: 'Margherita',
            quantity: 1,
            totalPrice: 169,
            isCooked: false
          }
        ],
        platform: 'Window',
        testId: `hook-test-${Date.now()}`
      };
      
      addLog(`Test order created: ${JSON.stringify(newOrder)}`);
      
      // Use the hook's addItem function instead of calling Firebase directly
      const id = await addOrder(newOrder);
      
      if (id) {
        addLog(`SUCCESS! Order added with ID: ${id}`);
        setOrderId(id);
      } else {
        addLog('No order ID returned. Check console for errors.');
      }
      
    } catch (error) {
      addLog(`ERROR: ${error.message}`);
      console.error('[HookOrderTest] Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Create Order Using Hook</h2>
      <p className="text-sm text-gray-600 mb-4">
        This test uses the existing <code>useFirestore</code> hook to add an order.
      </p>
      
      <button
        onClick={createTestOrder}
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-400"
      >
        {isSubmitting ? 'Creating Order...' : 'Create Test Order With Hook'}
      </button>
      
      {orderId && (
        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
          <h3 className="font-bold mb-2">✅ Success!</h3>
          <p className="mb-2 text-green-800 font-bold">
            Order ID: {orderId}
          </p>
        </div>
      )}
      
      {logs.length > 0 && (
        <div className="mt-4">
          <h3 className="font-bold mb-2">Logs</h3>
          <pre className="bg-gray-800 text-green-400 p-3 rounded text-xs font-mono whitespace-pre-wrap overflow-auto max-h-48">
            {logs.join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
};

export default HookOrderTest;
