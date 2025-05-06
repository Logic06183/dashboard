import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/FirebaseService';

const TestOrderForm = ({ onClose }) => {
  // Form state
  const [customerName, setCustomerName] = useState('Test Customer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [debug, setDebug] = useState([]);

  const addDebugMessage = (message) => {
    setDebug(prev => [...prev, `${new Date().toISOString().split('T')[1].slice(0, 8)}: ${message}`]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      addDebugMessage('Starting minimal test order submission');
      
      // Create simplest possible test order
      const testOrder = {
        customerName: customerName || 'Test Customer',
        testOrder: true,
        orderTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        status: 'pending',
        pizzas: [
          {
            pizzaType: 'Margie',
            quantity: 1,
            totalPrice: 149,
            isCooked: false
          }
        ],
        cooked: [false],
        orderId: `test-${Date.now()}`
      };

      addDebugMessage(`Created test order object with ID: ${testOrder.orderId}`);

      // DIRECT FIRESTORE ACCESS - identical to our CLI test that works
      const ordersCollection = collection(db, 'orders');
      
      addDebugMessage(`Got collection reference: ${!!ordersCollection}`);
      
      // Add document and get the auto-generated id
      const docRef = await addDoc(ordersCollection, testOrder);
      
      addDebugMessage(`Order created with generated ID: ${docRef.id}`);
      
      // Show success message with the document ID
      setSuccess(true);
      
    } catch (err) {
      console.error('Error creating test order:', err);
      addDebugMessage(`ERROR: ${err.message}`);
      setError(`Failed to create order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">MINIMAL TEST ORDER FORM</h2>
      <p className="text-sm text-gray-600 mb-4">This form uses the exact same pattern as the working CLI test</p>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 p-3 rounded mb-4">
          ✅ Test order created successfully! Check Firebase.
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">Customer Name</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
        >
          {isSubmitting ? 'Creating...' : 'Create Test Order'}
        </button>
      </form>
      
      <div className="mt-6 border-t pt-4">
        <h3 className="text-md font-bold mb-2">Debug Log:</h3>
        <div className="bg-gray-100 p-3 rounded text-xs font-mono h-40 overflow-auto">
          {debug.map((msg, i) => (
            <div key={i} className="mb-1">{msg}</div>
          ))}
          {debug.length === 0 && <div className="text-gray-500">No messages yet</div>}
        </div>
      </div>
    </div>
  );
};

export default TestOrderForm;
