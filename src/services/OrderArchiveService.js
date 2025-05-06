/**
 * OrderArchiveService.js
 * Service that manages automatic archiving of orders at 2 AM
 * Provides functions to archive, restore, and manage order history
 * Updated to use Firestore instead of localStorage
 */

import { db } from '../firebase';
import { 
  collection, doc, addDoc, setDoc, getDoc, getDocs, 
  query, where, orderBy, Timestamp, deleteDoc 
} from 'firebase/firestore';

// Collection names
const COLLECTIONS = {
  ORDERS: 'orders',
  ARCHIVED_ORDERS: 'archivedOrders',
  SYSTEM_CONFIG: 'systemConfig'
};

// Document ID for system config
const SYSTEM_CONFIG_ID = 'archiveSettings';

/**
 * Check if orders should be archived based on time (2 AM check)
 * @returns {Promise<boolean>} Whether orders should be archived
 */
export const shouldArchiveOrders = async () => {
  // Temporarily disable auto-archiving
  // This will prevent new orders from disappearing
  return false;
  
  /* Original archiving logic - temporarily disabled
  const now = new Date();
  
  try {
    // Get the last archive date from Firestore
    const configRef = doc(db, COLLECTIONS.SYSTEM_CONFIG, SYSTEM_CONFIG_ID);
    const configDoc = await getDoc(configRef);
    
    // If config doesn't exist or no last archive date, check if it's past 2 AM
    if (!configDoc.exists() || !configDoc.data().lastArchiveDate) {
      return now.getHours() >= 2; // Archive if it's 2 AM or later
    }
    
    // Get the date of the last archive
    const lastArchive = configDoc.data().lastArchiveDate.toDate();
  
    // Check if it's a new day and after 2 AM
    return (
      now.getDate() !== lastArchive.getDate() &&
      now.getHours() >= 2
    );
  } catch (error) {
    console.error('Error checking archive date:', error);
    // Default to not archive if there's an error
    return false;
  }
  */
};

/**
 * Archive completed/delivered orders
 * @param {Array} orders - Current active orders
 * @returns {Promise<Object>} Object with archived and remaining orders
 */
export const archiveCompletedOrders = async (orders) => {
  console.log('Archiving has been disabled - returning all orders as active');
  // Completely disabled - do not archive any orders
  return {
    archivedOrders: [], // No orders archived
    remainingOrders: orders // All orders remain active
  };
};

/**
 * Get archived orders from Firestore
 * @returns {Promise<Array>} Archived orders
 */
export const getArchivedOrders = async () => {
  try {
    const q = query(
      collection(db, COLLECTIONS.ARCHIVED_ORDERS),
      orderBy('archivedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Timestamp to Date for compatibility
      archivedAt: doc.data().archivedAt?.toDate?.() || doc.data().archivedAt
    }));
  } catch (error) {
    console.error('Error getting archived orders:', error);
    return [];
  }
};

/**
 * Move an order back from archive to active orders
 * @param {string} orderId ID of the order to restore
 * @returns {Promise<boolean>} Success status
 */
export const restoreOrder = async (orderId) => {
  if (!orderId) return false;
  
  try {
    // Get the order from archived orders
    const archivedRef = doc(db, COLLECTIONS.ARCHIVED_ORDERS, orderId);
    const archivedDoc = await getDoc(archivedRef);
    
    if (!archivedDoc.exists()) return false;
    
    // Get the order and remove archived flag
    const orderToRestore = {
      ...archivedDoc.data(),
      archivedAt: null
    };
    
    // Add to active orders collection
    await addDoc(collection(db, COLLECTIONS.ORDERS), orderToRestore);
    
    // Delete from archived orders collection
    await deleteDoc(archivedRef);
    
    return true;
  } catch (error) {
    console.error('Error restoring order:', error);
    return false;
  }
};

/**
 * Delete an archived order
 * @param {string} orderId ID of the order to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteArchivedOrder = async (orderId) => {
  if (!orderId) return false;
  
  try {
    // Delete from archived orders collection
    await deleteDoc(doc(db, COLLECTIONS.ARCHIVED_ORDERS, orderId));
    
    return true;
  } catch (error) {
    console.error('Error deleting archived order:', error);
    return false;
  }
};

// Create a service object with all the functions
const OrderArchiveService = {
  shouldArchiveOrders,
  archiveCompletedOrders,
  getArchivedOrders,
  restoreOrder,
  deleteArchivedOrder
};

export default OrderArchiveService;
