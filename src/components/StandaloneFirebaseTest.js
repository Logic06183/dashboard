import React, { useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// Direct Firebase config - same as in successful HTML test
const firebaseConfig = {
  apiKey: "AIzaSyA8ZVFJzBGfRDe1_vUVZd4t95G38jd3EpM",
  authDomain: "pizza-dashboard-92057.firebaseapp.com",
  projectId: "pizza-dashboard-92057",
  storageBucket: "pizza-dashboard-92057.appspot.com",
  messagingSenderId: "771301453042",
  appId: "1:771301453042:web:4a8de5b6faa9da0da94e40"
};

// IMPORTANT: This component does not use the centralized Firebase instance
// It initializes Firebase completely on its own, similar to the successful HTML test

const StandaloneFirebaseTest = () => {
  const [status, setStatus] = useState('idle');
  const [logs, setLogs] = useState([]);
  const [orderId, setOrderId] = useState('');
  
  const addLog = (message) => {
    console.log(`[StandaloneTest] ${message}`);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  const runTest = async () => {
    setStatus('running');
    addLog('Starting standalone Firebase test...');
    
    try {
      // Step 1: Initialize Firebase with a unique name
      addLog('Initializing Firebase directly...');
      const appName = `standalone-test-${Date.now()}`;
      
      // Initialize a brand new Firebase app with a timestamp-based name to avoid conflicts
      const app = firebase.initializeApp(firebaseConfig, appName);
      addLog(`Firebase app initialized with name: ${appName}`);
      
      // Get Firestore instance
      const db = app.firestore();
      addLog('Got Firestore instance from app');
      
      // Step 2: Create a simple test order
      const testOrder = {
        customerName: 'Standalone Test',
        createdAt: new Date().toISOString(),
        orderTime: new Date().toISOString(),
        status: 'standalone_test',
        pizzas: [
          {
            pizzaType: 'Standalone Margie',
            quantity: 1,
            totalPrice: 159,
            isCooked: false
          }
        ],
        platform: 'Window',
        testId: `standalone-${Date.now()}`
      };
      addLog(`Created test order: ${JSON.stringify(testOrder)}`);
      
      // Step 3: Add to Firestore using the compat API
      addLog('Attempting to add order to Firestore collection "orders"...');
      const docRef = await db.collection('orders').add(testOrder);
      
      setOrderId(docRef.id);
      addLog(`SUCCESS! Order added with ID: ${docRef.id}`);
      setStatus('success');
      
      // Step 4: Clean up Firebase app instance to avoid memory leaks
      addLog('Cleaning up Firebase app instance...');
      await app.delete();
      addLog('Firebase app instance deleted successfully');
      
    } catch (error) {
      console.error('[StandaloneTest] Error:', error);
      addLog(`ERROR: ${error.message}`);
      if (error.stack) addLog(`Stack: ${error.stack}`);
      setStatus('error');
    }
  };
  
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
      <h2 style={{ color: '#2c3e50', marginBottom: '16px' }}>Standalone Firebase Test</h2>
      <p style={{ color: '#7f8c8d', marginBottom: '16px', fontSize: '14px' }}>
        This test initializes Firebase directly in the component, similar to the successful HTML test.
        It does not use any shared Firebase instances.
      </p>
      
      <button 
        onClick={runTest} 
        disabled={status === 'running'} 
        style={{
          padding: '12px 20px',
          backgroundColor: status === 'running' ? '#95a5a6' : '#e74c3c',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: status === 'running' ? 'not-allowed' : 'pointer',
          width: '100%',
          marginBottom: '20px',
          fontWeight: 'bold'
        }}
      >
        {status === 'running' ? 'Running Test...' : 'Run Standalone Firebase Test'}
      </button>
      
      {status !== 'idle' && (
        <div style={{ 
          padding: '12px', 
          backgroundColor: status === 'success' ? '#d5f5e3' : status === 'error' ? '#fadbd8' : '#f8f9f9',
          borderRadius: '4px',
          border: `1px solid ${status === 'success' ? '#2ecc71' : status === 'error' ? '#e74c3c' : '#bdc3c7'}`
        }}>
          <h3 style={{ 
            marginBottom: '12px', 
            color: status === 'success' ? '#27ae60' : status === 'error' ? '#c0392b' : '#2c3e50'
          }}>
            {status === 'success' ? '✅ Success!' : status === 'error' ? '❌ Error' : '⏳ Running...'}
          </h3>
          
          {orderId && (
            <p style={{ marginBottom: '12px', color: '#27ae60', fontWeight: 'bold' }}>
              Order ID: {orderId}
            </p>
          )}
          
          <div style={{ 
            backgroundColor: '#2c3e50', 
            color: '#ecf0f1', 
            fontFamily: 'monospace', 
            padding: '12px',
            borderRadius: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
            fontSize: '13px',
            lineHeight: '1.5'
          }}>
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StandaloneFirebaseTest;
