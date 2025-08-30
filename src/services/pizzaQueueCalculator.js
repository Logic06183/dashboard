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
  }

  getDefaultSettings() {
    return {
      basePrepTimePerPizza: 10, // minutes
      pizzaCapacity: 3, // simultaneous pizzas
      fridayRushMode: false, // 1.5x multiplier
      rushMultiplier: 1.5
    };
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
          // Only count pizzas that haven't been cooked yet
          if (!order.cooked || !order.cooked[index]) {
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
   * Calculate estimated prep time for a new order
   */
  calculateEstimatedPrepTime(additionalPizzas = 0) {
    const totalPizzasInQueue = this.getTotalPizzasInQueue() + additionalPizzas;
    
    if (totalPizzasInQueue === 0) {
      return this.settings.basePrepTimePerPizza;
    }

    // Calculate number of batches needed
    const batches = Math.ceil(totalPizzasInQueue / this.settings.pizzaCapacity);
    
    // Base time calculation
    let estimatedTime = batches * this.settings.basePrepTimePerPizza;
    
    // Apply Friday rush mode multiplier if enabled
    if (this.settings.fridayRushMode) {
      estimatedTime *= this.settings.rushMultiplier;
    }

    return Math.round(estimatedTime);
  }

  /**
   * Get queue overview data
   */
  getQueueOverview() {
    const totalPizzasInQueue = this.getTotalPizzasInQueue();
    const activeOrdersCount = this.getActiveOrdersCount();
    const estimatedWaitTime = this.calculateEstimatedPrepTime();

    return {
      totalPizzasInQueue,
      activeOrdersCount,
      estimatedWaitTime,
      settings: this.getSettings(),
      lastUpdated: new Date().toISOString()
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