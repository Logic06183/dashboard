const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

// Firebase configuration - same as in your FirebaseService.js
const firebaseConfig = {
  apiKey: "AIzaSyA8ZVFJzBGfRDe1_vUVZd4t95G38jd3EpM",
  authDomain: "pizza-dashboard-92057.firebaseapp.com",
  projectId: "pizza-dashboard-92057",
  storageBucket: "pizza-dashboard-92057.appspot.com",
  messagingSenderId: "771301453042",
  appId: "1:771301453042:web:4a8de5b6faa9da0da94e40"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Create a test order
async function addTestOrder() {
  try {
    console.log('Adding test order via direct Firestore access...');
    
    const testOrder = {
      customerName: 'CLI Test User',
      platform: 'CLI Test',
      orderTime: new Date().toISOString(),
      totalAmount: 150,
      pizzas: [
        {
          pizzaType: 'CLI Test Pizza',
          quantity: 2,
          totalPrice: 150,
          specialInstructions: 'This is a CLI test order',
          isCooked: false,
          rowNumber: 1
        }
      ],
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cooked: [false],
      id: `cli-test-${Date.now()}`
    };
    
    // Add the order to Firestore
    const ordersCollection = collection(db, 'orders');
    const docRef = await addDoc(ordersCollection, testOrder);
    
    console.log('Test order successfully added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding test order:', error);
    throw error;
  }
}

// Execute the function
addTestOrder()
  .then(id => {
    console.log('Successfully created test order with ID:', id);
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to create test order:', error);
    process.exit(1);
  });
