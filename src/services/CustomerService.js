/**
 * CustomerService.js
 * Handles customer database operations and standardization
 */

import { db } from './FirebaseService';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit
} from 'firebase/firestore';

class CustomerService {
  constructor() {
    this.customersCollection = 'customers';
  }

  /**
   * Customer schema:
   * {
   *   id: string (auto-generated)
   *   name: string (standardized format: "FirstName LastInitial" or full name)
   *   phone: string (formatted: "+27 XX XXX XXXX")
   *   email: string (optional)
   *   category: string (auto-assigned: "New", "Regular", "Frequent", "VIP")
   *   preferences: {
   *     favoritePizzas: string[],
   *     favoriteDrinks: string[],
   *     specialInstructions: string
   *   }
   *   totalOrders: number
   *   totalSpent: number
   *   averageOrderValue: number
   *   firstOrderDate: timestamp
   *   lastOrderDate: timestamp
   *   platforms: string[] (platforms used)
   *   isActive: boolean
   *   createdAt: timestamp
   *   updatedAt: timestamp
   * }
   */

  /**
   * Search customers by name or phone
   * @param {string} searchTerm - Name or phone to search for
   * @returns {Promise<Array>} Matching customers
   */
  async searchCustomers(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) return [];

    try {
      const customersRef = collection(db, this.customersCollection);
      const snapshot = await getDocs(customersRef);
      
      const customers = [];
      snapshot.forEach(doc => {
        customers.push({ id: doc.id, ...doc.data() });
      });
      
      const normalizedSearch = searchTerm.toLowerCase().trim();
      
      return customers.filter(customer => {
        const nameMatch = customer.name?.toLowerCase().includes(normalizedSearch);
        const phoneMatch = customer.phone?.replace(/\s+/g, '').includes(normalizedSearch.replace(/\s+/g, ''));
        return nameMatch || phoneMatch;
      }).slice(0, 10); // Limit to 10 results for performance
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  }

  /**
   * Get customer by phone number (primary identifier)
   * @param {string} phone - Phone number to search for
   * @returns {Promise<Object|null>} Customer or null if not found
   */
  async getCustomerByPhone(phone) {
    if (!phone) return null;

    try {
      const formattedPhone = this.formatPhoneNumber(phone);
      const customersRef = collection(db, this.customersCollection);
      const q = query(customersRef, where('phone', '==', formattedPhone));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting customer by phone:', error);
      return null;
    }
  }

