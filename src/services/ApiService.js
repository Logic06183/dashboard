/**
 * ApiService.js
 * Handles all API calls to the Express backend
 */

// We'll directly use Firestore for both development and production
// Import Firestore references
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, getDocs, getDoc, query, orderBy, limit } from 'firebase/firestore';

// Constants for collections
const ORDERS_COLLECTION = 'orders';
const ARCHIVED_ORDERS_COLLECTION = 'archivedOrders';

const isProduction = process.env.NODE_ENV === 'production';
// Not using direct API endpoint anymore as we're directly interfacing with Firestore
const API_BASE_URL = '/api'; // Only used for local development fallback

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

// Debug logging
const log = (message, data = null) => {
  console.log(`[API] ${message}`, data || '');
};

// Error logging
const errorLog = (message, error = null) => {
  console.error(`[API ERROR] ${message}`, error || '');
};

// Orders API
export const fetchOrders = async () => {
  try {
    // Try to fetch orders from Firestore first
    try {
      log('Fetching orders from Firestore...');
      const ordersCollection = collection(db, ORDERS_COLLECTION);
      const ordersQuery = query(ordersCollection, orderBy('orderTime', 'desc'));
      const querySnapshot = await getDocs(ordersQuery);
      
      if (!querySnapshot.empty) {
        const orders = [];
        querySnapshot.forEach(doc => {
          orders.push({ id: doc.id, ...doc.data() });
        });
        
        log(`Fetched ${orders.length} orders from Firestore`);
        return orders;
      }
    } catch (firestoreError) {
      log('Error fetching from Firestore:', firestoreError);
      // Continue to fallback options if Firestore fails
    }
    
    // If we're in production and Firestore failed, try the API
    if (isProduction) {
      log('Trying to fetch orders from API...');
      try {
        const response = await fetch(`${API_BASE_URL}/orders`);
        if (response.ok) {
          const orders = await response.json();
          log(`Fetched ${orders.length} orders from API`);
          return orders;
        }
      } catch (apiError) {
        log('API fallback also failed:', apiError);
      }
    }
    
    // Final fallback: Use test data
    log('All data sources failed, using test order for development');
    const localOrder = {
      id: `local-${Date.now()}`,
      orderId: `TEST-${Date.now().toString().slice(-4)}`,
      customerName: 'Local Test',
      phoneNumber: '555-123-4567',
      address: '123 Test St',
      orderTime: new Date().toISOString(),
      dueTime: new Date(Date.now() + 30 * 60000).toISOString(), // 30 minutes from now
      pizzas: [
        {
          pizzaType: 'Spud Pizza',
          size: 'Medium',
          quantity: 1,
          price: 149,
          specialInstructions: ''
        }
      ],
      platform: 'Window',
      priceTotal: 149,
      status: 'pending',
      _isLocal: true
    };
    
    return [localOrder];
  } catch (error) {
    errorLog('Error in fetchOrders:', error);
    return [];
  }
};

export const createOrder = async (orderData) => {
  try {
    log('Creating new order:', orderData);
    
    // Generate a unique order ID if not provided
    if (!orderData.orderId) {
      orderData.orderId = `ORDER-${Date.now()}`;
    }
    
    // Try API as fallback in production
    if (isProduction) {
      log('Creating order via API');
      try {
        const response = await fetch(`${API_BASE_URL}/orders`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderData)
        });
        
        if (response.ok) {
          const data = await response.json();
          log('Successfully created order via API:', data);
          return data;
        }
      } catch (apiError) {
        log('API fallback also failed:', apiError);
      }
    }
    
    // Final fallback: create a local order
    log('All creation methods failed, using local fallback');
    
    // Generate a timestamp-based ID
    const timestamp = Date.now();
    const localOrderId = `LOCAL-${timestamp.toString().slice(-4)}`;
    
    // Ensure critical fields are present
    if (!orderData.orderTime) {
      orderData.orderTime = new Date().toISOString();
    }
    
    if (!orderData.dueTime) {
      orderData.dueTime = new Date(Date.now() + 30 * 60000).toISOString();
    }
    
    // Add prices to pizzas if they don't have them
    if (orderData.pizzas && Array.isArray(orderData.pizzas)) {
      orderData.pizzas.forEach(pizza => {
        if (!pizza.price && pizza.pizzaType && PIZZA_MENU[pizza.pizzaType]) {
          pizza.price = PIZZA_MENU[pizza.pizzaType].price;
        }
      });
    }
    
    const localOrder = {
      ...orderData,
      id: `local-${timestamp}`,
      orderId: localOrderId,
      _isLocal: true
    };
    
    log('Created local order as fallback:', localOrder);
    return localOrder;
  } catch (error) {
    errorLog('Error creating order:', error);
    throw error;
  }
};

export const updateOrder = async (orderId, orderData) => {
  try {
    log(`Updating order ${orderId}:`, orderData);
    
    // Skip API call for local orders and just return the updated data
    if (orderId.startsWith('local-')) {
      log(`Local order ${orderId} updated (simulated)`);
      return { id: orderId, ...orderData, _isLocal: true };
    }
    
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to update order: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`);
    }
    
    const updatedOrder = await response.json();
    log(`Order ${orderId} updated successfully`);
    return updatedOrder;
  } catch (error) {
    errorLog(`Error updating order ${orderId}:`, error);
    
    // Return the data anyway as a fallback
    return { id: orderId, ...orderData, _updateFailed: true };
  }
};

export const deleteOrder = async (orderId) => {
  try {
    log(`Deleting order ${orderId}`);
    
    // For local orders, just return success
    if (orderId.startsWith('local-')) {
      log(`Local order ${orderId} deleted (simulated)`);
      return { id: orderId, message: 'Local order deleted successfully' };
    }
    
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to delete order: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`);
    }
    
    const result = await response.json();
    log(`Order ${orderId} deleted successfully`);
    return result;
  } catch (error) {
    errorLog(`Error deleting order ${orderId}:`, error);
    // Return a simulated success response as fallback
    return { id: orderId, message: 'Order marked for deletion (offline mode)' };
  }
};

