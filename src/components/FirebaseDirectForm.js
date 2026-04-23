
import React, { useState, useEffect, useRef } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import CustomerSelector from './CustomerSelector';
import customerService from '../services/CustomerService';
import useQueueCalculator from '../hooks/useQueueCalculator';
import { deductInventoryForOrder } from '../services/FirebaseService';
import TutorialOverlay from './TutorialOverlay';

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

// Pizza menu — confirmed prices from John Dough's management (April 2026)
const pizzaMenu = [
  // Non-pizza / starter items
  { id: 'janes-dough', name: "JANE'S DOUGH", price: 89.00 },
  { id: 'braaibroodjie', name: 'BRAAIBROODJIE PIZZA', price: 100.00 },
  // Pizza items sorted by price
  { id: 'owen', name: 'OWEN', price: 99.00 },
  { id: 'margie', name: 'MARGIE', price: 119.00 },
  { id: 'caprese', name: 'CAPRESE', price: 129.00 },
  { id: 'spud', name: 'SPUD', price: 129.00 },
  { id: 'chick-tick-boom', name: 'CHICK TICK BOOM', price: 149.00 },
  { id: 'glaze-of-glory', name: 'GLAZE OF GLORY', price: 149.00 },
  { id: 'pig-in-paradise', name: 'PIG IN PARADISE', price: 149.00 },
  { id: 'artichoke-ham', name: 'ARTICHOKE & HAM', price: 155.00 },
  { id: 'quattro-formaggi', name: 'QUATTRO FORMAGGI', price: 155.00 },
  { id: 'mediterranean', name: 'MEDITERRANEAN', price: 159.00 },
  { id: 'mushroom-cloud', name: 'MUSHROOM CLOUD', price: 159.00 },
  { id: 'poppas', name: "POPPA'S", price: 159.00 },
  { id: 'the-champ', name: 'THE CHAMP', price: 159.00 },
  { id: 'vegan-harvest', name: 'VEGAN HARVEST', price: 165.00 },
  { id: 'mish-mash', name: 'MISH-MASH', price: 169.00 },
  { id: 'lekkerizza', name: "LEKKER'IZZA", price: 185.00 }
];

// Toppings/extras menu — prices confirmed April 2026
const toppingsMenu = [
  // Bases (chargeable add-ons)
  { id: 'dough-ball', name: 'Dough Ball', price: 30.00 },
  { id: 'base-with-sauce', name: 'Base with Sauce', price: 65.00 },
  // Proteins
  { id: 'anchovies', name: 'Anchovies', price: 20.00 },
  { id: 'bacon', name: 'Bacon', price: 25.00 },
  { id: 'biltong', name: 'Biltong', price: 27.00 },
  { id: 'chicken', name: 'Chicken', price: 29.00 },
  { id: 'chorizo', name: 'Chorizo', price: 20.00 },
  { id: 'ham', name: 'Ham', price: 29.00 },
  { id: 'parma-ham', name: 'Parma Ham', price: 25.00 },
  { id: 'pepperoni', name: 'Pepperoni', price: 25.00 },
  // Cheese
  { id: 'blue-cheese', name: 'Blue Cheese', price: 25.00 },
  { id: 'feta', name: 'Feta', price: 24.50 },
  { id: 'fresh-mozzarella', name: 'Fresh Mozzarella', price: 25.00 },
  { id: 'goats-cheese', name: "Goat's Cheese", price: 25.00 },
  { id: 'parmesan', name: 'Parmesan', price: 10.00 },
  { id: 'provolone', name: 'Provolone', price: 28.00 },
  { id: 'shredded-cheese', name: 'Shredded Cheese', price: 25.00 },
  // Vegetables
  { id: 'artichokes', name: 'Artichokes', price: 23.00 },
  { id: 'caramelised-onion', name: 'Caramelised Onion', price: 10.00 },
  { id: 'crispy-potatoes', name: 'Crispy Potatoes', price: 32.00 },
  { id: 'mushroom', name: 'Mushroom', price: 20.00 },
  { id: 'olives', name: 'Olives', price: 15.00 },
  { id: 'peppadew', name: 'Peppadew', price: 20.00 },
  { id: 'pineapple', name: 'Pineapple', price: 20.00 },
  { id: 'red-onion', name: 'Red Onion', price: 14.00 },
  { id: 'sundried-tomato', name: 'Sundried Tomato', price: 20.00 },
  { id: 'zucchini', name: 'Zucchini', price: 10.00 },
  // Sauces & spreads
  { id: 'balsamic-glaze', name: 'Balsamic Glaze', price: 15.00 },
  { id: 'capers', name: 'Capers', price: 15.00 },
  { id: 'chilli-oil-bottle', name: 'Chilli Oil Bottle', price: 140.00 },
  { id: 'chutney', name: 'Chutney', price: 16.00 },
  { id: 'fig-preserve', name: 'Fig Preserve', price: 15.00 },
  { id: 'hummus', name: 'Hummus', price: 15.00 },
  { id: 'pesto', name: 'Pesto', price: 15.00 },
  { id: 'sauce', name: 'Sauce', price: 15.00 },
];

