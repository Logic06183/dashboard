/**
 * useQueueCalculator Hook
 * React hook for accessing pizza queue calculator data and functionality
 */

import { useState, useEffect, useCallback } from 'react';
import queueCalculator from '../services/pizzaQueueCalculator';

const useQueueCalculator = () => {
  const [queueData, setQueueData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize calculator and set up subscription
  useEffect(() => {
    let mounted = true;

    const initializeCalculator = async () => {
      try {
        // Initialize the calculator (sets up Firebase subscription)
        queueCalculator.initialize();
        
        // Subscribe to queue updates
        const unsubscribe = queueCalculator.subscribe((data) => {
          if (mounted) {
            setQueueData(data);
            setIsLoading(false);
            setError(null);
          }
        });

        return unsubscribe;
      } catch (err) {
        if (mounted) {
          setError(err);
          setIsLoading(false);
        }
        return () => {};
      }
    };

    const unsubscribePromise = initializeCalculator();

    // Cleanup function
    return () => {
      mounted = false;
      unsubscribePromise.then(unsubscribe => unsubscribe());
    };
  }, []);

  // Get prep time estimate for a specific order
  const getOrderEstimate = useCallback((orderId) => {
    try {
      return queueCalculator.getOrderEstimate(orderId);
    } catch (err) {
      console.error('Error getting order estimate:', err);
      return null;
    }
  }, []);

  // Calculate estimated prep time for a new order with X pizzas
  const calculateEstimatedPrepTime = useCallback((additionalPizzas = 0) => {
    try {
      return queueCalculator.calculateEstimatedPrepTime(additionalPizzas);
    } catch (err) {
      console.error('Error calculating prep time:', err);
      return 0;
    }
  }, []);

  // Update kitchen settings
  const updateSettings = useCallback(async (newSettings) => {
    try {
      queueCalculator.updateSettings(newSettings);
      return true;
    } catch (err) {
      setError(err);
      return false;
    }
  }, []);

  // Get available presets
  const getPresets = useCallback(() => {
    try {
      return queueCalculator.getPresets();
    } catch (err) {
      console.error('Error getting presets:', err);
      return {};
    }
  }, []);

  // Apply a preset configuration
  const applyPreset = useCallback(async (presetName) => {
    try {
      const presets = queueCalculator.getPresets();
      const preset = presets[presetName];
      if (!preset) {
        throw new Error(`Preset '${presetName}' not found`);
      }
      
      const presetSettings = {
        basePrepTimePerPizza: preset.basePrepTimePerPizza,
        pizzaCapacity: preset.pizzaCapacity,
        fridayRushMode: preset.fridayRushMode
      };

      queueCalculator.updateSettings(presetSettings);
      return true;
    } catch (err) {
      setError(err);
      return false;
    }
  }, []);

  // Get current queue statistics
  const getQueueStats = useCallback(() => {
    if (!queueData) return null;
    
    return {
      totalPizzasInQueue: queueData.totalPizzasInQueue,
      activeOrdersCount: queueData.activeOrdersCount,
      estimatedWaitTime: queueData.estimatedWaitTime,
      isRushMode: queueData.settings?.fridayRushMode || false,
      capacity: queueData.settings?.pizzaCapacity || 3,
      basePrepTime: queueData.settings?.basePrepTimePerPizza || 10
    };
  }, [queueData]);

  // Check if queue is busy (exceeding alert threshold)
  const isQueueBusy = useCallback(() => {
    if (!queueData) return false;
    
    const threshold = queueData.settings?.alertThreshold || 60;
    return queueData.estimatedWaitTime > threshold;
  }, [queueData]);

  // Format time display (for South African localization)
  const formatTimeEstimate = useCallback((minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
  }, []);

  return {
    // Data
    queueData,
    isLoading,
    error,
    
    // Functions
    getOrderEstimate,
    calculateEstimatedPrepTime,
    updateSettings,
    getPresets,
    applyPreset,
    getQueueStats,
    isQueueBusy,
    formatTimeEstimate,
    
    // Computed values for convenience
    totalPizzasInQueue: queueData?.totalPizzasInQueue || 0,
    activeOrdersCount: queueData?.activeOrdersCount || 0,
    estimatedWaitTime: queueData?.estimatedWaitTime || 0,
    settings: queueData?.settings || {},
    isRushMode: queueData?.settings?.fridayRushMode || false
  };
};

export default useQueueCalculator;