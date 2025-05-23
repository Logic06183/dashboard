import React, { useState, useEffect, useRef } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// Direct Firebase configuration - matching successful tests
const firebaseConfig = {
  apiKey: "AIzaSyA8ZVFJzBGfRDe1_vUVZd4t95G38jd3EpM",
  authDomain: "pizza-dashboard-92057.firebaseapp.com",
  projectId: "pizza-dashboard-92057",
  storageBucket: "pizza-dashboard-92057.appspot.com",
  messagingSenderId: "771301453042",
  appId: "1:771301453042:web:4a8de5b6faa9da0da94e40"
};

// Check for existing Firebase instances with this name
let firebaseApp;
let firestoreDb;

// Create a stable Firebase instance that won't be recreated on component rerenders
function getFirebaseInstance() {
  try {
    // If we already have a Firebase instance, return it
    if (firebaseApp && firestoreDb) {
      return { app: firebaseApp, db: firestoreDb };
    }

    // Look for existing Firebase apps with our app name
    const existingApp = firebase.apps.find(app => app.name === 'pizza-order-form');

    if (existingApp) {
      // Use the existing app if found
      firebaseApp = existingApp;
    } else {
      // Otherwise create a new app with a fixed name
      firebaseApp = firebase.initializeApp(firebaseConfig, 'pizza-order-form');
      console.log('Created new Firebase app for orders');
    }
    
    // Initialize Firestore
    firestoreDb = firebaseApp.firestore();
    
    return { app: firebaseApp, db: firestoreDb };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return { error };
  }
}

// Pizza menu from John Dough's
const pizzaMenu = [
  { id: 'margie', name: 'Margie Pizza', price: 149.00 },
  { id: 'the-champ', name: 'The Champ Pizza', price: 179.00 },
  { id: 'pig-paradise', name: 'Pig in Paradise', price: 169.00 },
  { id: 'mushroom-cloud', name: 'Mushroom Cloud Pizza', price: 174.00 },
  { id: 'spud', name: 'Spud Pizza', price: 149.00 },
  { id: 'mish-mash', name: 'Mish-Mash Pizza', price: 192.00 },
  { id: 'lekkerizza', name: 'Lekker\'izza', price: 194.00 },
  { id: 'sunshine-margherita', name: 'Sunshine Margherita', price: 149.00 },
  { id: 'vegan-harvest', name: 'Vegan Harvest Pizza', price: 189.00 },
  { id: 'vegetarian-special', name: 'Vegetarian Special', price: 169.00 },
  { id: 'build-your-own', name: 'Build Your Own', price: 159.00 },
  { id: 'owen', name: 'Owen', price: 169.00 },
  { id: 'poppas', name: 'Poppa\'s Pizza', price: 179.00 },
  { id: 'zesty-zucchini', name: 'The Zesty Zucchini', price: 149.00 },
  { id: 'chick-tick-boom', name: 'Chick Tick Boom', price: 172.00 },
  { id: 'artichoke-ham', name: 'Artichoke & Ham', price: 172.00 },
  { id: 'janes-dough', name: 'Jane\'s Dough', price: 109.00 }
];