// Cold drinks menu — prices confirmed by Ngunez (Illovo), April 2026
// NOTE: 'name' must match keys in PIZZA_INGREDIENTS.coldDrinks in ingredients.js
const coldDrinksMenu = [
  // Soft Drinks & Water — R20
  { id: 'coke', name: 'Coke 330ml', price: 20.00 },
  { id: 'coke-zero', name: 'Coke Zero 330ml', price: 20.00 },
  { id: 'sprite', name: 'Sprite 330ml', price: 20.00 },
  { id: 'sprite-zero', name: 'Sprite Zero 330ml', price: 20.00 },
  { id: 'ice-tea-peach', name: 'Ice Tea Peach 500ml', price: 20.00 },
  { id: 'ice-tea-lemon', name: 'Ice Tea Lemon 500ml', price: 20.00 },
  { id: 'water-sparkling', name: 'Sparkling Water 500ml', price: 20.00 },
  { id: 'water-still', name: 'Still Water 500ml', price: 20.00 },
  // Premium Beverages — R35
  { id: 'grapetiser', name: 'Grapetiser 330ml', price: 35.00 },
  { id: 'appletiser', name: 'Appletiser 330ml', price: 35.00 },
  { id: 'savanna-zero', name: 'Savanna Zero 330ml', price: 35.00 },
  { id: 'heineken-zero', name: 'Heineken Zero 330ml', price: 35.00 }
];