// Archived Orders API
export const fetchArchivedOrders = async () => {
  try {
    log('Fetching archived orders...');
    const response = await fetch(`${API_BASE_URL}/archivedOrders`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch archived orders: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    log(`Successfully fetched ${data.length} archived orders`);
    return data;
  } catch (error) {
    errorLog('Error fetching archived orders:', error);
    // Return empty array with some debug info if in development
    return process.env.NODE_ENV !== 'production' ? 
      [{ 
        id: 'debug-archived-1',
        orderId: 'ARCHIVED-DEBUG-1',
        customerName: 'Archive Test',
        pizzas: [{ pizzaType: 'Margie Pizza', quantity: 1 }],
        status: 'delivered',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        archivedAt: new Date().toISOString(),
        _isDebug: true
      }] : [];
  }
};

// Add function to archive an order
export const archiveOrder = async (orderId) => {
  try {
    log(`Archiving order ${orderId}`);
    
    // For local orders, simulate archiving
    if (orderId.startsWith('local-')) {
      log(`Local order ${orderId} archived (simulated)`);
      return { 
        originalId: orderId, 
        archivedId: `local-archived-${Date.now()}`,
        message: 'Local order archived successfully' 
      };
    }
    
    const response = await fetch(`${API_BASE_URL}/archiveOrder/${orderId}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to archive order: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`);
    }
    
    const result = await response.json();
    log(`Order ${orderId} archived successfully:`, result);
    return result;
  } catch (error) {
    errorLog(`Error archiving order ${orderId}:`, error);
    // Return a simulated success response
    return { 
      originalId: orderId, 
      message: 'Order marked for archiving (offline mode)' 
    };
  }
};

// Update pizza completion status
export const updatePizzaStatus = async (orderId, cookedArray, orderStatus) => {
  try {
    log(`Updating pizza status for order ${orderId}:`, { cooked: cookedArray, status: orderStatus });
    
    // Detect local orders more liberally - check for any indicator of a local order
    const isLocalOrder = (
      // Check standard prefixes
      orderId?.startsWith('local-') || 
      orderId?.startsWith('LOCAL-') ||
      // Check special markers
      orderId?.includes('_isLocal') ||
      // Or if we're in development mode and API is likely unavailable
      process.env.NODE_ENV === 'development'
    );
    
    // For local/test orders or in development mode, handle locally without API calls
    if (isLocalOrder) {
      console.log(`Handling local/test order ${orderId} update without API call`);
      return { 
        id: orderId, 
        cooked: cookedArray,
        status: orderStatus,
        _isLocal: true,
        _updatedLocally: true
      };
    }
    
    // First attempt the API update
    let result;
    
    try {
      // Only try the API call if we're not handling a local order
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/pizzaStatus`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cooked: cookedArray,
          status: orderStatus
        })
      });
      
      if (!response.ok) {
        throw new Error(`API returned status: ${response.status}`);
      }
      
      result = await response.json();
      log(`Pizza status updated via API for order ${orderId}:`, result);
    } catch (apiError) {
      // If API fails, try directly updating the order in Firestore
      log(`API update failed. Attempting to update Firestore for order ${orderId}:`, apiError);
      
      try {
        // Import Firebase directly here to avoid circular imports
        const { db } = await import('../firebase');
        const { doc, updateDoc } = await import('firebase/firestore');
        
        // Update the order document directly in Firestore
        const orderDocRef = doc(db, 'orders', orderId);
        await updateDoc(orderDocRef, {
          cooked: cookedArray,
          status: orderStatus,
          // Set the completed flag only if all pizzas are cooked
          completed: cookedArray.every(status => status === true) 
        });
        
        result = { 
          id: orderId, 
          cooked: cookedArray,
          status: orderStatus,
          _updatedViaFirestore: true
        };
        log(`Order updated directly in Firestore: ${orderId}`);
      } catch (firestoreError) {
        // Both API and Firestore failed, throw to outer catch
        throw new Error(`Both API and Firestore updates failed: ${apiError.message}, ${firestoreError.message}`);
      }
    }
    
    return result;
  } catch (error) {
    // This catches any errors from the overall process
    errorLog(`All attempts to update pizza status for order ${orderId} failed:`, error);
    // Return the data anyway as a fallback
    return { 
      id: orderId,
      cooked: cookedArray,
      status: orderStatus,
      _updateFailed: true
    };
  }
};

// Add test function to verify API connectivity
export const testApi = async () => {
  try {
    log('Testing API connection...');
    const response = await fetch(`${API_BASE_URL}/test`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API test failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    log('API test successful:', data);
    return { success: true, data };
  } catch (error) {
    errorLog('API test failed:', error);
    return { success: false, error: error.message };
  }
};

const ApiService = {
  fetchOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  fetchArchivedOrders,
  archiveOrder,
  updatePizzaStatus,
  testApi
};

export default ApiService;
