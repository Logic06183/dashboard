// Simple Node.js script to test Firebase connection
const firebase = require('firebase/compat/app');
require('firebase/compat/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA8ZVFJzBGfRDe1_vUVZd4t95G38jd3EpM",
  authDomain: "pizza-dashboard-92057.firebaseapp.com",
  projectId: "pizza-dashboard-92057",
  storageBucket: "pizza-dashboard-92057.appspot.com",
  messagingSenderId: "771301453042",
  appId: "1:771301453042:web:4a8de5b6faa9da0da94e40"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = app.firestore();

// Create a test order
const testOrder = {
  customerName: 'CLI Node Test',
  createdAt: new Date().toISOString(),
  orderTime: new Date().toISOString(),
  status: 'pending',
  platform: 'CLI',
  pizzas: [
    {
      pizzaType: 'Margie',
      quantity: 1,
      totalPrice: 149,
      isCooked: false
    }
  ],
  cooked: [false],
  orderId: `node-test-${Date.now()}`
};

console.log('Attempting to add order to Firestore...');

// Add to Firestore
db.collection('orders')
  .add(testOrder)
  .then(docRef => {
    console.log('✅ SUCCESS! Order created with ID:', docRef.id);
    console.log('Order data:', JSON.stringify(testOrder, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ ERROR adding order:', error);
    process.exit(1);
  });
