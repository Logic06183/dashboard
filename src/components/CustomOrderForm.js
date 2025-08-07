 import React, { useState, useEffect } from 'react';
// Import Firebase directly to avoid any service abstraction issues
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
// Import FirebaseService for fallback
import FirebaseService from '../services/FirebaseService';

// Firebase configuration - including directly to ensure no import issues
const firebaseConfig = {
  apiKey: "AIzaSyA8ZVFJzBGfRDe1_vUVZd4t95G38jd3EpM",
  authDomain: "pizza-dashboard-92057.firebaseapp.com",
  projectId: "pizza-dashboard-92057",
  storageBucket: "pizza-dashboard-92057.appspot.com",
  messagingSenderId: "771301453042",
  appId: "1:771301453042:web:4a8de5b6faa9da0da94e40"
};

// Initialize Firebase with a unique name to avoid conflicts
let firebaseApp;
let db;

const CustomOrderForm = ({ onSubmit, setShowOrderForm }) => {
  // Initialize Firebase when component mounts
  useEffect(() => {
    console.log('CustomOrderForm mounted');
    
    try {
      // Initialize Firebase only if it hasn't been initialized yet
      if (!firebase.apps.length) {
        console.log('No Firebase apps exist, initializing new app');
        firebaseApp = firebase.initializeApp(firebaseConfig);
      } else {
        console.log('Firebase already initialized, getting existing app');
        try {
          // Try to get existing app with name 'orderForm'
          firebaseApp = firebase.app('orderForm');
          console.log('Got existing orderForm app');
        } catch (e) {
          // If not found, initialize with this name
          console.log('Creating new Firebase app with name orderForm');
          firebaseApp = firebase.initializeApp(firebaseConfig, 'orderForm');
        }
      }
      
      // Get Firestore instance
      db = firebaseApp.firestore();
      console.log('CustomOrderForm: Firebase initialized with compat API', !!db);
      
      // Verify FirebaseService is available
      console.log('FirebaseService available:', !!FirebaseService);
      if (FirebaseService && FirebaseService.createOrder) {
        console.log('FirebaseService.createOrder is a function');
      } else {
        console.warn('FirebaseService.createOrder is not available or not a function');
      }
    } catch (error) {
      console.error('Error initializing Firebase in CustomOrderForm:', error);
    }
    
    return () => {
      // Clean up when component unmounts
      if (firebaseApp && firebaseApp.name === 'orderForm') {
        console.log('Cleaning up Firebase app');
        firebaseApp.delete().catch(error => console.error('Error cleaning up Firebase app:', error));
      }
    };
  }, []);

  // Add debug state to track form submission process
  const [debugInfo, setDebugInfo] = useState({});
  
    // Test Firebase connection on component mount
    const testConnection = async () => {
      try {
        console.log('Testing Firebase connection from CustomOrderForm...');
        const testResult = await FirebaseService.getOrders();
        console.log('Firebase connection test result:', testResult);
      } catch (err) {
        console.error('Firebase connection test failed:', err);
      }
    };
    
    testConnection();
  }, []);
  const [platform, setPlatform] = useState('');
  const [customPlatform, setCustomPlatform] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [extraToppings, setExtraToppings] = useState('');
  
  // Initialize pizza order grid with 6 rows (2 sections of 3 rows each)
  const [pizzaGrid, setPizzaGrid] = useState([
    Array(19).fill(0), // Row 1
    Array(19).fill(0), // Row 2
    Array(19).fill(0), // Row 3
    Array(19).fill(0), // Row 4
    Array(19).fill(0), // Row 5
    Array(19).fill(0), // Row 6
  ]);
  
  // State for pizza special instructions
  const [pizzaInstructions, setPizzaInstructions] = useState({});
  
  // Currently editing pizza instructions
  const [editingPizza, setEditingPizza] = useState(null); // { row, col }

  // Pizza menu options
  const pizzaOptions = [
    'Margie', 'Champ', 'Pig n Paradise', 'Vegan Harvest', 'Mish-Mash', 
    'Mushroom Cloud', 'Feisty Italian', 'Sausage Party', 'Zesty Zucchini', 
    'Spud', 'Owen', 'Build Your Own', 'Lekker\'izza Pizza', 'Poppa\'s Pizza', 
    'Sunshine Margherita', 'Chick Tick Boom', 'Ham & Artichoke', 'Veg Special', 'Jane\'s Dough'
  ];

  // Platform/delivery service options
  const platformOptions = ['Window', 'Uber Eats', 'Mr D Food', 'Bolt Food', 'Customer Pickup', 'Staff', 'Other'];

  // Pizza prices (in Rands)
  const pizzaPrices = {
    'Margie': 149,
    'Champ': 179,
    'Pig n Paradise': 169,
    'Vegan Harvest': 189,
    'Mish-Mash': 192,
    'Mushroom Cloud': 174,
    'Feisty Italian': 179,
    'Sausage Party': 179,
    'Zesty Zucchini': 149,
    'Spud': 149,
    'Owen': 169,
    'Build Your Own': 159,
    'Lekker\'izza Pizza': 194,
    'Poppa\'s Pizza': 179,
    'Sunshine Margherita': 149,
    'Chick Tick Boom': 172,
    'Ham & Artichoke': 172,
    'Veg Special': 169,
    'Jane\'s Dough': 109
  };

  // Handle pizza quantity change
  const handlePizzaChange = (rowIndex, colIndex, value) => {
    const newGrid = [...pizzaGrid];
    newGrid[rowIndex][colIndex] = parseInt(value) || 0;
    setPizzaGrid(newGrid);
  };
  
  // Open the pizza instructions modal
  const openInstructionsModal = (rowIndex, colIndex) => {
    const pizzaType = pizzaOptions[colIndex];
    const key = `${rowIndex}-${colIndex}`;
    setEditingPizza({ row: rowIndex, col: colIndex, pizzaType });
  };
  
  // Close the pizza instructions modal
  const closeInstructionsModal = () => {
    setEditingPizza(null);
  };
  
  // Save pizza instructions
  const savePizzaInstructions = (instructions) => {
    if (!editingPizza) return;
    
    const key = `${editingPizza.row}-${editingPizza.col}`;
    setPizzaInstructions(prev => ({
      ...prev,
      [key]: instructions
    }));
    
    closeInstructionsModal();
  };

  // Calculate total order amount
  const calculateTotal = () => {
    let total = 0;
    
    // Calculate pizza costs
    for (let row = 0; row < pizzaGrid.length; row++) {
      for (let col = 0; col < pizzaGrid[row].length; col++) {
        const quantity = pizzaGrid[row][col];
        if (quantity > 0) {
          const pizzaType = pizzaOptions[col];
          const price = pizzaPrices[pizzaType] || 0;
          total += price * quantity;
        }
      }
    }
    
    return total;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!platform) {
      alert('Please select a delivery platform');
      return;
    }
    
    if (platform === 'Other' && !customPlatform.trim()) {
      alert('Please specify the custom platform');
      return;
    }
    
    // Collect all ordered pizzas
    const orderedPizzas = [];
    for (let row = 0; row < pizzaGrid.length; row++) {
      for (let col = 0; col < pizzaGrid[row].length; col++) {
        const quantity = pizzaGrid[row][col];
        if (quantity > 0) {
          const pizzaType = pizzaOptions[col];
          const price = pizzaPrices[pizzaType] || 0;
          const key = `${row}-${col}`;
          const specialInstructions = pizzaInstructions[key] || '';
          
          orderedPizzas.push({
            pizzaType,
            quantity,
            totalPrice: price * quantity,
            rowNumber: row + 1,
            specialInstructions,
            notes: specialInstructions, // For compatibility with existing code
            isCooked: false // Initialize as not cooked
          });
        }
      }
    }
    
    // Check if we have pizzas
    if (orderedPizzas.length === 0) {
      alert('Please add at least one pizza to the order');
      return;
    }
    
    // Create order object with Firebase-friendly structure
    const orderToCreate = {
      pizzas: orderedPizzas,
      status: 'pending',
      orderTime: new Date().toISOString(),
      totalAmount: calculateTotal(),
      platform: platform === 'Other' ? customPlatform : platform,
      customerName,
      prepTime: parseInt(prepTime) || 15,
      extraToppings,
      urgency: parseInt(prepTime) <= 15 ? 'high' : parseInt(prepTime) <= 30 ? 'medium' : 'low',
      cooked: orderedPizzas.map(() => false), // Track cooking status for each pizza
      createdAt: new Date().toISOString()
    };
    
    try {
      setDebugInfo(prev => ({ ...prev, status: 'starting', orderData: orderToCreate }));
      console.log('Starting order creation with order data:', orderToCreate);
      
      // Log more detailed info about the order we're trying to create
      console.log('Order details:', {
        customerName: orderToCreate.customerName,
        platform: orderToCreate.platform,
        pizzaCount: orderToCreate.pizzas.length,
        totalAmount: orderToCreate.totalAmount
      });
      
      // Submit order directly to Firebase with more robust error handling
      console.log('Calling createOrder function...');
      setDebugInfo(prev => ({ ...prev, status: 'calling_firebase' }));
      
      // Use direct Firestore access since we know this works
      console.log('Using direct Firestore access to create order...');
      let savedOrder;
      
      // Check if we have a valid Firestore instance
      if (!db || typeof db.collection !== 'function') {
        console.error('Firebase Firestore not properly initialized. Attempting to reinitialize...');
        
        // Last attempt to initialize Firebase
        try {
          // Try to get existing app
          if (firebase.apps.length > 0) {
            firebaseApp = firebase.app();
          } else {
            firebaseApp = firebase.initializeApp(firebaseConfig);
          }
          
          db = firebaseApp.firestore();
          console.log('Reinitialized Firestore in submission handler:', !!db);
        } catch (initError) {
          console.error('Failed to reinitialize Firebase:', initError);
          throw new Error('Could not initialize Firebase: ' + initError.message);
        }
      }
      
      if (!db || typeof db.collection !== 'function') {
        throw new Error('Firestore db is still not available after reinitialization');
      }
      
      console.log('Got valid Firebase Firestore instance');
      
      // Create a clean ID for the order
      const orderId = `order-${Date.now()}`;
      const cleanedOrderData = {
        ...orderToCreate,
        id: orderId,
        orderId: orderId,
        createdAt: orderToCreate.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add a unique debugging marker
        _source: 'direct_compat_api',
        _timestamp: Date.now()
      };
      
      console.log('Clean order data prepared:', {
        id: cleanedOrderData.id,
        customerName: cleanedOrderData.customerName,
        pizzaCount: cleanedOrderData.pizzas.length
      });
      
      // Directly use the firebase compat API
      console.log('Calling db.collection("orders").add() with compat API...');
      
      try {
        // First attempt - direct compat API call
        const docRef = await db.collection('orders').add(cleanedOrderData);
        console.log('SUCCESS! Order created with ID:', docRef.id);
        
        // Update savedOrder with the document ID
        savedOrder = {
          ...cleanedOrderData,
          id: docRef.id
        };
      } catch (directError) {
        console.error('Error with direct Firestore compat API:', directError);
        
        // Log detailed error information
        console.error('Error code:', directError.code);
        console.error('Error name:', directError.name);
        console.error('Full error object:', JSON.stringify(directError, Object.getOwnPropertyNames(directError)));
        
        // Try fallback to FirebaseService if available
        if (FirebaseService && typeof FirebaseService.createOrder === 'function') {
          console.log('Trying fallback to FirebaseService.createOrder');
          savedOrder = await FirebaseService.createOrder(orderToCreate);
          console.log('Order created via service fallback');
        } else {
          throw new Error('Direct Firestore failed and no fallback service available: ' + directError.message);
        }
      }
      
      console.log('Order created successfully:', savedOrder);
      setDebugInfo(prev => ({ ...prev, status: 'success', savedOrder }));
      
      // Call onSubmit to notify parent component if needed
      if (onSubmit) {
        console.log('Calling onSubmit with saved order');
        onSubmit(savedOrder);
      } else {
        console.log('No onSubmit handler provided');
      }
      
      // Close the form
      setShowOrderForm(false);
    } catch (error) {
      console.error('Detailed error creating order:', error);
      console.error('Error stack:', error.stack);
      setDebugInfo(prev => ({ 
        ...prev, 
        status: 'error', 
        error: error.message, 
        stack: error.stack 
      }));
      alert(`Error creating order: ${error.message}. Check console for details.`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white rounded-lg shadow-lg max-w-6xl mx-auto" style={{ fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', backgroundColor: '#f0f0f0', borderTop: '10px solid #673ab7' }}>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-normal text-center text-gray-800 border-b pb-4 mb-6" style={{ color: '#202124', fontWeight: '400' }}>Input Order Form</h2>
        
        {/* Customer Name Field */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-2" style={{ color: '#5f6368' }}>
            Customer Name
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full py-2 px-3 text-gray-700 border-b border-gray-300 focus:border-purple-500 focus:outline-none transition-colors"
            placeholder="Enter customer name"
            style={{ backgroundColor: 'transparent' }}
          />
        </div>
      
      {/* Platform Selection */}
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-medium mb-4" style={{ color: '#5f6368' }}>
          Platform
        </label>
        <div className="flex flex-col space-y-2">
          {platformOptions.map((option) => (
            <div key={option} className="flex items-center">
              <input
                type="radio"
                id={option}
                name="platform"
                value={option}
                checked={platform === option}
                onChange={() => setPlatform(option)}
                className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500"
                style={{ accentColor: '#673ab7' }}
              />
              <label htmlFor={option} className="text-gray-700">{option}</label>
            </div>
          ))}
        </div>
        
        {/* Custom Platform Input */}
        {platform === 'Other' && (
          <input
            type="text"
            value={customPlatform}
            onChange={(e) => setCustomPlatform(e.target.value)}
            className="mt-4 w-full py-2 px-3 text-gray-700 border-b border-gray-300 focus:border-purple-500 focus:outline-none transition-colors"
            placeholder="Enter platform name"
            style={{ backgroundColor: 'transparent' }}
          />
        )}
      </div>
      
      {/* Pizza Order Grid */}
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-medium mb-4" style={{ color: '#5f6368' }}>
          Pizzas
        </label>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 border-b w-24 text-left text-sm font-medium text-gray-600" style={{ backgroundColor: '#f1f3f4', color: '#5f6368' }}>Row</th>
                {pizzaOptions.map((pizza, index) => (
                  <th key={index} className="py-3 px-2 border-b text-xs text-left font-medium text-gray-600" style={{ backgroundColor: '#f1f3f4', color: '#5f6368' }}>
                    {pizza}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pizzaGrid.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-3 px-4 border-b font-medium text-gray-700">
                    {rowIndex < 3 ? `Row ${rowIndex + 1}` : `Row ${rowIndex - 2}`}
                  </td>
                  {row.map((quantity, colIndex) => {
                    const key = `${rowIndex}-${colIndex}`;
                    const hasInstructions = pizzaInstructions[key] && pizzaInstructions[key].length > 0;
                    
                    return (
                      <td key={colIndex} className="py-2 px-1 border-b relative">
                        <div className="flex items-center">
                          <div className="relative w-full flex items-center">
                            <input
                              type="number"
                              min="0"
                              value={quantity || ''}
                              onChange={(e) => handlePizzaChange(rowIndex, colIndex, e.target.value)}
                              className={`w-full p-1 text-center border ${hasInstructions ? 'border-yellow-400' : 'border-gray-300'} rounded-l focus:border-purple-500 focus:outline-none`}
                              style={{ height: '32px' }}
                            />
                            {quantity > 0 && (
                              <button 
                                type="button"
                                onClick={() => openInstructionsModal(rowIndex, colIndex)}
                                className={`h-[32px] px-2 border border-l-0 ${hasInstructions ? 'bg-yellow-50 border-yellow-400 text-yellow-600' : 'bg-gray-50 border-gray-300 text-blue-500'} rounded-r hover:bg-gray-100`}
                                title={hasInstructions ? `Edit instructions: ${pizzaInstructions[key]}` : "Add special instructions"}
                              >
                                <div className="flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  {hasInstructions && (
                                    <span className="ml-1 text-xs font-medium">✓</span>
                                  )}
                                </div>
                              </button>
                            )}
                            {hasInstructions && (
                              <div className="absolute left-0 -bottom-4 text-xs text-yellow-600 truncate max-w-[90%]" style={{zIndex: 5}}>
                                {pizzaInstructions[key]}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              
              {/* Pizza Customization Modal */}
              {editingPizza && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                  <div className="bg-white p-6 rounded-lg max-w-lg w-full">
                    <h3 className="text-lg font-medium mb-4">
                      Customize {editingPizza.pizzaType} (Row {editingPizza.row + 1})
                    </h3>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Special Instructions
                      </label>
                      <textarea 
                        className="w-full p-2 border border-gray-300 rounded"
                        rows="4"
                        placeholder="e.g., No onions, extra cheese, half-and-half toppings, etc."
                        defaultValue={pizzaInstructions[`${editingPizza.row}-${editingPizza.col}`] || ''}
                        id="pizza-instructions"
                      ></textarea>
                      <p className="text-xs text-gray-500 mt-1">
                        Specify any special requests, additions, or removals for this pizza.
                      </p>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button 
                        type="button" 
                        onClick={closeInstructionsModal}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        onClick={() => savePizzaInstructions(document.getElementById('pizza-instructions').value)}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Delivery Platform */}
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-medium mb-2" style={{ color: '#5f6368' }}>
          Delivery Platform
        </label>
        <div className="flex space-x-2">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full py-2 px-3 text-gray-700 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
            required
          >
            <option value="">Select delivery platform</option>
            {platformOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          {platform === 'Other' && (
            <input
              type="text"
              value={customPlatform}
              onChange={(e) => setCustomPlatform(e.target.value)}
              className="w-full py-2 px-3 text-gray-700 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
              placeholder="Specify platform"
              required
            />
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">Select the delivery service or ordering platform</p>
      </div>

      {/* Extra Toppings */}
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-medium mb-2" style={{ color: '#5f6368' }}>
          Extra Toppings
        </label>
        <textarea
          value={extraToppings}
          onChange={(e) => setExtraToppings(e.target.value)}
          className="w-full py-2 px-3 text-gray-700 border border-gray-300 rounded focus:border-purple-500 focus:outline-none"
          rows="3"
          placeholder="Enter any extra toppings or special instructions"
        />
      </div>
      
      {/* Preparation Time */}
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-medium mb-2" style={{ color: '#5f6368' }}>
          Preparation time
        </label>
        <input
          type="number"
          value={prepTime}
          onChange={(e) => setPrepTime(e.target.value)}
          className="w-full py-2 px-3 text-gray-700 border-b border-gray-300 focus:border-purple-500 focus:outline-none transition-colors"
          placeholder="Enter preparation time in minutes (e.g., 15)"
          min="1"
          style={{ backgroundColor: 'transparent' }}
        />
        <p className="text-xs text-gray-500 mt-1">Enter preparation time in minutes (e.g., 15)</p>
      </div>
      
      {/* Google Forms-like footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-xs text-gray-500">
        <p>Never submit passwords through this form.</p>
        <p className="mt-2">This content is neither created nor endorsed by Google.</p>
      </div>
      
      {/* Order Summary */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <h3 className="font-medium text-lg mb-2 text-purple-800">Order Summary</h3>
        <p className="text-xl font-medium text-purple-700">Total: R{calculateTotal().toFixed(2)}</p>
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => setShowOrderForm(false)}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors font-medium"
          style={{ backgroundColor: '#673ab7' }}
        >
          Submit
        </button>
      </div>
    </div>
    </form>
  );
};

export default CustomOrderForm;