// This form is simplified and uses a direct Firebase approach
// with the exact pattern that works in the HTML test
const FirebaseDirectForm = ({ onClose }) => {
  const [orderData, setOrderData] = useState({
    customerName: '',
    platform: 'Window',
    prepTimeMinutes: 15
  });
  
  // State for managing multiple pizzas in an order
  const [pizzaItems, setPizzaItems] = useState([
    {
      id: Date.now(), // unique ID for this pizza item
      pizzaType: 'Margie Pizza',
      quantity: 1,
      specialInstructions: ''
    }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState({ status: 'idle', message: '' });
  const [db, setDb] = useState(null);

  // Use refs to track component mounted state
  const isMounted = useRef(true);
  
  // Initialize Firebase once on component mount
  useEffect(() => {
    console.log('Initializing Firebase with stable pattern...');
    
    // Get our Firebase instance
    const { db, error } = getFirebaseInstance();
    
    if (error) {
      console.error('Failed to initialize Firebase:', error);
      setResult({ 
        status: 'error', 
        message: `Firebase initialization error: ${error.message}` 
      });
    } else if (db) {
      console.log('Firebase initialized successfully');
      setDb(db);
    }
    
    // Track mounted state for cleanup
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Handle changes to the main order data
  const handleOrderDataChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: name === 'prepTimeMinutes' ? parseInt(value, 10) : value
    }));
  };
  
  // Handle changes to an individual pizza item
  const handlePizzaItemChange = (e, pizzaId) => {
    const { name, value } = e.target;
    setPizzaItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === pizzaId) {
          return {
            ...item,
            [name]: name === 'quantity' ? parseInt(value, 10) : value
          };
        }
        return item;
      });
    });
  };
  
  // Add a new pizza to the order
  const addPizzaItem = () => {
    setPizzaItems(prev => [
      ...prev,
      {
        id: Date.now(),
        pizzaType: 'Margie Pizza',
        quantity: 1,
        specialInstructions: ''
      }
    ]);
  };
  
  // Remove a pizza from the order
  const removePizzaItem = (pizzaId) => {
    if (pizzaItems.length > 1) {
      setPizzaItems(prev => prev.filter(item => item.id !== pizzaId));
    }
  };
  
  // Calculate total price of the order
  const calculateTotalPrice = () => {
    return pizzaItems.reduce((total, item) => {
      const pizza = pizzaMenu.find(p => p.name === item.pizzaType) || { price: 149 };
      return total + (pizza.price * item.quantity);
    }, 0);
  };
  
  // Check if any pizza has special instructions
  const hasSpecialInstructions = () => {
    return pizzaItems.some(item => item.specialInstructions && item.specialInstructions.trim() !== '');
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Get a fresh instance of Firebase to be certain we have a valid connection
    const { db: freshDb, error } = getFirebaseInstance();
    
    if (error || !freshDb) {
      setResult({ 
        status: 'error', 
        message: 'Could not connect to Firebase. Please refresh the page and try again.'
      });
      return;
    }
    
    setSubmitting(true);
    setResult({ status: 'submitting', message: 'Submitting order...' });
    
    try {
      // Prepare pizza items with prices and cooking status
      const processedPizzaItems = pizzaItems.map((item, index) => {
        const pizza = pizzaMenu.find(p => p.name === item.pizzaType) || { price: 149 };
        return {
          pizzaType: item.pizzaType,
          quantity: item.quantity,
          totalPrice: pizza.price * item.quantity,
          isCooked: false,
          rowNumber: index + 1,
          specialInstructions: item.specialInstructions || ''
        };
      });
      
      // Generate an array of cooking statuses matching the number of pizzas
      const cookedStatuses = Array(processedPizzaItems.length).fill(false);
      
      // Calculate total price
      const totalPrice = calculateTotalPrice();
      
      // Create order object
      const order = {
        customerName: orderData.customerName || 'Anonymous',
        pizzas: processedPizzaItems,
        platform: orderData.platform,
        status: 'pending',
        orderTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        prepTimeMinutes: orderData.prepTimeMinutes || 15,
        // Calculate due time based on current time + prep time minutes
        dueTime: new Date(Date.now() + (orderData.prepTimeMinutes * 60 * 1000)).toISOString(),
        totalAmount: totalPrice,
        // Add fields to track cooking status
        cooked: cookedStatuses,
        hasSpecialInstructions: hasSpecialInstructions(),
        // Add debugging fields
        source: 'FirebaseDirectForm',
        timestamp: Date.now()
      };
      
      console.log('Submitting order:', order);
      
      // Always use the fresh DB instance for submission
      const docRef = await freshDb.collection('orders').add(order);
      
      console.log('Order submitted successfully! ID:', docRef.id);
      setResult({ 
        status: 'success', 
        message: `Order submitted successfully! ID: ${docRef.id}`,
        orderId: docRef.id
      });
      
      // Reset form after successful submission
      setOrderData({
        customerName: '',
        platform: 'Window',
        prepTimeMinutes: 15
      });
      
      // Reset to a single pizza item
      setPizzaItems([{
        id: Date.now(),
        pizzaType: 'Margie Pizza',
        quantity: 1,
        specialInstructions: ''
      }]);
    } catch (error) {
      console.error('Error submitting order:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      setResult({ 
        status: 'error', 
        message: `Error submitting order: ${error.message}` 
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="p-6 bg-white rounded-lg shadow max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Simple Direct Order</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        )}
      </div>
      
      {result.status === 'success' ? (
        <div className="bg-green-100 border border-green-300 p-4 rounded mb-4">
          <p className="text-green-700">{result.message}</p>
          <button
            onClick={() => setResult({ status: 'idle', message: '' })}
            className="mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Place Another Order
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                name="customerName"
                value={orderData.customerName}
                onChange={handleOrderDataChange}
                placeholder="Optional"
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Method
              </label>
              <select
                name="platform"
                value={orderData.platform}
                onChange={handleOrderDataChange}
                className="w-full p-2 border border-gray-300 rounded"
                required
              >
                <option value="Window">Window</option>
                <option value="Uber Eats">Uber Eats</option>
                <option value="Mr D Food">Mr D Food</option>
                <option value="Bolt Food">Bolt Food</option>
                <option value="Customer Pickup">Customer Pickup</option>
                <option value="Other">Other</option>
              </select>
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prep Time (minutes)
              </label>
              <input
                type="number"
                name="prepTimeMinutes"
                value={orderData.prepTimeMinutes}
                onChange={handleOrderDataChange}
                min="5"
                max="120"
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
              <p className="text-xs text-gray-500 mt-1">How many minutes needed to prepare this order</p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-800 mb-2">Pizza Items</h3>
            
            {pizzaItems.map((pizza, index) => (
              <div key={pizza.id} className="bg-gray-50 p-3 rounded-lg mb-3 border">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Pizza #{index+1}</h4>
                  {pizzaItems.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removePizzaItem(pizza.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pizza Type
                    </label>
                    <select
                      name="pizzaType"
                      value={pizza.pizzaType}
                      onChange={(e) => handlePizzaItemChange(e, pizza.id)}
                      className="w-full p-2 border border-gray-300 rounded"
                      required
                    >
                      {pizzaMenu.map(p => (
                        <option key={`${pizza.id}-${p.id}`} value={p.name}>
                          {p.name} (R{p.price.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={pizza.quantity}
                      onChange={(e) => handlePizzaItemChange(e, pizza.id)}
                      min="1"
                      max="10"
                      className="w-full p-2 border border-gray-300 rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Instructions
                    </label>
                    <textarea
                      name="specialInstructions"
                      value={pizza.specialInstructions}
                      onChange={(e) => handlePizzaItemChange(e, pizza.id)}
                      placeholder="Extra cheese, no olives, etc."
                      className="w-full p-2 border border-gray-300 rounded h-16"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addPizzaItem}
              className="mt-2 w-full py-2 px-4 border border-dashed border-gray-400 text-gray-600 rounded hover:bg-gray-50"
            >
              + Add Another Pizza
            </button>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg border">
            <h3 className="font-medium text-gray-800 mb-1">Order Summary</h3>
            <div className="text-sm text-gray-600 mb-2">
              {pizzaItems.reduce((total, item) => total + item.quantity, 0)} pizza(s), {pizzaItems.length} different type(s)
            </div>
            <div className="font-bold text-lg">
              Total: R{calculateTotalPrice().toFixed(2)}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={submitting || !db}
            className={`w-full py-2 px-4 rounded text-white ${
              submitting || !db 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {submitting 
              ? 'Submitting...' 
              : !db 
                ? 'Initializing Firebase...' 
                : 'Place Order'
            }
          </button>
          
          {result.status === 'error' && (
            <div className="bg-red-100 border border-red-300 p-3 rounded text-red-700">
              {result.message}
            </div>
          )}
        </form>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>This form uses a stable Firebase connection that prevents termination errors.</p>
        {db && <p className="text-green-600">✓ Firebase connected and ready to process orders</p>}
        <p className="mt-1">Multiple pizzas support enabled - create complex orders with different pizza types.</p>
      </div>
    </div>
  );
};

export default FirebaseDirectForm;
