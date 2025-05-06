// Firebase configuration for persistent data storage
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, updateDoc, getDocs, getDoc, query, orderBy, deleteDoc, onSnapshot, setDoc, enableIndexedDbPersistence } from 'firebase/firestore';

// Firebase configuration values - these are public values that are safe to be in client code
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

// Enable offline persistence
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.log('The current browser does not support all of the features required to enable persistence');
    } else {
      console.error('Error enabling persistence:', err);
    }
  });
} catch (err) {
  console.error('Error enabling persistence:', err);
}

// Collection references
const ORDERS_COLLECTION = 'orders';
const ARCHIVED_ORDERS_COLLECTION = 'archived-orders';

console.log(`Firebase initialized with project: ${firebaseConfig.projectId}`);

// Firestore utility functions

// Save an order to Firestore
export const saveOrder = async (order) => {
  try {
    // Check if we already have an ID from the order
    const orderId = order.id || order.orderId || `order-${Date.now()}`;
    const cleanedId = orderId.replace(/[^a-zA-Z0-9-_]/g, '-'); // Ensure valid document ID

    // Use the ID as the document ID for better persistence
    const orderRef = doc(db, ORDERS_COLLECTION, cleanedId);
    
    // Prepare order data with timestamps
    const orderData = {
      ...order,
      id: cleanedId,
      orderId: cleanedId,
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Use setDoc instead of addDoc to use our specific ID
    await setDoc(orderRef, orderData);
    console.log(`Order saved to Firestore with ID: ${cleanedId}`);
    
    return { ...orderData, id: cleanedId };
  } catch (error) {
    console.error("Error saving order to Firestore:", error);
    // Save to localStorage as backup
    try {
      const fallbackId = order.id || order.orderId || `local-${Date.now()}`;
      const localOrder = {
        ...order,
        id: fallbackId,
        orderId: fallbackId,
        _isLocal: true,
        createdAt: order.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save to localStorage
      const savedOrders = localStorage.getItem('orders') || '[]';
      const parsedOrders = JSON.parse(savedOrders);
      
      // Check if order already exists
      const existingIndex = parsedOrders.findIndex(o => o.id === fallbackId || o.orderId === fallbackId);
      
      if (existingIndex >= 0) {
        parsedOrders[existingIndex] = localOrder;
      } else {
        parsedOrders.push(localOrder);
      }
      
      localStorage.setItem('orders', JSON.stringify(parsedOrders));
      console.log(`Order saved to localStorage as fallback with ID: ${fallbackId}`);
      
      return localOrder;
    } catch (localError) {
      console.error("Complete failure saving order:", localError);
      throw error;
    }
  }
};

// Get all orders from Firestore
export const getOrders = async () => {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const orders = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // Always ensure ID consistency
      orders.push({ id: doc.id, orderId: doc.id, ...data });
    });
    
    console.log(`Retrieved ${orders.length} orders from Firestore`);
    
    // If no orders found in Firestore, try localStorage as backup
    if (orders.length === 0) {
      try {
        const savedOrders = localStorage.getItem('orders');
        if (savedOrders) {
          const parsedOrders = JSON.parse(savedOrders);
          if (Array.isArray(parsedOrders) && parsedOrders.length > 0) {
            console.log(`Retrieved ${parsedOrders.length} orders from localStorage`);
            
            // If we have orders in localStorage but not in Firestore, try to restore them
            parsedOrders.forEach(async (order) => {
              try {
                // Only restore if it seems to be a valid order
                if (order.id && !order._isLocal) {
                  await saveOrder(order);
                }
              } catch (saveErr) {
                console.error('Error restoring order to Firestore:', saveErr);
              }
            });
            
            return parsedOrders;
          }
        }
      } catch (localErr) {
        console.error('Error reading from localStorage:', localErr);
      }
    }
    
    // Save to localStorage for offline access
    try {
      localStorage.setItem('orders', JSON.stringify(orders));
    } catch (saveErr) {
      console.error('Error saving orders to localStorage:', saveErr);
    }
    
    return orders;
  } catch (error) {
    console.error("Error getting orders from Firestore:", error);
    
    // Try localStorage as fallback
    try {
      const savedOrders = localStorage.getItem('orders');
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);
        console.log(`Fallback: Retrieved ${parsedOrders.length} orders from localStorage`);
        return parsedOrders;
      }
    } catch (localErr) {
      console.error('Error reading from localStorage fallback:', localErr);
    }
    
    return [];
  }
};

// Update an order in Firestore
export const updateOrder = async (orderId, updates) => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    console.log(`Order ${orderId} updated in Firestore`);
    return { id: orderId, ...updates };
  } catch (error) {
    console.error(`Error updating order ${orderId} in Firestore:`, error);
    throw error;
  }
};

