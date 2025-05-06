import React, { useState } from 'react';
import { db } from '../../firebase';

const DirectFirestoreTest = () => {
  const [result, setResult] = useState('');
  const [status, setStatus] = useState('idle');
  const [orderId, setOrderId] = useState('');
  
  const testDirectFirestore = async () => {
    setStatus('running');
    setResult('Starting direct Firestore test with compat db...');
    
    try {
      if (!db) {
        setResult(prev => prev + '\nERROR: Centralized compat db instance is not available!');
        setStatus('error');
        console.error('Centralized compat db instance is not available in DirectFirestoreTest');
        return;
      }
      setResult(prev => prev + '\nCentralized compat db instance is available.');
      
      const testOrder = {
        customerName: 'Direct Compat Test',
        createdAt: new Date().toISOString(),
        orderTime: new Date().toISOString(),
        status: 'pending_compat',
        pizzas: [
          {
            pizzaType: 'Margie Compat',
            quantity: 1,
            totalPrice: 149,
            isCooked: false
          }
        ],
        cooked: [false],
        testTimeStamp: Date.now(),
        orderId: `direct-compat-test-${Date.now()}`
      };
      
      setResult(prev => prev + '\nCreated test order object for compat test.');
      
      setResult(prev => prev + '\nAttempting db.collection("orders").add() ...');
      const docRef = await db.collection('orders').add(testOrder);
      
      setOrderId(docRef.id);
      setResult(prev => prev + `\nSUCCESS! Compat Order created with ID: ${docRef.id}`);
      setStatus('success');
      
    } catch (error) {
      console.error('Error in direct compat Firestore test:', error);
      setResult(prev => prev + `\nERROR: ${error.message}\n${error.stack}`);
      setStatus('error');
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Direct Firestore Test (Compat API)</h2>
      <p className="text-sm text-gray-600 mb-4">
        This test uses the centralized <code>firebase.js</code> (compat API) to add a document.
      </p>
      
      <button
        onClick={testDirectFirestore}
        disabled={status === 'running'}
        className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-400"
      >
        {status === 'running' ? 'Testing...' : 'Run Direct (Compat) Firestore Test'}
      </button>
      
      {status !== 'idle' && (
        <div className={`mt-4 p-3 rounded ${status === 'success' ? 'bg-green-100 border border-green-300' : status === 'error' ? 'bg-red-100 border border-red-300' : 'bg-gray-100'}`}>
          <h3 className="font-bold mb-2">
            {status === 'success' ? '✅ Success!' : status === 'error' ? '❌ Error' : '⏳ Running...'}
          </h3>
          
          {orderId && (
            <p className="mb-2 text-green-800 font-bold">
              Order ID: {orderId}
            </p>
          )}
          
          <pre className="whitespace-pre-wrap text-xs font-mono bg-black text-green-400 p-2 rounded max-h-40 overflow-auto">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DirectFirestoreTest;
