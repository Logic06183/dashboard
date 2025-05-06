import { useState, useEffect } from 'react';

// Custom hook for localStorage persistence
export function useLocalStorageState(key, initialValue) {
  // Create state with initial value logic
  const [state, setState] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      
      // Parse stored json or return initialValue
      if (item) {
        console.log(`[useLocalStorageState] Loaded ${key} from localStorage:`, item.substring(0, 50) + '...');
        return JSON.parse(item);
      }
      
      // If no value in localStorage, use initialValue and store it
      if (initialValue) {
        window.localStorage.setItem(key, JSON.stringify(initialValue));
      }
      return initialValue;
    } catch (error) {
      // If error, use initialValue
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  // Update localStorage whenever state changes
  useEffect(() => {
    if (state && (Array.isArray(state) ? state.length > 0 : true)) {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
        console.log(`[useLocalStorageState] Saved ${key} to localStorage:`, 
          Array.isArray(state) ? `${state.length} items` : 'object');
      } catch (error) {
        console.error(`Error saving ${key} to localStorage:`, error);
      }
    }
  }, [key, state]);

  return [state, setState];
}

export default useLocalStorageState;
