import React, { useState } from 'react';
import FirebaseService from '../services/FirebaseService';

const FirebaseTest = () => {
  console.log('FirebaseTest component rendered');
  console.log('FirebaseService available:', !!FirebaseService);
  console.log('FirebaseService methods:', Object.keys(FirebaseService));
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Test order creation
  const testCreateOrder = async () => {
    setLoading(true);
    setResult('');
    setError('');
    
    try {
      console.log('Starting test order creation with enhanced logging...');
      console.log('FirebaseService:', FirebaseService);
      console.log('createOrder function:', FirebaseService.createOrder);
      
      // Create a simple test order with all required fields
      const timestamp = new Date().toISOString();
      const testOrder = {
        customerName: 'Firebase Test User',
        platform: 'Test Platform',
        orderTime: timestamp,
        totalAmount: 100,
        pizzas: [
          {
            pizzaType: 'Test Pizza',
            quantity: 1,
            totalPrice: 100,
            specialInstructions: 'This is a test order',
            isCooked: false,
            rowNumber: 1
          }
        ],
        status: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp,
        cooked: [false],
        id: `test-order-${Date.now()}` // Add explicit ID
      };
      
      console.log('Creating test order with data:', JSON.stringify(testOrder, null, 2));
      
      // Direct Firestore test
      try {
        console.log('Testing direct Firestore access...');
        const db = FirebaseService.db;
        console.log('Firestore db instance:', db);
        
        // Import needed Firestore functions to test direct access
        const { collection, addDoc } = await import('firebase/firestore');
        console.log('Firebase collection function available:', !!collection);
        console.log('Firebase addDoc function available:', !!addDoc);
        
        // Try direct Firestore write
        const orderCollection = collection(db, 'orders');
        console.log('Order collection reference created:', orderCollection);
        
        const docRef = await addDoc(orderCollection, testOrder);
        console.log('Direct Firestore test successful, document added with ID:', docRef.id);
      } catch (directError) {
        console.error('Direct Firestore test failed:', directError);
      }
      
      // Try through our service
      console.log('Now trying through FirebaseService.createOrder...');
      const savedOrder = await FirebaseService.createOrder(testOrder);
      console.log('Test order created successfully through service:', savedOrder);
      
      setResult(JSON.stringify(savedOrder, null, 2));
    } catch (err) {
      console.error('Error in test order creation:', err);
      setError(`Error: ${err.message}\n${err.stack}`);
    } finally {
      setLoading(false);
    }
  };

  // Test order retrieval
  const testGetOrders = async () => {
    setLoading(true);
    setResult('');
    setError('');
    
    try {
      console.log('Fetching orders');
      const orders = await FirebaseService.getOrders();
      console.log('Orders fetched:', orders);
      
      setResult(JSON.stringify(orders, null, 2));
    } catch (err) {
      console.error('Error in test:', err);
      setError(`Error: ${err.message}\n${err.stack}`);
    } finally {
      setLoading(false);
    }
  };

  // Test Firestore connection with enhanced debugging
  const testConnection = async () => {
    setLoading(true);
    setResult('');
    setError('');
    
    try {
      // Show Firebase config and setup details
      console.log('FirebaseService object:', FirebaseService);
      console.log('Firebase db object:', FirebaseService.db);
      
      // Try to get orders - if succeeds, connection is working
      console.log('Testing Firebase connection...');
      const orders = await FirebaseService.getOrders();
      console.log('Connection test successful, retrieved orders:', orders);
      
      // Test direct Firestore access
      try {
        console.log('Testing direct Firestore access...');
        const { collection, getDocs } = await import('firebase/firestore');
        const ordersCollection = collection(FirebaseService.db, 'orders');
        const querySnapshot = await getDocs(ordersCollection);
        console.log('Direct Firestore access successful, docs count:', querySnapshot.size);
      } catch (directError) {
        console.error('Direct Firestore access failed:', directError);
      }
      
      setResult(`Connection successful! Retrieved ${orders.length} orders from Firestore.`);
    } catch (err) {
      console.error('Error testing connection:', err);
      setError(`Connection error: ${err.message}\n${err.stack}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Firebase Test Tool</h2>
      <p className="mb-4 text-gray-600">Use these tools to verify Firebase connectivity and operations.</p>
      
      <div className="flex space-x-4 mb-6">
        <button 
          onClick={testCreateOrder}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test Create Order'}
        </button>
        
        <button 
          onClick={testGetOrders}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test Get Orders'}
        </button>
        
        <button 
          onClick={testConnection}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
          disabled={loading}
        >
          {loading ? 'Testing...' : 'Test Connection'}
        </button>
      </div>
      
      {error && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded text-red-700">
          <h3 className="font-semibold mb-2">Error</h3>
          <pre className="whitespace-pre-wrap text-sm">{error}</pre>
        </div>
      )}
      
      {result && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded">
          <h3 className="font-semibold mb-2">Result</h3>
          <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-96">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default FirebaseTest;