// This form is simplified and uses a direct Firebase approach
// with the exact pattern that works in the HTML test
const FirebaseDirectForm = ({ onClose }) => {
  const { calculateEstimatedPrepTime, formatTimeEstimate, totalPizzasInQueue, queueData } = useQueueCalculator();
  const [orderData, setOrderData] = useState({
    platform: 'Window',
    prepTimeMinutes: 15,
    specialInstructions: ''
  });
  
  // Customer selection state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [useSimpleCustomerInput, setUseSimpleCustomerInput] = useState(true); // Default to simple input
  const [simpleCustomerName, setSimpleCustomerName] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // State for managing multiple pizzas in an order
  const [pizzaItems, setPizzaItems] = useState([]);
  
  // State for managing cold drinks
  const [coldDrinks, setColdDrinks] = useState([]);
  // State for managing toppings/extras
  const [toppings, setToppings] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState({ status: 'idle', message: '' });
  const [db, setDb] = useState(null);

  // Use refs to track component mounted state
  const isMounted = useRef(true);
  const searchDebounceRef = useRef(null);

  // Tutorial steps for new order creation
  const orderTutorialSteps = [
    {
      icon: '🍕',
      title: 'Welcome to Order Creation!',
      description: 'This is where you create new pizza orders. Let\'s walk through the process step by step.',
      tips: [
        'You can close this tutorial anytime',
        'Click the info button to restart it later'
      ]
    },
    {
      icon: '👤',
      title: 'Customer Information',
      description: 'Start by entering the customer\'s name in the text field. You can either type freely or switch to customer search to find existing customers.',
      tips: [
        'Simple name entry is default',
        'Switch to search for repeat customers',
        'Customer names help track orders'
      ]
    },
    {
      icon: '🚗',
      title: 'Choose Delivery Method',
      description: 'Select how the order will be delivered: Window (walk-in), Uber Eats, Mr D Food, Bolt Food, Customer Pickup, Staff, or Other.',
      tips: [
        'Window is for walk-in customers',
        'Platform choice affects prep time estimates'
      ]
    },
    {
      icon: '⏱️',
      title: 'Set Prep Time',
      description: 'The system automatically suggests a prep time based on the current queue, but you can adjust it manually if needed.',
      tips: [
        'Default is 15 minutes',
        'System shows queue size to help estimate',
        'Longer times for peak hours'
      ]
    },
    {
      icon: '🍕',
      title: 'Add Pizzas',
      description: 'Click "Add First Pizza" to start building your order. Select the pizza type from the dropdown, set the quantity, and add special instructions if needed. You can add multiple different pizzas to one order!',
      tips: [
        'Choose pizza type from the menu',
        'Add multiple pizzas per order',
        'Special instructions are optional'
      ]
    },
    {
      icon: '🥤',
      title: 'Add Cold Drinks (Optional)',
      description: 'Click "+ Add Cold Drink" to include beverages in the order. Select the drink type and quantity.',
      tips: [
        'Drinks are optional',
        'Add as many as needed',
        'Popular choices: Coke, Sprite, Appletizer'
      ]
    },
    {
      icon: '💰',
      title: 'Review & Place Order',
      description: 'The order summary shows total items and price. When ready, click "Place Order" to submit. The system will automatically deduct ingredients from inventory!',
      tips: [
        'Order summary shows total cost',
        'Inventory deducts automatically',
        'You\'ll see a success message when done'
      ]
    }
  ];

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
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Search for customer suggestions when typing
  const handleCustomerNameChange = async (e) => {
    const value = e.target.value;
    setSimpleCustomerName(value);
    
    // Clear previous timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    // Hide suggestions if input is empty or too short
    if (!value || value.length < 2) {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    // Debounce the search
    searchDebounceRef.current = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const results = await customerService.searchCustomers(value);
        setCustomerSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Error searching customers:', error);
        setCustomerSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300); // 300ms debounce
  };

  // Handle selecting a suggestion
  const handleSelectSuggestion = (customer) => {
    setSimpleCustomerName(customer.name);
    setShowSuggestions(false);
    setCustomerSuggestions([]);
  };

  // Hide suggestions when clicking outside
  const handleInputBlur = () => {
    // Delay to allow clicking on suggestions
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };
  
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
    
    // If quantity is set to 0, remove the pizza item
    if (name === 'quantity' && parseInt(value, 10) === 0) {
      setPizzaItems(prevItems => prevItems.filter(item => item.id !== pizzaId));
      return;
    }
    
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
        pizzaType: 'MARGIE',
        quantity: 1,
        specialInstructions: ''
      }
    ]);
  };
  
  // Add a cold drink to the order
  const addColdDrink = () => {
    setColdDrinks(prev => [
      ...prev,
      {
        id: Date.now(),
        drinkType: coldDrinksMenu[0].name,
        quantity: 1
      }
    ]);
  };
  
  // Remove a cold drink from the order
  const removeColdDrink = (drinkId) => {
    setColdDrinks(prev => prev.filter(item => item.id !== drinkId));
  };
  
  // Handle changes to a cold drink item
  const handleColdDrinkChange = (e, drinkId) => {
    const { name, value } = e.target;
    setColdDrinks(prevItems => {
      return prevItems.map(item => {
        if (item.id === drinkId) {
          return {
            ...item,
            [name]: name === 'quantity' ? parseInt(value, 10) : value
          };
        }
        return item;
      });
    });
  };
  
  // Add a topping/extra to the order
  const addTopping = () => {
    setToppings(prev => [
      ...prev,
      {
        id: Date.now(),
        toppingType: toppingsMenu[0].name,
        quantity: 1
      }
    ]);
  };

  // Remove a topping from the order
  const removeTopping = (toppingId) => {
    setToppings(prev => prev.filter(item => item.id !== toppingId));
  };

  // Handle changes to a topping item
  const handleToppingChange = (e, toppingId) => {
    const { name, value } = e.target;
    setToppings(prevItems =>
      prevItems.map(item =>
        item.id === toppingId
          ? { ...item, [name]: name === 'quantity' ? parseInt(value, 10) : value }
          : item
      )
    );
  };

  // Remove a pizza from the order
  const removePizzaItem = (pizzaId) => {
    // Allow removing pizzas if there are cold drinks or toppings, otherwise require at least one pizza
    if (pizzaItems.length > 1 || coldDrinks.length > 0 || toppings.length > 0) {
      setPizzaItems(prev => prev.filter(item => item.id !== pizzaId));
    }
  };
  
  // Calculate total price of the order
  const calculateTotalPrice = () => {
    const pizzaTotal = pizzaItems.reduce((total, item) => {
      const pizza = pizzaMenu.find(p => p.name === item.pizzaType) || { price: 159 };
      return total + (pizza.price * item.quantity);
    }, 0);

    const drinksTotal = coldDrinks.reduce((total, item) => {
      const drink = coldDrinksMenu.find(d => d.name === item.drinkType) || { price: 25 };
      return total + (drink.price * item.quantity);
    }, 0);

    const toppingsTotal = toppings.reduce((total, item) => {
      const topping = toppingsMenu.find(t => t.name === item.toppingType) || { price: 0 };
      return total + (topping.price * item.quantity);
    }, 0);

    return pizzaTotal + drinksTotal + toppingsTotal;
  };
  
  // Check if any pizza has special instructions
  const hasSpecialInstructions = () => {
    return pizzaItems.some(item => item.specialInstructions && item.specialInstructions.trim() !== '');
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that there's at least one item (pizza, drink, or topping)
    if (pizzaItems.length === 0 && coldDrinks.length === 0 && toppings.length === 0) {
      setResult({
        status: 'error',
        message: 'Please add at least one pizza, cold drink, or topping to the order'
      });
      return;
    }
    
    // Validate customer name in simple mode
    if (useSimpleCustomerInput && !simpleCustomerName.trim()) {
      setResult({ 
        status: 'error', 
        message: 'Please enter a customer name'
      });
      return;
    }
    
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
      
      // Process cold drinks
      const processedColdDrinks = coldDrinks.map(item => {
        const drink = coldDrinksMenu.find(d => d.name === item.drinkType) || { price: 25 };
        return {
          drinkType: item.drinkType,
          quantity: item.quantity,
          totalPrice: drink.price * item.quantity
        };
      });

      // Process toppings/extras
      const processedToppings = toppings.map(item => {
        const topping = toppingsMenu.find(t => t.name === item.toppingType) || { price: 0 };
        return {
          toppingType: item.toppingType,
          quantity: item.quantity,
          totalPrice: topping.price * item.quantity
        };
      });
      
      // Calculate total price
      const totalPrice = calculateTotalPrice();
      
      // Handle customer information
      let customer = selectedCustomer;
      
      // If using simple input mode, use the simple customer name
      if (useSimpleCustomerInput && simpleCustomerName) {
        customer = {
          id: null,
          name: simpleCustomerName.trim(),
          phone: '',
          category: 'New'
        };
      } else if (!customer && orderData.customerName) {
        // Fallback for backward compatibility
        customer = await customerService.getOrCreateCustomer({
          name: orderData.customerName
        });
      } else if (!customer) {
        customer = {
          id: null,
          name: 'Anonymous Customer',
          phone: '',
          category: 'New'
        };
      }

      // Create order object
      const order = {
        customerId: customer.id,
        customerName: customer.name,
        phone: customer.phone || '',
        pizzas: processedPizzaItems,
        coldDrinks: processedColdDrinks,
        toppings: processedToppings,
        platform: orderData.platform,
        status: 'pending',
        orderTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        prepTimeMinutes: orderData.prepTimeMinutes || 15,
        dueTime: new Date(Date.now() + (orderData.prepTimeMinutes * 60 * 1000)).toISOString(),
        totalAmount: totalPrice,
        cooked: cookedStatuses,
        specialInstructions: orderData.specialInstructions || '',
        hasSpecialInstructions: hasSpecialInstructions() || !!(orderData.specialInstructions && orderData.specialInstructions.trim()),
        // Add debugging fields
        source: 'FirebaseDirectForm',
        timestamp: Date.now()
      };
      
      console.log('Submitting order:', order);
      
      // Always use the fresh DB instance for submission
      const docRef = await freshDb.collection('orders').add(order);
      
      console.log('Order submitted successfully! ID:', docRef.id);

      // Deduct inventory for this order
      try {
        console.log('Deducting inventory for order...');
        const inventoryResult = await deductInventoryForOrder(order);

        if (inventoryResult.success) {
          console.log('Inventory deducted:', inventoryResult.deductions);
          if (inventoryResult.warnings && inventoryResult.warnings.length > 0) {
            console.warn('Inventory warnings:', inventoryResult.warnings);
          }
        } else {
          console.error('Inventory deduction failed:', inventoryResult.error);
        }
      } catch (error) {
        console.error('Error deducting inventory:', error);
        // Don't fail the order if inventory deduction fails
      }

      // Track window customer orders for delay notifications
      if (orderData.platform === 'Window' && pizzaItems.length > 0) {
        // Import queue calculator to track this order
        const queueCalculator = await import('../services/pizzaQueueCalculator');
        const totalPizzas = pizzaItems.reduce((sum, pizza) => sum + (pizza.quantity || 1), 0);
        const estimatedTime = calculateEstimatedPrepTime(totalPizzas);
        queueCalculator.default.trackWindowOrderEstimate(docRef.id, customer.name, estimatedTime);
      }

      // Update customer statistics if we have a valid customer
      if (customer.id) {
        try {
          await customerService.updateCustomerStats(customer.id, order);
          console.log('Customer statistics updated successfully');
        } catch (error) {
          console.error('Error updating customer statistics:', error);
          // Don't fail the order if customer stats update fails
        }
      }
      
      setResult({ 
        status: 'success', 
        message: `Order submitted successfully! ID: ${docRef.id}`,
        orderId: docRef.id
      });
      
      // Reset form after successful submission
      setOrderData({
        platform: 'Window',
        prepTimeMinutes: 15,
        specialInstructions: ''
      });
      setSelectedCustomer(null);
      setSimpleCustomerName(''); // Clear simple customer name
      setCustomerSuggestions([]); // Clear suggestions
      setShowSuggestions(false);
      
      // Reset to empty arrays
      setPizzaItems([]);
      setColdDrinks([]);
      setToppings([]);
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
      {/* Order Creation Tutorial */}
      <TutorialOverlay
        steps={orderTutorialSteps}
        tutorialKey="order_creation"
        autoStart={true}
      />

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
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Customer Name
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setUseSimpleCustomerInput(!useSimpleCustomerInput);
                    // Clear the other input when switching
                    if (!useSimpleCustomerInput) {
                      setSelectedCustomer(null);
                    } else {
                      setSimpleCustomerName('');
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {useSimpleCustomerInput ? 'Switch to Customer Search' : 'Switch to Simple Input'}
                </button>
              </div>
              
              {useSimpleCustomerInput ? (
                <div className="relative">
                  <input
                    type="text"
                    value={simpleCustomerName}
                    onChange={handleCustomerNameChange}
                    onFocus={() => {
                      if (customerSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={handleInputBlur}
                    placeholder="Enter customer name..."
                    className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                    autoComplete="off"
                  />
                  
                  {/* Loading indicator */}
                  {isLoadingSuggestions && (
                    <div className="absolute right-2 top-2 text-gray-400">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                  
                  {/* Suggestions dropdown */}
                  {showSuggestions && customerSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {customerSuggestions.map((customer, index) => (
                        <button
                          key={customer.id || index}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent blur
                            handleSelectSuggestion(customer);
                          }}
                        >
                          <div className="font-medium">{customer.name}</div>
                          {customer.phone && (
                            <div className="text-sm text-gray-500">{customer.phone}</div>
                          )}
                          <div className="text-xs text-gray-400">
                            {customer.totalOrders || 0} orders • {customer.category || 'New'} customer
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <CustomerSelector
                  selectedCustomer={selectedCustomer}
                  onCustomerSelect={setSelectedCustomer}
                  placeholder="Search existing customer or enter new name..."
                  className="mb-2"
                />
              )}
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
                <option value="Staff">Staff</option>
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
              
              {/* Enhanced Queue Estimate Preview */}
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-1">
                  Window Customer Estimate
                </div>
                <div className="text-sm text-blue-600">
                  Current queue: <span className="font-semibold">{totalPizzasInQueue} pizzas</span>
                </div>
                {pizzaItems.length > 0 && (
                  <div className="text-sm text-blue-600">
                    Estimated ready time: <span className="font-semibold">
                      ~{formatTimeEstimate(calculateEstimatedPrepTime(
                        pizzaItems.reduce((sum, pizza) => sum + (pizza.quantity || 1), 0)
                      ))}
                    </span>
                  </div>
                )}
                
                {pizzaItems.length === 0 && coldDrinks.length > 0 && (
                  <div className="text-sm text-green-600">
                    <span className="font-semibold">Cold drinks only - Ready immediately!</span>
                  </div>
                )}
                
                {/* Rush period indicator */}
                {queueData?.rushInfo?.isRushPeriod && (
                  <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded mt-1">
                    ⚠️ Rush period ({queueData.rushInfo.timeSlot}) - Expect {queueData.rushInfo.expectedPizzas} more pizzas
                  </div>
                )}
                
                {queueData?.rushInfo?.isFridayRush && (
                  <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded mt-1">
                    🔥 Friday Rush Mode Active - Times may extend
                  </div>
                )}
                
                <div className="text-xs text-blue-500 mt-1">
                  * Includes predicted incoming orders • Updates automatically
                </div>
              </div>
            </div>
          </div>

          <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-3">
            <label className="block text-sm font-semibold text-yellow-800 mb-1">
              📝 Order Instructions (optional)
            </label>
            <textarea
              name="specialInstructions"
              value={orderData.specialInstructions}
              onChange={handleOrderDataChange}
              placeholder="e.g. Allergy info, call when ready, leave at door, no onions on pizza 2..."
              className="w-full p-2 border border-yellow-300 rounded h-16 text-sm bg-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
            />
            <p className="text-xs text-yellow-700 mt-1">These notes appear on the kitchen display for all staff to see.</p>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-800 mb-2">Pizza Items</h3>
            
            {pizzaItems.length === 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-400 text-center">
                <p className="text-gray-600 mb-2">No pizzas added yet</p>
                <button
                  type="button"
                  onClick={addPizzaItem}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Add First Pizza
                </button>
              </div>
            ) : (
              pizzaItems.map((pizza, index) => (
              <div key={pizza.id} className="bg-gray-50 p-3 rounded-lg mb-3 border">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Pizza #{index+1}</h4>
                  {(pizzaItems.length > 1 || coldDrinks.length > 0) && (
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
                      min="0"
                      max="10"
                      className="w-full p-2 border border-gray-300 rounded"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Set to 0 to remove this pizza</p>
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
              ))
            )}
            
            {pizzaItems.length > 0 && (
              <button
                type="button"
                onClick={addPizzaItem}
                className="mt-2 w-full py-2 px-4 border border-dashed border-gray-400 text-gray-600 rounded hover:bg-gray-50"
              >
                + Add Another Pizza
              </button>
            )}
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-800 mb-2">Cold Drinks</h3>
            
            {coldDrinks.map((drink, index) => (
              <div key={drink.id} className="bg-blue-50 p-3 rounded-lg mb-3 border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-blue-800">Drink #{index+1}</h4>
                  <button 
                    type="button"
                    onClick={() => removeColdDrink(drink.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Drink Type
                    </label>
                    <select
                      name="drinkType"
                      value={drink.drinkType}
                      onChange={(e) => handleColdDrinkChange(e, drink.id)}
                      className="w-full p-2 border border-gray-300 rounded"
                      required
                    >
                      {coldDrinksMenu.map(d => (
                        <option key={`${drink.id}-${d.id}`} value={d.name}>
                          {d.name} (R{d.price.toFixed(2)})
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
                      value={drink.quantity}
                      onChange={(e) => handleColdDrinkChange(e, drink.id)}
                      min="1"
                      max="10"
                      className="w-full p-2 border border-gray-300 rounded"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addColdDrink}
              className="mt-2 w-full py-2 px-4 border border-dashed border-blue-400 text-blue-600 rounded hover:bg-blue-50"
            >
              + Add Cold Drink
            </button>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-800 mb-2">Toppings / Extras</h3>

            {toppings.map((topping, index) => (
              <div key={topping.id} className="bg-green-50 p-3 rounded-lg mb-3 border border-green-200">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-green-800">Extra #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeTopping(topping.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Topping / Extra
                    </label>
                    <select
                      name="toppingType"
                      value={topping.toppingType}
                      onChange={(e) => handleToppingChange(e, topping.id)}
                      className="w-full p-2 border border-gray-300 rounded"
                      required
                    >
                      {toppingsMenu.map(t => (
                        <option key={`${topping.id}-${t.id}`} value={t.name}>
                          {t.name} (R{t.price.toFixed(2)})
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
                      value={topping.quantity}
                      onChange={(e) => handleToppingChange(e, topping.id)}
                      min="1"
                      max="10"
                      className="w-full p-2 border border-gray-300 rounded"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addTopping}
              className="mt-2 w-full py-2 px-4 border border-dashed border-green-400 text-green-600 rounded hover:bg-green-50"
            >
              + Add Topping / Extra
            </button>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border">
            <h3 className="font-medium text-gray-800 mb-1">Order Summary</h3>
            <div className="text-sm text-gray-600 mb-2">
              {pizzaItems.length > 0 && (
                <span className="block">
                  {pizzaItems.reduce((total, item) => total + item.quantity, 0)} pizza(s), {pizzaItems.length} different type(s)
                </span>
              )}
              {coldDrinks.length > 0 && (
                <span className="block">
                  {coldDrinks.reduce((total, item) => total + item.quantity, 0)} drink(s), {coldDrinks.length} different type(s)
                </span>
              )}
              {toppings.length > 0 && (
                <span className="block">
                  {toppings.reduce((total, item) => total + item.quantity, 0)} extra(s), {toppings.length} different type(s)
                </span>
              )}
              {pizzaItems.length === 0 && coldDrinks.length === 0 && toppings.length === 0 && (
                <span className="text-gray-500 italic">No items added yet</span>
              )}
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