  /**
   * Create a new customer
   * @param {Object} customerData - Customer information
   * @returns {Promise<Object>} Created customer with ID
   */
  async createCustomer(customerData) {
    try {
      const now = new Date();
      const standardizedCustomer = {
        name: this.standardizeName(customerData.name || 'Anonymous Customer'),
        phone: this.formatPhoneNumber(customerData.phone || ''),
        email: customerData.email || '',
        category: 'New',
        preferences: {
          favoritePizzas: [],
          favoriteDrinks: [],
          specialInstructions: ''
        },
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
        firstOrderDate: now,
        lastOrderDate: null,
        platforms: [],
        isActive: true,
        createdAt: now,
        updatedAt: now
      };

      const customersRef = collection(db, this.customersCollection);
      const docRef = await addDoc(customersRef, standardizedCustomer);
      
      return {
        id: docRef.id,
        ...standardizedCustomer
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  /**
   * Update customer information and statistics
   * @param {string} customerId - Customer ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<boolean>} Success status
   */
  async updateCustomer(customerId, updateData) {
    try {
      const updates = {
        ...updateData,
        updatedAt: new Date()
      };

      const customerRef = doc(db, this.customersCollection, customerId);
      await updateDoc(customerRef, updates);
      return true;
    } catch (error) {
      console.error('Error updating customer:', error);
      return false;
    }
  }

  /**
   * Update customer statistics after an order
   * @param {string} customerId - Customer ID
   * @param {Object} orderData - Order information
   * @returns {Promise<boolean>} Success status
   */
  async updateCustomerStats(customerId, orderData) {
    try {
      const customerRef = doc(db, this.customersCollection, customerId);
      const customerDoc = await getDoc(customerRef);
      const customer = customerDoc.exists() ? { id: customerDoc.id, ...customerDoc.data() } : null;
      if (!customer) return false;

      const orderValue = this.calculateOrderValue(orderData);
      const newTotalOrders = (customer.totalOrders || 0) + 1;
      const newTotalSpent = (customer.totalSpent || 0) + orderValue;
      const newAverageOrderValue = newTotalSpent / newTotalOrders;

      // Update preferences
      const pizzaTypes = this.extractPizzaTypes(orderData);
      const drinkTypes = this.extractDrinkTypes(orderData);
      
      const updatedPreferences = {
        favoritePizzas: this.updateFavorites(customer.preferences?.favoritePizzas || [], pizzaTypes),
        favoriteDrinks: this.updateFavorites(customer.preferences?.favoriteDrinks || [], drinkTypes),
        specialInstructions: customer.preferences?.specialInstructions || ''
      };

      // Determine new category
      const newCategory = this.determineCustomerCategory(newTotalOrders, newTotalSpent);

      // Update platforms used
      const updatedPlatforms = [...new Set([...(customer.platforms || []), orderData.platform])];

      const updates = {
        totalOrders: newTotalOrders,
        totalSpent: newTotalSpent,
        averageOrderValue: newAverageOrderValue,
        lastOrderDate: new Date(orderData.orderTime || Date.now()),
        category: newCategory,
        preferences: updatedPreferences,
        platforms: updatedPlatforms,
        updatedAt: new Date()
      };

      // customerRef already declared at the beginning of this function
      await updateDoc(customerRef, updates);
      return true;
    } catch (error) {
      console.error('Error updating customer stats:', error);
      return false;
    }
  }

  /**
   * Get or create customer (main function for order processing)
   * @param {Object} customerInfo - Customer information from order
   * @returns {Promise<Object>} Customer object with ID
   */
  async getOrCreateCustomer(customerInfo) {
    try {
      // If phone provided, try to find existing customer
      if (customerInfo.phone) {
        const existingCustomer = await this.getCustomerByPhone(customerInfo.phone);
        if (existingCustomer) {
          return existingCustomer;
        }
      }

      // If name provided but no phone, search by name for potential matches
      if (customerInfo.name && !customerInfo.phone) {
        const potentialMatches = await this.searchCustomers(customerInfo.name);
        if (potentialMatches.length === 1) {
          // Single match found, likely the same customer
          return potentialMatches[0];
        }
      }

      // Create new customer
      return await this.createCustomer(customerInfo);
    } catch (error) {
      console.error('Error getting or creating customer:', error);
      // Return anonymous customer as fallback
      return {
        id: null,
        name: customerInfo.name || 'Anonymous Customer',
        phone: customerInfo.phone || '',
        category: 'New',
        isTemporary: true
      };
    }
  }

  /**
   * Standardize customer name format
   * @param {string} name - Raw name input
   * @returns {string} Standardized name
   */
  standardizeName(name) {
    if (!name || typeof name !== 'string') return 'Anonymous Customer';

    const trimmed = name.trim();
    if (!trimmed) return 'Anonymous Customer';

    // Split into words and capitalize properly
    const words = trimmed.toLowerCase().split(/\s+/);
    const standardized = words.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');

    // Limit length to prevent very long names
    return standardized.length > 50 ? standardized.substring(0, 47) + '...' : standardized;
  }

  /**
   * Format phone number to South African standard
   * @param {string} phone - Raw phone input
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phone) {
    if (!phone) return '';

    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');

    // Handle different formats
    if (digitsOnly.length === 10 && digitsOnly.startsWith('0')) {
      // Local format: 0XX XXX XXXX -> +27 XX XXX XXXX
      return `+27 ${digitsOnly.substring(1, 3)} ${digitsOnly.substring(3, 6)} ${digitsOnly.substring(6)}`;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('27')) {
      // International without +: 27XX XXX XXXX -> +27 XX XXX XXXX
      return `+27 ${digitsOnly.substring(2, 4)} ${digitsOnly.substring(4, 7)} ${digitsOnly.substring(7)}`;
    } else if (digitsOnly.length === 9) {
      // Without leading 0: XX XXX XXXX -> +27 XX XXX XXXX
      return `+27 ${digitsOnly.substring(0, 2)} ${digitsOnly.substring(2, 5)} ${digitsOnly.substring(5)}`;
    }

    // Return as-is if doesn't match expected patterns
    return phone;
  }

  /**
   * Determine customer category based on order history
   * @param {number} totalOrders - Total number of orders
   * @param {number} totalSpent - Total amount spent
   * @returns {string} Customer category
   */
  determineCustomerCategory(totalOrders, totalSpent) {
    if (totalSpent >= 500) return 'VIP';
    if (totalOrders >= 5) return 'Frequent';
    if (totalOrders >= 2) return 'Regular';
    return 'New';
  }

  /**
   * Calculate order value from order data
   * @param {Object} orderData - Order information
   * @returns {number} Order value in Rand
   */
  calculateOrderValue(orderData) {
    // This would use the same pricing logic as in CustomersPage
    const pizzaPrices = {
      'THE CHAMP': 169.00, 'LEKKER\'IZZA': 195.00, 'CHICK TICK BOOM!': 165.00,
      'MISH-MASH': 159.00, 'POPPA\'S': 179.00, 'PIG IN PARADISE': 169.00,
      'ARTICHOKE & HAM': 169.00, 'GLAZE OF GLORY': 159.00, 'MEDITERRANEAN': 175.00,
      'MARGIE': 125.00, 'OWEN!': 169.00, 'CAPRESE': 165.00, 'VEGAN HARVEST': 175.00,
      'VEG SPECIAL': 155.00, 'BUILD YOUR OWN': 139.00, 'SPUD': 139.00,
      'GREEK GODDESS': 139.00, 'QUATTRO FORMAGGI': 169.00, 'MUSHROOM CLOUD': 169.00,
      'Margherita': 125.00, 'Pepperoni': 155.00, 'Vegetarian': 155.00
    };

    const drinkPrices = {
      'Coca-Cola 330ml': 25.00, 'Coke Zero 330ml': 25.00, 'Sprite 330ml': 25.00,
      'Fanta Orange 330ml': 25.00, 'Appletizer 330ml': 28.00, 'Grapetizer 330ml': 28.00,
      'Still Water 500ml': 18.00, 'Sparkling Water 500ml': 20.00, 'Ice Tea 500ml': 28.00,
      'Red Bull 250ml': 35.00
    };

    let totalValue = 0;

    // Calculate pizza values
    if (orderData.pizzas && Array.isArray(orderData.pizzas)) {
      orderData.pizzas.forEach(pizza => {
        const quantity = pizza.quantity || 1;
        const price = pizzaPrices[pizza.pizzaType || pizza.type] || 150;
        totalValue += price * quantity;
      });
    } else if (orderData.pizzaType) {
      const price = pizzaPrices[orderData.pizzaType] || 150;
      totalValue += price;
    }

    // Calculate drink values
    if (orderData.coldDrinks && Array.isArray(orderData.coldDrinks)) {
      orderData.coldDrinks.forEach(drink => {
        const quantity = drink.quantity || 1;
        const price = drinkPrices[drink.drinkType] || 25;
        totalValue += price * quantity;
      });
    }

    return totalValue;
  }

  /**
   * Extract pizza types from order data
   * @param {Object} orderData - Order information
   * @returns {Array} Array of pizza types
   */
  extractPizzaTypes(orderData) {
    const pizzaTypes = [];
    
    if (orderData.pizzas && Array.isArray(orderData.pizzas)) {
      orderData.pizzas.forEach(pizza => {
        const type = pizza.pizzaType || pizza.type;
        if (type) pizzaTypes.push(type);
      });
    } else if (orderData.pizzaType) {
      pizzaTypes.push(orderData.pizzaType);
    }
    
    return pizzaTypes;
  }

  /**
   * Extract drink types from order data
   * @param {Object} orderData - Order information
   * @returns {Array} Array of drink types
   */
  extractDrinkTypes(orderData) {
    const drinkTypes = [];
    
    if (orderData.coldDrinks && Array.isArray(orderData.coldDrinks)) {
      orderData.coldDrinks.forEach(drink => {
        if (drink.drinkType) drinkTypes.push(drink.drinkType);
      });
    }
    
    return drinkTypes;
  }

  /**
   * Update favorite items list
   * @param {Array} currentFavorites - Current favorite items
   * @param {Array} newItems - New items to add
   * @returns {Array} Updated favorites list
   */
  updateFavorites(currentFavorites, newItems) {
    const favoritesMap = new Map();
    
    // Count current favorites
    currentFavorites.forEach(item => {
      favoritesMap.set(item, (favoritesMap.get(item) || 0) + 1);
    });
    
    // Add new items
    newItems.forEach(item => {
      favoritesMap.set(item, (favoritesMap.get(item) || 0) + 1);
    });
    
    // Return top 5 favorites sorted by frequency
    return Array.from(favoritesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([item]) => item);
  }

  /**
   * Get all customers for admin purposes
   * @returns {Promise<Array>} All customers
   */
  async getAllCustomers() {
    try {
      const customersRef = collection(db, this.customersCollection);
      const snapshot = await getDocs(customersRef);
      
      const customers = [];
      snapshot.forEach(doc => {
        customers.push({ id: doc.id, ...doc.data() });
      });
      
      return customers;
    } catch (error) {
      console.error('Error getting all customers:', error);
      return [];
    }
  }

  /**
   * Migrate existing order data to create customer records
   * @param {Array} orders - Existing orders
   * @returns {Promise<number>} Number of customers created
   */
  async migrateExistingCustomers(orders) {
    if (!orders || !Array.isArray(orders)) return 0;

    let customersCreated = 0;
    const processedCustomers = new Set();

    for (const order of orders) {
      if (!order.customerName || processedCustomers.has(order.customerName)) continue;

      try {
        const customerInfo = {
          name: order.customerName,
          phone: order.phone || ''
        };

        const customer = await this.getOrCreateCustomer(customerInfo);
        
        if (customer && !customer.isTemporary) {
          // Update stats with this order
          await this.updateCustomerStats(customer.id, order);
          processedCustomers.add(order.customerName);
          customersCreated++;
        }
      } catch (error) {
        console.error(`Error migrating customer ${order.customerName}:`, error);
      }
    }

    return customersCreated;
  }
}

// Create singleton instance
const customerService = new CustomerService();

export default customerService;