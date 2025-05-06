/**
 * ApiService.js
 * Wrapper for FirebaseService to maintain backward compatibility
 * DEPRECATED: Use FirebaseService directly for new code
 */

// Import all Firebase functionality from our new service
import FirebaseService, {
  createOrder as fbCreateOrder,
  getOrders,
  getOrderById,
  updateOrder as fbUpdateOrder,
  updatePizzaStatus as fbUpdatePizzaStatus,
  deleteOrder as fbDeleteOrder,
  archiveOrder as fbArchiveOrder,
  getArchivedOrders,
  subscribeToOrders as fbSubscribeToOrders,
  subscribeToOrder as fbSubscribeToOrder,
  ORDERS_COLLECTION,
  ARCHIVED_ORDERS_COLLECTION
} from './FirebaseService';

// Copied from OrderManagement.js for fallback logic
const PIZZA_MENU = {
  'The Champ Pizza': { price: 179 },
  'Pig in Paradise': { price: 169 },
  'Margie Pizza': { price: 149 },
  'Mushroom Cloud Pizza': { price: 174 },
  'Spud Pizza': { price: 149 },
  'Mish-Mash Pizza': { price: 192 },
  'Lekker\'izza': { price: 194 },
  'Sunshine Margherita': { price: 149 },
  'Vegan Harvest Pizza': { price: 189 },
  'Poppa\'s Pizza': { price: 179 },
  'The Zesty Zucchini': { price: 149 },
  'Chick Tick Boom': { price: 172 },
  'Artichoke & Ham': { price: 172 },
  'Jane\'s Dough': { price: 109 }
};

// Logging functions for backwards compatibility
const log = (message, data = null) => {
  console.log(`[API-DEPRECATED] ${message}`, data || '');
  console.log('Consider migrating to FirebaseService directly');
};

const errorLog = (message, error = null) => {
  console.error(`[API ERROR-DEPRECATED] ${message}`, error || '');
  console.error('Consider migrating to FirebaseService directly');
};

// Orders API - Wrapper for FirebaseService
export const fetchOrders = async () => {
  try {
    log('Fetching orders via FirebaseService');
    // Use the FirebaseService directly now
    return await getOrders();
  } catch (error) {
    errorLog('Error in fetchOrders:', error);
    return [];
  }
};

export const createOrder = async (orderData) => {
  try {
    log('Creating new order via FirebaseService');
    return await fbCreateOrder(orderData);
  } catch (error) {
    errorLog('Error creating order:', error);
    throw error;
  }
};

export const updateOrder = async (orderId, orderData) => {
  try {
    log(`Updating order ${orderId} via FirebaseService`);
    return await fbUpdateOrder(orderId, orderData);
  } catch (error) {
    errorLog(`Error updating order ${orderId}:`, error);
    throw error;
  }
};

export const deleteOrder = async (orderId) => {
  try {
    log(`Deleting order ${orderId} via FirebaseService`);
    await fbDeleteOrder(orderId);
    return { success: true, id: orderId, message: 'Order deleted successfully' };
  } catch (error) {
    errorLog(`Error deleting order ${orderId}:`, error);
    throw error;
  }
};

// Archived Orders API
export const fetchArchivedOrders = async () => {
  try {
    log('Fetching archived orders via FirebaseService');
    return await FirebaseService.getArchivedOrders();
  } catch (error) {
    errorLog('Error fetching archived orders:', error);
    return [];
  }
};

// Add function to archive an order
export const archiveOrder = async (orderId) => {
  try {
    log(`Archiving order ${orderId} via FirebaseService`);
    return await fbArchiveOrder(orderId);
  } catch (error) {
    errorLog(`Error archiving order ${orderId}:`, error);
    throw error;
  }
};

// Update pizza completion status - now using FirebaseService for all operations
export const updatePizzaStatus = async (orderId, pizzaIndex, isCooked) => {
  try {
    log(`Updating pizza ${pizzaIndex} in order ${orderId} via FirebaseService`);
    return await fbUpdatePizzaStatus(orderId, pizzaIndex, isCooked);
  } catch (error) {
    errorLog(`Error updating pizza status:`, error);
    throw error;
  }
};

// For backwards compatibility with code expecting the old signature
export const updateAllPizzaStatuses = async (orderId, cookedArray, orderStatus) => {
  try {
    log(`Updating all pizzas for order ${orderId} via FirebaseService`);
    
    // Get the current order
    const order = await getOrderById(orderId);
    if (!order) throw new Error(`Order ${orderId} not found`);
    
    // Update the order with the new cooked array and status
    return await fbUpdateOrder(orderId, {
      cooked: cookedArray,
      status: orderStatus
    });
  } catch (error) {
    errorLog(`Error updating all pizza statuses:`, error);
    throw error;
  }
};

// Add test function to verify Firestore connectivity
export const testFirestore = async () => {
  try {
    log('Testing Firestore connection');
    // Just try to get orders - if it works, Firestore is connected
    await FirebaseService.getOrders();
    return { success: true, message: 'Firestore connection successful' };
  } catch (error) {
    errorLog('Firestore test failed:', error);
    return { success: false, error: error.message };
  }
};

// Add order subscription function for real-time updates
export const subscribeToOrders = (callback) => {
  log('Setting up real-time order subscription');
  return fbSubscribeToOrders(callback);
};

// Export a single order subscription for component-level listening
export const subscribeToOrder = (orderId, callback) => {
  log(`Setting up real-time subscription for order ${orderId}`);
  return fbSubscribeToOrder(orderId, callback);
};

// Create the export object with all the functions
const ApiService = {
  fetchOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  fetchArchivedOrders,
  archiveOrder,
  updatePizzaStatus,
  updateAllPizzaStatuses,
  testFirestore,
  subscribeToOrders,
  subscribeToOrder
};

export default ApiService;
