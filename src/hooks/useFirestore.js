import { useState, useEffect } from 'react';
import { 
  collection, doc, addDoc, setDoc, deleteDoc, 
  onSnapshot, query, orderBy, serverTimestamp, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Hook for working with Firestore collections
 * @param {string} collectionName - Firestore collection name
 * @param {Array|Object} initialValue - Initial value before data loads
 * @returns {[data, addItem, updateItem, removeItem, loading]}
 */
export const useFirestore = (collectionName, initialValue = []) => {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  
  // Subscribe to collection changes
  useEffect(() => {
    console.log(`Setting up Firestore listener for ${collectionName}`);
    let unsubscribe;
    
    try {
      // Create a reference to the collection
      const collectionRef = collection(db, collectionName);
      
      // Listen for real-time updates
      unsubscribe = onSnapshot(collectionRef, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`Received ${items.length} items from ${collectionName}`);
        setData(items);
        setLoading(false);
      }, (error) => {
        console.error(`Firestore subscription error for ${collectionName}:`, error);
        // Fall back to one-time read if real-time updates fail
        getDocs(collectionRef).then(snapshot => {
          const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setData(items);
          setLoading(false);
        }).catch(err => {
          console.error(`Fallback read failed for ${collectionName}:`, err);
          setLoading(false);
        });
      });
    } catch (error) {
      console.error(`Error setting up Firestore for ${collectionName}:`, error);
      setLoading(false);
    }
    
    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        console.log(`Cleaning up Firestore listener for ${collectionName}`);
        unsubscribe();
      }
    };
  }, [collectionName]);
  
  // Add a new item to the collection
  const addItem = async (item) => {
    try {
      console.log(`Adding item to ${collectionName}:`, item);
      // Add timestamp to the item (but don't override existing timestamp)
      const itemWithTimestamp = {
        ...item,
        timestamp: item.timestamp || new Date().toISOString()
      };
      
      // Add document to Firestore
      const docRef = await addDoc(collection(db, collectionName), itemWithTimestamp);
      console.log(`Added document with ID: ${docRef.id} to ${collectionName}`);
      
      // The onSnapshot listener will automatically update the data state
      return docRef.id;
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      // Add to local state as fallback if Firestore fails
      setData(prev => [
        {
          ...item,
          id: `local-${Date.now()}`,
          timestamp: new Date().toISOString(),
          _isLocal: true
        },
        ...prev
      ]);
      return null;
    }
  };
  
  // Update an existing item
  const updateItem = async (itemId, updatedFields) => {
    try {
      console.log(`Updating item ${itemId} in ${collectionName}:`, updatedFields);
      const docRef = doc(db, collectionName, itemId);
      await setDoc(docRef, updatedFields, { merge: true });
      console.log(`Updated document ${itemId} in ${collectionName}`);
      
      // The onSnapshot listener will automatically update the data state
    } catch (error) {
      console.error(`Error updating document ${itemId} in ${collectionName}:`, error);
      // Update local state as fallback
      setData(prev => prev.map(item => 
        item.id === itemId ? { ...item, ...updatedFields } : item
      ));
    }
  };
  
  // Remove an item
  const removeItem = async (itemId) => {
    try {
      console.log(`Removing item ${itemId} from ${collectionName}`);
      await deleteDoc(doc(db, collectionName, itemId));
      console.log(`Removed document ${itemId} from ${collectionName}`);
      
      // The onSnapshot listener will automatically update the data state
    } catch (error) {
      console.error(`Error removing document ${itemId} from ${collectionName}:`, error);
      // Update local state as fallback
      setData(prev => prev.filter(item => item.id !== itemId));
    }
  };
  
  return [data, addItem, updateItem, removeItem, loading];
};

export default useFirestore;
