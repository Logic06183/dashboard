/**
 * FirebaseService.js
 * Single source of truth for all Firebase/Firestore operations
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  enableIndexedDbPersistence
} from 'firebase/firestore';

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
const WASTED_ORDERS_COLLECTION = 'wasted-orders';
const INVENTORY_COLLECTION = 'inventory';

// Helper logging functions
const log = (message, data = null) => {
  console.log(`[FIREBASE] ${message}`, data || '');
};

const errorLog = (message, error = null) => {
  console.error(`[FIREBASE ERROR] ${message}`, error || '');
};

// ========== Order Operations ==========

/**
 * Create a new order in Firestore
 * @param {Object} orderData - The order data to save
 * @returns {Promise<Object>} The created order with ID
 */
export const createOrder = async (orderData) => {
  try {
    log('Creating new order:', orderData);
    
    // Ensure we have a clean order ID
    const orderId = orderData.id || `order-${Date.now()}`;
    const cleanedId = orderId.replace(/[^a-zA-Z0-9-_]/g, '-');
    
    // Set up the order data with timestamps
    const orderToSave = {
      ...orderData,
      id: cleanedId,
      orderId: cleanedId,
      createdAt: orderData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: orderData.status || 'pending'
    };
    
    // Create a reference with the specific ID
    const orderRef = doc(db, ORDERS_COLLECTION, cleanedId);
    
    // Use setDoc to use our specific ID
    await setDoc(orderRef, orderToSave);
    
    log(`Order saved to Firestore with ID: ${cleanedId}`);
    return { ...orderToSave, id: cleanedId };
  } catch (error) {
    errorLog("Error creating order:", error);
    throw error;
  }
};

/**
 * Get all orders from Firestore
 * @returns {Promise<Array>} Array of orders
 */
export const getOrders = async () => {
  try {
    log('Fetching orders from Firestore');
    
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const orders = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      orders.push({ id: doc.id, ...data });
    });
    
    log(`Retrieved ${orders.length} orders from Firestore`);
    return orders;
  } catch (error) {
    errorLog("Error fetching orders:", error);
    throw error;
  }
};

/**
 * Get a single order by ID
 * @param {string} orderId - The order ID to fetch
 * @returns {Promise<Object|null>} The order or null if not found
 */
