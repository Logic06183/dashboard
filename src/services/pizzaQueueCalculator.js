/**
 * Pizza Queue Calculator Service
 * Calculates dynamic prep times based on current kitchen workload
 */

import FirebaseService from './FirebaseService';

class PizzaQueueCalculator {
  constructor() {
    this.orders = [];
    this.settings = this.getDefaultSettings();
    this.subscribers = new Set();
    this.unsubscribeFromOrders = null;
    this.initialized = false;
    this.historicalData = this.loadHistoricalData();
    this.orderEstimates = new Map(); // Track estimates for window orders
    this.delayThreshold = 15; // Minutes - notify if estimate changes by this much
  }

  getDefaultSettings() {
    return {
      basePrepTimePerPizza: 10, // minutes
      pizzaCapacity: 3, // simultaneous pizzas
      fridayRushMode: false, // 1.5x multiplier
      rushMultiplier: 1.5,
      predictiveEnabled: true, // Use historical data for predictions
      rushHourMultiplier: 1.3 // Additional multiplier for known rush periods
    };
  }

  /**
   * Load historical order pattern data
   */
  loadHistoricalData() {
    try {
      const saved = localStorage.getItem('kitchenHistoricalData');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('[QUEUE CALCULATOR] Error loading historical data:', error);
    }
    
    // Default historical patterns based on typical pizzeria data
    return {
      hourlyPatterns: {
        // Format: { hour: { avgOrders: number, avgPizzas: number, rushPeriod: boolean } }
        17: { avgOrders: 15, avgPizzas: 25, rushPeriod: true }, // 5-6pm
        18: { avgOrders: 20, avgPizzas: 35, rushPeriod: true }, // 6-7pm
        19: { avgOrders: 18, avgPizzas: 30, rushPeriod: true }, // 7-8pm
        20: { avgOrders: 12, avgPizzas: 20, rushPeriod: false }, // 8-9pm
        21: { avgOrders: 8, avgPizzas: 15, rushPeriod: false }   // 9-10pm
      },
      fridayMultiplier: 1.4, // Fridays are 40% busier
      weekendMultiplier: 1.2, // Weekends are 20% busier
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Save historical data to localStorage
   */
  saveHistoricalData() {
    try {
      localStorage.setItem('kitchenHistoricalData', JSON.stringify(this.historicalData));
    } catch (error) {
      console.error('[QUEUE CALCULATOR] Error saving historical data:', error);
    }
  }

  /**
   * Get current time slot info (hour of day)
   */
  getCurrentTimeSlot() {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday
    const isFriday = dayOfWeek === 5;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    return {
      hour,
      isFriday,
      isWeekend,
      isRushPeriod: this.historicalData.hourlyPatterns[hour]?.rushPeriod || false
    };
  }

  /**
   * Predict expected orders in the next hour based on historical data
   */
  predictNextHourOrders() {
    const timeSlot = this.getCurrentTimeSlot();
    const hourPattern = this.historicalData.hourlyPatterns[timeSlot.hour];
    
    if (!hourPattern) {
      return { expectedOrders: 0, expectedPizzas: 0, confidence: 'low' };
    }
    
    let expectedOrders = hourPattern.avgOrders;
    let expectedPizzas = hourPattern.avgPizzas;
    
    // Apply day-of-week multipliers
    if (timeSlot.isFriday) {
      expectedOrders *= this.historicalData.fridayMultiplier;
      expectedPizzas *= this.historicalData.fridayMultiplier;
    } else if (timeSlot.isWeekend) {
      expectedOrders *= this.historicalData.weekendMultiplier;
      expectedPizzas *= this.historicalData.weekendMultiplier;
    }
    
    return {
      expectedOrders: Math.round(expectedOrders),
      expectedPizzas: Math.round(expectedPizzas),
      confidence: hourPattern ? 'high' : 'low',
      timeSlot: timeSlot.hour,
      isRushPeriod: timeSlot.isRushPeriod
    };
  }

  /**
   * Check if an item is a doughball (should not count towards pizza queue)
   * @param {string} itemType - The pizza/item type name
   * @returns {boolean} Whether the item is a doughball
   */
  isDoughball(itemType) {
    if (!itemType) return false;
    const lowerType = itemType.toLowerCase();
    return lowerType.includes('doughball') || 
           lowerType.includes('dough ball') ||
           lowerType === 'garlic doughballs' ||
           lowerType === 'garlic bread balls';
  }

  /**
   * Initialize the calculator with real-time order subscription
   */
  initialize() {
    if (this.initialized) return;

    console.log('[QUEUE CALCULATOR] Initializing...');
    
    // Load settings from localStorage
    this.loadSettings();
    
    // Subscribe to real-time order updates
    this.unsubscribeFromOrders = FirebaseService.subscribeToOrders((orders) => {
      this.orders = orders || [];
      console.log('[QUEUE CALCULATOR] Orders updated, recalculating queue...');
      this.notifySubscribers();
    });

    this.initialized = true;
    console.log('[QUEUE CALCULATOR] Initialized successfully');
  }

  /**
   * Clean up subscriptions
   */
  destroy() {
    if (this.unsubscribeFromOrders) {
      this.unsubscribeFromOrders();
      this.unsubscribeFromOrders = null;
    }
    this.subscribers.clear();
    this.initialized = false;
    console.log('[QUEUE CALCULATOR] Destroyed');
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('kitchenQueueSettings');
      if (savedSettings) {
        this.settings = { ...this.getDefaultSettings(), ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error('[QUEUE CALCULATOR] Error loading settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem('kitchenQueueSettings', JSON.stringify(this.settings));
    this.notifySubscribers();
    console.log('[QUEUE CALCULATOR] Settings saved:', this.settings);
  }

  /**
   * Get current settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Count total pizzas in active orders (pending + in-progress)
   */
  getTotalPizzasInQueue() {
    const activeOrders = this.orders.filter(order => 
      order.status !== 'completed' && 
      order.status !== 'delivered' && 
      order.status !== 'ready'
    );

    let totalPizzas = 0;
    activeOrders.forEach(order => {
      if (order.pizzas && Array.isArray(order.pizzas)) {
        order.pizzas.forEach((pizza, index) => {
          // Only count pizzas that haven't been cooked yet and exclude doughballs
          if ((!order.cooked || !order.cooked[index]) && 
              !this.isDoughball(pizza.pizzaType || pizza.type)) {
            totalPizzas += pizza.quantity || 1;
          }
        });
      }
    });

    return totalPizzas;
  }

  /**
   * Get number of active orders
   */
  getActiveOrdersCount() {
    return this.orders.filter(order => 
      order.status !== 'completed' && 
      order.status !== 'delivered' && 
      order.status !== 'ready'
    ).length;
  }

  /**
   * Calculate estimated prep time with predictive analysis
   */
  calculateEstimatedPrepTime(additionalPizzas = 0) {
    const totalPizzasInQueue = this.getTotalPizzasInQueue() + additionalPizzas;
    
    if (totalPizzasInQueue === 0) {
      return this.settings.basePrepTimePerPizza;
    }

    // Get predictive data if enabled
    let predictedPizzas = 0;
    if (this.settings.predictiveEnabled) {
      const prediction = this.predictNextHourOrders();
      // Add a portion of predicted pizzas based on confidence
      const confidenceMultiplier = prediction.confidence === 'high' ? 0.3 : 0.1;
      predictedPizzas = Math.round(prediction.expectedPizzas * confidenceMultiplier);
    }

    const totalEstimatedPizzas = totalPizzasInQueue + predictedPizzas;
    
    // Calculate number of batches needed
    const batches = Math.ceil(totalEstimatedPizzas / this.settings.pizzaCapacity);
    
    // Base time calculation
    let estimatedTime = batches * this.settings.basePrepTimePerPizza;
    
    // Apply rush period multiplier
    const timeSlot = this.getCurrentTimeSlot();
    if (timeSlot.isRushPeriod && this.settings.predictiveEnabled) {
      estimatedTime *= this.settings.rushHourMultiplier;
    }
    
    // Apply Friday rush mode multiplier if enabled
    if (this.settings.fridayRushMode) {
      estimatedTime *= this.settings.rushMultiplier;
    }

    return Math.round(estimatedTime);
  }

  /**
   * Calculate window customer estimate with detailed breakdown
   */
  calculateWindowCustomerEstimate(orderPizzas = 1) {
    const currentQueue = this.getTotalPizzasInQueue();
    const prediction = this.predictNextHourOrders();
    const timeSlot = this.getCurrentTimeSlot();
    
    // Base calculation without predictions
    const baseEstimate = this.calculateEstimatedPrepTime(orderPizzas);
    
    // Enhanced calculation with predictions
    const predictiveEstimate = this.calculateEstimatedPrepTime(orderPizzas);
    
    return {
      baseEstimate,
      predictiveEstimate,
      currentQueue,
      expectedIncomingPizzas: prediction.expectedPizzas,
      isRushPeriod: timeSlot.isRushPeriod,
      isFridayRush: timeSlot.isFriday && this.settings.fridayRushMode,
      confidence: prediction.confidence,
      breakdown: {
        currentPizzasAhead: currentQueue,
        yourPizzas: orderPizzas,
        predictedIncoming: prediction.expectedPizzas,
        timeSlot: `${timeSlot.hour}:00-${timeSlot.hour + 1}:00`
      }
    };
  }

  /**
   * Track window order estimate and detect significant changes
   */
  trackWindowOrderEstimate(orderId, customerName, estimatedTime) {
    const now = new Date();
    const orderData = {
      orderId,
      customerName,
      platform: 'Window',
      originalEstimate: estimatedTime,
      currentEstimate: estimatedTime,
      orderTime: now.toISOString(),
      estimatedReadyTime: new Date(now.getTime() + estimatedTime * 60000).toISOString(),
      notificationsSent: []
    };
    
    this.orderEstimates.set(orderId, orderData);
    console.log(`[QUEUE CALCULATOR] Tracking window order ${orderId} - Est: ${estimatedTime}min`);
  }

  /**
   * Check for significant time estimate changes and return notification data
   */
  checkForDelayedOrders() {
    const delayedOrders = [];
    
    this.orderEstimates.forEach((orderData, orderId) => {
      // Skip if order is no longer active
      const currentOrder = this.orders.find(o => o.id === orderId || o.orderId === orderId);
      if (!currentOrder || currentOrder.status === 'completed' || currentOrder.status === 'delivered') {
        this.orderEstimates.delete(orderId);
        return;
      }
      
      // Calculate current estimate for this order
      const currentEstimate = this.getOrderEstimate(orderId);
      if (!currentEstimate) return;
      
      const timeDifference = currentEstimate.estimatedPrepTime - orderData.originalEstimate;
      
      // Check if delay is significant and hasn't been notified yet
      if (timeDifference >= this.delayThreshold) {
        const delayMinutes = Math.round(timeDifference);
        const notificationKey = `delay_${delayMinutes}`;
        
        if (!orderData.notificationsSent.includes(notificationKey)) {
          delayedOrders.push({
            orderId,
            customerName: orderData.customerName,
            originalEstimate: orderData.originalEstimate,
            newEstimate: currentEstimate.estimatedPrepTime,
            delayMinutes,
            orderTime: orderData.orderTime,
            reason: this.getDelayReason()
          });
          
          // Mark this delay level as notified
          orderData.notificationsSent.push(notificationKey);
          orderData.currentEstimate = currentEstimate.estimatedPrepTime;
        }
      }
    });
    
    return delayedOrders;
  }

  /**
   * Get likely reason for current delays
   */
  getDelayReason() {
    const prediction = this.predictNextHourOrders();
    const timeSlot = this.getCurrentTimeSlot();
    
    if (timeSlot.isRushPeriod) {
      return `Rush period (${timeSlot.hour}:00-${timeSlot.hour + 1}:00) - higher than normal order volume`;
    }
    
    if (timeSlot.isFriday && this.settings.fridayRushMode) {
      return 'Friday rush mode - increased order volume';
    }
    
    const queueSize = this.getTotalPizzasInQueue();
    if (queueSize > this.settings.pizzaCapacity * 3) {
      return 'High order volume - kitchen at capacity';
    }
    
    return 'Unexpected order volume increase';
  }

  /**
   * Get queue overview data with enhanced rush period info
   */
  getQueueOverview() {
    const totalPizzasInQueue = this.getTotalPizzasInQueue();
    const activeOrdersCount = this.getActiveOrdersCount();
    const estimatedWaitTime = this.calculateEstimatedPrepTime();
    const prediction = this.predictNextHourOrders();
    const timeSlot = this.getCurrentTimeSlot();
    const delayedOrders = this.checkForDelayedOrders();

    return {
      totalPizzasInQueue,
      activeOrdersCount,
      estimatedWaitTime,
      settings: this.getSettings(),
      lastUpdated: new Date().toISOString(),
      // Enhanced rush period data
      rushInfo: {
        isRushPeriod: timeSlot.isRushPeriod,
        isFridayRush: timeSlot.isFriday && this.settings.fridayRushMode,
        timeSlot: `${timeSlot.hour}:00-${timeSlot.hour + 1}:00`,
        expectedOrders: prediction.expectedOrders,
        expectedPizzas: prediction.expectedPizzas,
        confidence: prediction.confidence
      },
      // Delay notifications
      delayedOrders,
      windowOrdersTracked: this.orderEstimates.size
    };
  }

  /**
   * Get prep time estimate for a specific order
   */
  getOrderEstimate(orderId) {
    const order = this.orders.find(o => o.id === orderId || o.orderId === orderId);
    if (!order) return null;

    // Count pizzas ahead of this order
    const orderTime = new Date(order.orderTime || order.createdAt);
    let pizzasAhead = 0;

    // Count uncoked pizzas from orders placed before this one
    this.orders.forEach(otherOrder => {
      const otherOrderTime = new Date(otherOrder.orderTime || otherOrder.createdAt);
      
      // Only consider orders placed before this one that are still active
      if (otherOrderTime < orderTime && 
          otherOrder.status !== 'completed' && 
          otherOrder.status !== 'delivered' && 
          otherOrder.status !== 'ready') {
        
        if (otherOrder.pizzas && Array.isArray(otherOrder.pizzas)) {
          otherOrder.pizzas.forEach((pizza, index) => {
            if (!otherOrder.cooked || !otherOrder.cooked[index]) {
              pizzasAhead += pizza.quantity || 1;
            }
          });
        }
      }
    });

    const estimatedPrepTime = this.calculateEstimatedPrepTime(0); // Don't add additional pizzas for existing orders
    
    return {
      orderId,
      estimatedPrepTime,
      pizzasAhead,
      position: this.orders.filter(o => 
        new Date(o.orderTime || o.createdAt) <= orderTime &&
        o.status !== 'completed' && 
        o.status !== 'delivered' && 
        o.status !== 'ready'
      ).length
    };
  }

  /**
   * Subscribe to queue updates
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    
    // If already initialized, immediately call with current data
    if (this.initialized) {
      callback(this.getQueueOverview());
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers of updates
   */
  notifySubscribers() {
    const queueData = this.getQueueOverview();
    this.subscribers.forEach(callback => {
      try {
        callback(queueData);
      } catch (error) {
        console.error('[QUEUE CALCULATOR] Error in subscriber callback:', error);
      }
    });
  }

  /**
   * Update kitchen settings
   */
  updateSettings(newSettings) {
    this.saveSettings(newSettings);
  }

  /**
   * Get preset configurations for different staffing levels
   */
  getPresets() {
    return {
      minimal: {
        name: 'Minimal Staff (1 cook)',
        basePrepTimePerPizza: 15,
        pizzaCapacity: 2,
        fridayRushMode: false
      },
      normal: {
        name: 'Normal Staff (2 cooks)',
        basePrepTimePerPizza: 10,
        pizzaCapacity: 3,
        fridayRushMode: false
      },
      busy: {
        name: 'Busy Period (3+ cooks)',
        basePrepTimePerPizza: 8,
        pizzaCapacity: 5,
        fridayRushMode: false
      },
      rush: {
        name: 'Friday Rush (3+ cooks)',
        basePrepTimePerPizza: 10,
        pizzaCapacity: 3,
        fridayRushMode: true
      }
    };
  }
}

// Create singleton instance
const queueCalculator = new PizzaQueueCalculator();

export default queueCalculator;