/**
 * Utility functions for interacting with localStorage
 */

const ORDERS_KEY = 'pizza-dashboard-orders';
const COOKED_STATE_KEY = 'pizzaCooked';

/**
 * Save orders to localStorage
 * @param {Array} orders - The orders to save
 */
export const saveOrders = (orders) => {
  if (!orders || !Array.isArray(orders)) return;
  
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    console.log(`[localStorage] Saved ${orders.length} orders`);
  } catch (error) {
    console.error('[localStorage] Error saving orders:', error);
  }
};

/**
 * Load orders from localStorage
 * @returns {Array} - The loaded orders or empty array
 */
export const loadOrders = () => {
  try {
    const savedOrders = localStorage.getItem(ORDERS_KEY);
    if (!savedOrders) return [];
    
    const parsedOrders = JSON.parse(savedOrders);
    console.log(`[localStorage] Loaded ${parsedOrders.length} orders`);
    return parsedOrders;
  } catch (error) {
    console.error('[localStorage] Error loading orders:', error);
    return [];
  }
};

/**
 * Save cooked pizza state to localStorage
 * @param {string} orderId - The order ID
 * @param {Array} cookedArray - The array of cooked states
 * @param {string} status - The order status
 */
export const savePizzaState = (orderId, cookedArray, status) => {
  if (!orderId) return;
  
  try {
    const savedStates = localStorage.getItem(COOKED_STATE_KEY) || '{}';
    const parsedStates = JSON.parse(savedStates);
    
    parsedStates[orderId] = {
      cooked: cookedArray,
      status,
      timestamp: Date.now()
    };
    
    localStorage.setItem(COOKED_STATE_KEY, JSON.stringify(parsedStates));
    console.log(`[localStorage] Saved pizza state for order ${orderId}`);
    
    // Also update the order in the orders storage
    updateOrderInStorage(orderId, { 
      status, 
      cooked: cookedArray
    });
  } catch (error) {
    console.error('[localStorage] Error saving pizza state:', error);
  }
};

/**
 * Update a specific order in localStorage
 * @param {string} orderId - The order ID
 * @param {Object} updates - The updates to apply
 */
export const updateOrderInStorage = (orderId, updates) => {
  if (!orderId || !updates) return;
  
  try {
    const orders = loadOrders();
    const updatedOrders = orders.map(order => {
      if (order.id === orderId || order.orderId === orderId) {
        return { ...order, ...updates };
      }
      return order;
    });
    
    saveOrders(updatedOrders);
  } catch (error) {
    console.error('[localStorage] Error updating order:', error);
  }
};

/**
 * Clear all localStorage data
 */
export const clearStorage = () => {
  try {
    localStorage.removeItem(ORDERS_KEY);
    localStorage.removeItem(COOKED_STATE_KEY);
    console.log('[localStorage] All data cleared');
  } catch (error) {
    console.error('[localStorage] Error clearing storage:', error);
  }
};

/**
 * Initialize storage with sample data if empty
 * @param {Array} sampleData - Sample data to use
 */
export const initializeStorage = (sampleData) => {
  if (!sampleData || !Array.isArray(sampleData)) return;
  
  try {
    const existingOrders = loadOrders();
    if (existingOrders.length === 0) {
      saveOrders(sampleData);
      console.log('[localStorage] Initialized storage with sample data');
    }
  } catch (error) {
    console.error('[localStorage] Error initializing storage:', error);
  }
};

export default {
  saveOrders,
  loadOrders,
  savePizzaState,
  updateOrderInStorage,
  clearStorage,
  initializeStorage
};
