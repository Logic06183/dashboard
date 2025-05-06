import { useState, useEffect } from 'react';
import { subscribeToOrders, subscribeToOrder } from '../services/FirebaseService';

/**
 * Custom hook for subscribing to real-time order updates from Firebase
 * @param {Object} options - Configuration options
 * @param {boolean} options.singleOrder - Whether to subscribe to a single order (true) or all orders (false)
 * @param {string} options.orderId - The ID of the order to subscribe to (required if singleOrder is true)
 * @returns {Object} The real-time order data and loading state
 */
const useFirebaseOrders = (options = {}) => {
  const { singleOrder = false, orderId = null } = options;
  const [data, setData] = useState(singleOrder ? null : []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    let unsubscribe;

    try {
      if (singleOrder && orderId) {
        // Subscribe to a single order
        unsubscribe = subscribeToOrder(orderId, (orderData) => {
          setData(orderData);
          setLoading(false);
        });
      } else {
        // Subscribe to all orders
        unsubscribe = subscribeToOrders((orders) => {
          setData(orders);
          setLoading(false);
        });
      }
    } catch (err) {
      console.error('Error setting up Firebase subscription:', err);
      setError(err);
      setLoading(false);
    }

    // Cleanup function to unsubscribe when component unmounts
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [singleOrder, orderId]);

  return { data, loading, error };
};

export default useFirebaseOrders;