// Update pizza status in Firestore
export const updatePizzaStatus = async (orderId, pizzaIndex, isCooked) => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (orderSnap.exists()) {
      const orderData = orderSnap.data();
      const pizzas = [...(orderData.pizzas || [])];
      
      // Make sure the pizza exists
      if (pizzaIndex >= 0 && pizzaIndex < pizzas.length) {
        // Update the pizza
        pizzas[pizzaIndex] = {
          ...pizzas[pizzaIndex],
          isCooked: isCooked
        };
        
        // Track cooked status in a separate array
        let cookedStatus = [...(orderData.cooked || [])];
        while (cookedStatus.length < pizzas.length) {
          cookedStatus.push(false);
        }
        cookedStatus[pizzaIndex] = isCooked;
        
        // Update order status if all pizzas are cooked
        const allCooked = cookedStatus.every(status => status);
        const status = allCooked ? 'ready' : orderData.status || 'pending';
        
        // Update the document
        await updateDoc(orderRef, {
          pizzas,
          cooked: cookedStatus,
          status,
          updatedAt: new Date().toISOString()
        });
        
        console.log(`Updated pizza ${pizzaIndex} in order ${orderId}, isCooked: ${isCooked}`);
        return { id: orderId, pizzas, cooked: cookedStatus, status };
      } else {
        throw new Error(`Pizza index ${pizzaIndex} out of range`);
      }
    } else {
      throw new Error(`Order ${orderId} not found`);
    }
  } catch (error) {
    console.error(`Error updating pizza status for order ${orderId}:`, error);
    
    // Fallback to localStorage for offline mode
    try {
      const savedStates = localStorage.getItem('pizzaCooked') || '{}';
      const parsedStates = JSON.parse(savedStates);
      
      let cookedArray = parsedStates[orderId]?.cooked || [];
      while (cookedArray.length <= pizzaIndex) {
        cookedArray.push(false);
      }
      cookedArray[pizzaIndex] = isCooked;
      
      const allCooked = cookedArray.every(status => status);
      const status = allCooked ? 'ready' : 'pending';
      
      parsedStates[orderId] = {
        cooked: cookedArray,
        status,
        timestamp: Date.now()
      };
      
      localStorage.setItem('pizzaCooked', JSON.stringify(parsedStates));
      console.log(`Saved pizza state to localStorage for offline mode`);
      
      return { 
        id: orderId, 
        cooked: cookedArray, 
        status,
        _isLocal: true 
      };
    } catch (localError) {
      console.error("Error in localStorage fallback:", localError);
      throw error;
    }
  }
};

// Delete an order from Firestore
export const deleteOrder = async (orderId) => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await deleteDoc(orderRef);
    console.log(`Order ${orderId} deleted from Firestore`);
    return true;
  } catch (error) {
    console.error(`Error deleting order ${orderId}:`, error);
    throw error;
  }
};

// Listen for real-time updates to orders
export const subscribeToOrders = (callback) => {
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    
    // Set up the real-time listener
    return onSnapshot(q, {
      next: (snapshot) => {
        const orders = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          // Always ensure ID consistency
          orders.push({ id: doc.id, orderId: doc.id, ...data });
        });
        
        console.log(`Real-time update: Received ${orders.length} orders from Firestore`);
        
        // Save to localStorage for offline access
        try {
          localStorage.setItem('orders', JSON.stringify(orders));
        } catch (saveErr) {
          console.error('Error saving orders to localStorage in listener:', saveErr);
        }
        
        // Update state via callback
        callback(orders);
      },
      error: (error) => {
        console.error("Error in Firestore real-time listener:", error);
        
        // Try to get orders from localStorage as fallback
        try {
          const savedOrders = localStorage.getItem('orders');
          if (savedOrders) {
            const parsedOrders = JSON.parse(savedOrders);
            console.log(`Fallback in listener: Retrieved ${parsedOrders.length} orders from localStorage`);
            callback(parsedOrders);
          }
        } catch (localErr) {
          console.error('Error reading from localStorage in listener fallback:', localErr);
          callback([]);
        }
      }
    });
  } catch (error) {
    console.error("Error setting up order subscription:", error);
    
    // Try to get orders from localStorage as immediate fallback
    try {
      const savedOrders = localStorage.getItem('orders');
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);
        console.log(`Immediate fallback: Retrieved ${parsedOrders.length} orders from localStorage`);
        setTimeout(() => callback(parsedOrders), 0);
      }
    } catch (localErr) {
      console.error('Error with immediate localStorage fallback:', localErr);
    }
    
    return () => {}; // Return empty unsubscribe function
  }
};

export { db, ORDERS_COLLECTION, ARCHIVED_ORDERS_COLLECTION };
