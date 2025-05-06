import { useState, useEffect } from 'react';
import { 
  fetchOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  fetchArchivedOrders
} from '../services/ApiService';

/**
 * Hook for working with API backend - serves as a drop-in replacement for useFirestore
 * with the same interface but using the Express backend
 * @param {string} collectionName - Collection name ('orders' or 'archivedOrders')
 * @param {Array} initialValue - Initial value before data loads
 * @returns {[data, addItem, updateItem, removeItem, loading]} - Same interface as useFirestore
 */
export const useApi = (collectionName, initialValue = []) => {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  
  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        console.log(`Loading data from ${collectionName} API endpoint`);
        
        // Call the appropriate API endpoint based on collection name
        let items = [];
        if (collectionName === 'orders') {
          items = await fetchOrders();
        } else if (collectionName === 'archivedOrders') {
          items = await fetchArchivedOrders();
        } else {
          console.warn(`Unknown collection: ${collectionName}`);
        }
        
        console.log(`Received ${items.length} items from ${collectionName}`);
        setData(items);
      } catch (error) {
        console.error(`Error fetching ${collectionName}:`, error);
      } finally {
        setLoading(false);
      }
    };
    
    // Load data initially
    loadData();
    
    // DISABLE ALL POLLING - prevents auto-refresh from overwriting local changes
    console.log(`Auto-refresh has been DISABLED for ${collectionName} to preserve local changes`); 
    
    // No polling interval - we want full manual control
    return () => {}; // Empty cleanup function since we're not setting up anything to clean up
  }, [collectionName]);
  
  // Add a new item
  const addItem = async (item) => {
    if (collectionName !== 'orders') {
      console.warn(`Adding items to ${collectionName} is not supported`);
      return null;
    }
    
    try {
      console.log(`Adding item to ${collectionName}:`, item);
      const result = await createOrder(item);
      
      if (result) {
        // Update local state for immediate feedback
        setData(prev => [result, ...prev]);
      }
      
      return result?.id;
    } catch (error) {
      console.error(`Error adding item to ${collectionName}:`, error);
      return null;
    }
  };
  
  // Update an existing item
  const updateItem = async (itemId, updatedFields) => {
    if (collectionName !== 'orders') {
      console.warn(`Updating items in ${collectionName} is not supported`);
      return;
    }
    
    try {
      console.log(`Updating item ${itemId} in ${collectionName}:`, updatedFields);
      
      // Find the existing item to merge with updated fields
      const existingItem = data.find(item => item.id === itemId);
      if (!existingItem) {
        console.warn(`Item ${itemId} not found in ${collectionName}`);
        return;
      }
      
      const mergedItem = { ...existingItem, ...updatedFields };
      await updateOrder(itemId, mergedItem);
      
      // Update local state for immediate feedback
      setData(prev => prev.map(item => 
        item.id === itemId ? { ...item, ...updatedFields } : item
      ));
    } catch (error) {
      console.error(`Error updating item ${itemId} in ${collectionName}:`, error);
    }
  };
  
  // Remove an item
  const removeItem = async (itemId) => {
    if (collectionName !== 'orders') {
      console.warn(`Removing items from ${collectionName} is not supported`);
      return;
    }
    
    try {
      console.log(`Removing item ${itemId} from ${collectionName}`);
      await deleteOrder(itemId);
      
      // Update local state for immediate feedback
      setData(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error(`Error removing item ${itemId} from ${collectionName}:`, error);
    }
  };
  
  // Reset data (clear all items)
  const resetData = () => {
    console.log(`Resetting all data for ${collectionName}`);
    setData([]);
  };
  
  return [data, addItem, updateItem, removeItem, loading, resetData];
};

export default useApi;