export const getOrderById = async (orderId) => {
  try {
    log(`Fetching order with ID: ${orderId}`);
    
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (orderSnap.exists()) {
      const orderData = orderSnap.data();
      log(`Retrieved order ${orderId}`);
      return { id: orderId, ...orderData };
    } else {
      log(`Order ${orderId} not found`);
      return null;
    }
  } catch (error) {
    errorLog(`Error fetching order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Update an order in Firestore
 * @param {string} orderId - The order ID to update
 * @param {Object} updates - The updates to apply
 * @returns {Promise<Object>} The updated order
 */
export const updateOrder = async (orderId, updates) => {
  try {
    log(`Updating order ${orderId}:`, updates);
    
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    
    // Add updatedAt timestamp
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(orderRef, updatesWithTimestamp);
    
    log(`Order ${orderId} updated in Firestore`);
    
    // Fetch the updated order to return
    const updatedOrder = await getOrderById(orderId);
    return updatedOrder;
  } catch (error) {
    errorLog(`Error updating order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Update the cooked status of a pizza in an order
 * @param {string} orderId - The order ID
 * @param {number} pizzaIndex - The index of the pizza in the order
 * @param {boolean} isCooked - Whether the pizza is cooked
 * @returns {Promise<Object>} The updated order
 */
export const updatePizzaStatus = async (orderId, pizzaIndex, isCooked) => {
  try {
    log(`Updating pizza ${pizzaIndex} in order ${orderId} to isCooked=${isCooked}`);
    
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    const orderData = orderSnap.data();
    const pizzas = [...(orderData.pizzas || [])];
    
    if (pizzaIndex < 0 || pizzaIndex >= pizzas.length) {
      throw new Error(`Pizza index ${pizzaIndex} out of range`);
    }
    
    // Update the pizza
    pizzas[pizzaIndex] = {
      ...pizzas[pizzaIndex],
      isCooked: isCooked
    };
    
    // Track cooked status
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
    
    log(`Updated pizza ${pizzaIndex} in order ${orderId}, isCooked: ${isCooked}`);
    
    // Return the updated order data
    return { 
      id: orderId, 
      ...orderData, 
      pizzas, 
      cooked: cookedStatus, 
      status 
    };
  } catch (error) {
    errorLog(`Error updating pizza status:`, error);
    throw error;
  }
};

/**
 * Delete an order from Firestore
 * @param {string} orderId - The order ID to delete
 * @returns {Promise<boolean>} Whether the deletion was successful
 */
export const deleteOrder = async (orderId) => {
  try {
    log(`Deleting order ${orderId}`);
    
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await deleteDoc(orderRef);
    
    log(`Order ${orderId} deleted from Firestore`);
    return true;
  } catch (error) {
    errorLog(`Error deleting order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Archive an order (move it to archived-orders collection)
 * @param {string} orderId - The order ID to archive
 * @returns {Promise<Object>} Result of the archive operation
 */
export const archiveOrder = async (orderId) => {
  try {
    log(`Archiving order ${orderId}`);
    
    // Get the order
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    const orderData = orderSnap.data();
    
    // Create the archived order
    const archivedOrderData = {
      ...orderData,
      archivedAt: new Date().toISOString(),
      originalId: orderId
    };
    
    // Add to archived collection
    const archivedRef = collection(db, ARCHIVED_ORDERS_COLLECTION);
    const archivedDocRef = await addDoc(archivedRef, archivedOrderData);
    
    // Delete the original order
    await deleteDoc(orderRef);
    
    log(`Order ${orderId} archived successfully with archived ID: ${archivedDocRef.id}`);
    
    return {
      success: true,
      originalId: orderId,
      archivedId: archivedDocRef.id
    };
  } catch (error) {
    errorLog(`Error archiving order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Get archived orders
 * @returns {Promise<Array>} Array of archived orders
 */
export const getArchivedOrders = async () => {
  try {
    log('Fetching archived orders');
    
    const archivedRef = collection(db, ARCHIVED_ORDERS_COLLECTION);
    const q = query(archivedRef, orderBy('archivedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const archivedOrders = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      archivedOrders.push({ id: doc.id, ...data });
    });
    
    log(`Retrieved ${archivedOrders.length} archived orders`);
    return archivedOrders;
  } catch (error) {
    errorLog("Error fetching archived orders:", error);
    throw error;
  }
};

// ========== Waste Management Operations ==========

/**
 * Mark an entire order as wasted
 * @param {string} orderId - The order ID to mark as wasted
 * @param {Object} wasteData - Waste information (reason, details, wastedBy)
 * @returns {Promise<Object>} Result of the waste operation
 */
export const markOrderAsWaste = async (orderId, wasteData) => {
  try {
    log(`Marking order ${orderId} as waste:`, wasteData);
    
    // Get the order
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    const orderData = orderSnap.data();
    
    // Create waste entry
    const wastedOrderData = {
      ...orderData,
      originalOrderId: orderId,
      wasteStatus: 'wasted',
      wasteReason: wasteData.reason,
      wasteDetails: wasteData.details || '',
      wasteTimestamp: new Date().toISOString(),
      wastedBy: wasteData.wastedBy || 'Unknown',
      wasteType: 'full_order', // Full order vs individual pizza
      wasteValue: orderData.totalAmount || 0
    };
    
    // Add to wasted collection
    const wastedRef = collection(db, WASTED_ORDERS_COLLECTION);
    const wastedDocRef = await addDoc(wastedRef, wastedOrderData);
    
    // Delete the original order
    await deleteDoc(orderRef);
    
    log(`Order ${orderId} marked as waste with waste ID: ${wastedDocRef.id}`);
    
    return {
      success: true,
      originalId: orderId,
      wastedId: wastedDocRef.id,
      wasteValue: wastedOrderData.wasteValue
    };
  } catch (error) {
    errorLog(`Error marking order ${orderId} as waste:`, error);
    throw error;
  }
};

/**
 * Mark specific pizzas in an order as wasted
 * @param {string} orderId - The order ID
 * @param {Array} pizzaIndexes - Array of pizza indexes to mark as wasted
 * @param {Object} wasteData - Waste information (reason, details, wastedBy)
 * @returns {Promise<Object>} Result of the waste operation
 */
export const markPizzasAsWaste = async (orderId, pizzaIndexes, wasteData) => {
  try {
    log(`Marking pizzas ${pizzaIndexes.join(', ')} in order ${orderId} as waste:`, wasteData);
    
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    const orderData = orderSnap.data();
    const pizzas = orderData.pizzas || [];
    
    // Calculate waste value
    let wasteValue = 0;
    const wastedPizzas = [];
    
    pizzaIndexes.forEach(index => {
      if (index < pizzas.length) {
        const pizza = pizzas[index];
        wasteValue += pizza.totalPrice || 0;
        wastedPizzas.push({
          ...pizza,
          pizzaIndex: index,
          wasteReason: wasteData.reason,
          wasteDetails: wasteData.details || '',
          wasteTimestamp: new Date().toISOString(),
          wastedBy: wasteData.wastedBy || 'Unknown'
        });
      }
    });
    
    // Create waste entry for the pizzas
    const wastedPizzaData = {
      originalOrderId: orderId,
      customerName: orderData.customerName,
      orderTime: orderData.orderTime,
      platform: orderData.platform,
      wasteStatus: 'wasted',
      wasteReason: wasteData.reason,
      wasteDetails: wasteData.details || '',
      wasteTimestamp: new Date().toISOString(),
      wastedBy: wasteData.wastedBy || 'Unknown',
      wasteType: 'partial_pizzas',
      wastedPizzas: wastedPizzas,
      wasteValue: wasteValue
    };
    
    // Add to wasted collection
    const wastedRef = collection(db, WASTED_ORDERS_COLLECTION);
    const wastedDocRef = await addDoc(wastedRef, wastedPizzaData);
    
    // Update the original order - remove wasted pizzas and update cooked array
    const remainingPizzas = pizzas.filter((_, index) => !pizzaIndexes.includes(index));
    const remainingCooked = (orderData.cooked || []).filter((_, index) => !pizzaIndexes.includes(index));
    
    if (remainingPizzas.length === 0) {
      // If no pizzas left, delete the entire order
      await deleteDoc(orderRef);
      log(`Order ${orderId} completely wasted - deleted from orders`);
    } else {
      // Update order with remaining pizzas
      const updatedTotalAmount = remainingPizzas.reduce((sum, pizza) => sum + (pizza.totalPrice || 0), 0);
      
      await updateDoc(orderRef, {
        pizzas: remainingPizzas,
        cooked: remainingCooked,
        totalAmount: updatedTotalAmount,
        updatedAt: new Date().toISOString(),
        hasWastedItems: true
      });
      
      log(`Updated order ${orderId} with ${remainingPizzas.length} remaining pizzas`);
    }
    
    return {
      success: true,
      originalId: orderId,
      wastedId: wastedDocRef.id,
      wasteValue: wasteValue,
      remainingPizzas: remainingPizzas.length
    };
  } catch (error) {
    errorLog(`Error marking pizzas as waste in order ${orderId}:`, error);
    throw error;
  }
};

/**
 * Get wasted orders/items
 * @param {Object} options - Query options (dateRange, limit)
 * @returns {Promise<Array>} Array of wasted items
 */
export const getWastedOrders = async (options = {}) => {
  try {
    log('Fetching wasted orders');
    
    const wastedRef = collection(db, WASTED_ORDERS_COLLECTION);
    let q = query(wastedRef, orderBy('wasteTimestamp', 'desc'));
    
    if (options.limit) {
      q = query(q, limit(options.limit));
    }
    
    const snapshot = await getDocs(q);
    
    const wastedOrders = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      wastedOrders.push({ id: doc.id, ...data });
    });
    
    log(`Retrieved ${wastedOrders.length} wasted items`);
    return wastedOrders;
  } catch (error) {
    errorLog("Error fetching wasted orders:", error);
    throw error;
  }
};

/**
 * Get waste analytics for a date range
 * @param {Object} dateRange - Start and end dates
 * @returns {Promise<Object>} Waste analytics data
 */
export const getWasteAnalytics = async (dateRange = {}) => {
  try {
    log('Calculating waste analytics');
    
    const wastedOrders = await getWastedOrders();
    
    // Filter by date range if provided
    let filteredWaste = wastedOrders;
    if (dateRange.start || dateRange.end) {
      filteredWaste = wastedOrders.filter(item => {
        const wasteDate = new Date(item.wasteTimestamp);
        if (dateRange.start && wasteDate < new Date(dateRange.start)) return false;
        if (dateRange.end && wasteDate > new Date(dateRange.end)) return false;
        return true;
      });
    }
    
    // Calculate analytics
    const totalWastedItems = filteredWaste.length;
    const totalWasteValue = filteredWaste.reduce((sum, item) => sum + (item.wasteValue || 0), 0);
    
    // Group by reason
    const wasteByReason = {};
    filteredWaste.forEach(item => {
      const reason = item.wasteReason || 'Unknown';
      if (!wasteByReason[reason]) {
        wasteByReason[reason] = { count: 0, value: 0 };
      }
      wasteByReason[reason].count += 1;
      wasteByReason[reason].value += item.wasteValue || 0;
    });
    
    // Group by date for trend analysis
    const wasteByDate = {};
    filteredWaste.forEach(item => {
      const date = new Date(item.wasteTimestamp).toDateString();
      if (!wasteByDate[date]) {
        wasteByDate[date] = { count: 0, value: 0 };
      }
      wasteByDate[date].count += 1;
      wasteByDate[date].value += item.wasteValue || 0;
    });
    
    return {
      totalWastedItems,
      totalWasteValue,
      wasteByReason,
      wasteByDate,
      averageWastePerItem: totalWastedItems > 0 ? totalWasteValue / totalWastedItems : 0
    };
  } catch (error) {
    errorLog("Error calculating waste analytics:", error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates for orders
 * @param {Function} callback - Function to call with updated orders array
 * @returns {Function} Unsubscribe function
 */
export const subscribeToOrders = (callback) => {
  try {
    log('Setting up real-time order subscription');
    
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    
    // Set up the real-time listener
    return onSnapshot(q, {
      next: (snapshot) => {
        const orders = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          orders.push({ id: doc.id, ...data });
        });
        
        log(`Real-time update: Received ${orders.length} orders`);
        callback(orders);
      },
      error: (error) => {
        errorLog("Error in Firestore real-time listener:", error);
        callback([]);
      }
    });
  } catch (error) {
    errorLog("Error setting up order subscription:", error);
    return () => {}; // Return empty unsubscribe function
  }
};

/**
 * Subscribe to a single order's real-time updates
 * @param {string} orderId - The order ID to subscribe to
 * @param {Function} callback - Function to call with the updated order
 * @returns {Function} Unsubscribe function
 */
export const subscribeToOrder = (orderId, callback) => {
  try {
    log(`Setting up real-time subscription for order ${orderId}`);
    
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    
    return onSnapshot(orderRef, {
      next: (docSnapshot) => {
        if (docSnapshot.exists()) {
          const orderData = docSnapshot.data();
          log(`Real-time update for order ${orderId}`);
          callback({ id: orderId, ...orderData });
        } else {
          log(`Order ${orderId} no longer exists`);
          callback(null);
        }
      },
      error: (error) => {
        errorLog(`Error in real-time listener for order ${orderId}:`, error);
        callback(null);
      }
    });
  } catch (error) {
    errorLog(`Error setting up subscription for order ${orderId}:`, error);
    return () => {}; // Return empty unsubscribe function
  }
};

// ========== Inventory Management ==========

/**
 * Get the current inventory from Firestore
 * @returns {Promise<Object>} The inventory object
 */
export const getInventory = async () => {
  try {
    log('Fetching inventory from Firestore');
    
    const inventoryRef = doc(db, INVENTORY_COLLECTION, 'current');
    const inventorySnap = await getDoc(inventoryRef);
    
    if (inventorySnap.exists()) {
      const inventoryData = inventorySnap.data();
      log('Retrieved inventory from Firestore');
      return inventoryData.items || {};
    } else {
      log('No inventory found in Firestore, creating default');
      // Create default inventory
      const defaultInventory = {
        sourdough_dough: { amount: 100, unit: 'balls', threshold: 20 },
        tomato_sauce: { amount: 50, unit: 'liters', threshold: 10 },
        mozzarella_cheese: { amount: 40, unit: 'kg', threshold: 8 },
        pepperoni: { amount: 30, unit: 'kg', threshold: 5 },
        mushrooms: { amount: 25, unit: 'kg', threshold: 5 },
        bacon: { amount: 15, unit: 'kg', threshold: 3 },
        goats_cheese: { amount: 10, unit: 'kg', threshold: 2 },
        caramelised_onions: { amount: 8, unit: 'kg', threshold: 2 }, 
        fresh_basil: { amount: 5, unit: 'kg', threshold: 1 },
        olives: { amount: 7, unit: 'kg', threshold: 2 }
      };
      
      // Save the default inventory
      await setDoc(inventoryRef, { 
        items: defaultInventory,
        updatedAt: new Date().toISOString() 
      });
      
      return defaultInventory;
    }
  } catch (error) {
    errorLog('Error getting inventory:', error);
    throw error;
  }
};

/**
 * Update the inventory in Firestore
 * @param {Object} inventory - The updated inventory object
 * @returns {Promise<Object>} The updated inventory
 */
export const updateInventory = async (inventory) => {
  try {
    log('Updating inventory in Firestore');
    
    const inventoryRef = doc(db, INVENTORY_COLLECTION, 'current');
    
    await setDoc(inventoryRef, { 
      items: inventory,
      updatedAt: new Date().toISOString() 
    });
    
    log('Inventory updated in Firestore');
    return inventory;
  } catch (error) {
    errorLog('Error updating inventory:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time inventory updates
 * @param {Function} callback - Function to call with updated inventory
 * @returns {Function} Unsubscribe function
 */
export const subscribeToInventory = (callback) => {
  try {
    log('Setting up real-time inventory subscription');
    
    const inventoryRef = doc(db, INVENTORY_COLLECTION, 'current');
    
    return onSnapshot(inventoryRef, {
      next: (docSnapshot) => {
        if (docSnapshot.exists()) {
          const inventoryData = docSnapshot.data();
          log('Real-time inventory update');
          callback(inventoryData.items || {});
        } else {
          log('No inventory exists yet');
          callback({});
        }
      },
      error: (error) => {
        errorLog('Error in real-time inventory listener:', error);
        callback({});
      }
    });
  } catch (error) {
    errorLog('Error setting up inventory subscription:', error);
    return () => {}; // Return empty unsubscribe function
  }
};

// Export the Firebase app and Firestore db for direct access if needed
export { app, db, ORDERS_COLLECTION, ARCHIVED_ORDERS_COLLECTION, WASTED_ORDERS_COLLECTION, INVENTORY_COLLECTION };

// Export as default object - ensure we include db for direct access if needed
const FirebaseService = {
  // Direct access to Firebase
  app,
  db,
  // Order functions
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  updatePizzaStatus,
  deleteOrder,
  archiveOrder,
  getArchivedOrders,
  subscribeToOrders,
  subscribeToOrder,
  // Waste management functions
  markOrderAsWaste,
  markPizzasAsWaste,
  getWastedOrders,
  getWasteAnalytics,
  // Inventory functions
  getInventory,
  updateInventory,
  subscribeToInventory
};

export default FirebaseService;
