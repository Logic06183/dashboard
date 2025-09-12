/**
 * InventoryDeductionService.test.js
 * Unit tests for inventory deduction calculations
 */

import InventoryDeductionService, {
  calculateOrderIngredientUsage,
  calculateBatchIngredientUsage,
  deductInventoryForOrders,
  getLowStockAlerts,
  generateDailyStockNotification
} from './InventoryDeductionService';

// Mock Firebase service
jest.mock('./FirebaseService', () => ({
  getInventory: jest.fn(),
  updateInventory: jest.fn()
}));

describe('InventoryDeductionService', () => {
  // Mock order data
  const mockOrder = {
    id: 'test-order-1',
    pizzas: [
      { pizzaType: 'THE CHAMP', quantity: 2 },
      { pizzaType: 'MARGIE', quantity: 1 }
    ],
    coldDrinks: [
      { drinkType: 'Coca-Cola 330ml', quantity: 3 }
    ]
  };

  const mockInventory = {
    sourdough_dough: { amount: 20, threshold: 10, unit: 'balls', category: 'dough' },
    pizza_sauce: { amount: 500, threshold: 500, unit: 'ml', category: 'sauce' },
    mozzarella: { amount: 300, threshold: 200, unit: 'g', category: 'cheese' },
    pepperoni: { amount: 0, threshold: 100, unit: 'g', category: 'meat' },
    coke_syrup: { amount: 800, threshold: 1000, unit: 'ml', category: 'beverage_ingredient' }
  };

  describe('calculateOrderIngredientUsage', () => {
    test('should calculate ingredient usage for a single order', () => {
      const usage = calculateOrderIngredientUsage(mockOrder);
      
      expect(usage).toBeDefined();
      expect(typeof usage).toBe('object');
      
      // Should include base ingredients (sourdough dough)
      expect(usage.sourdough_dough).toBeDefined();
      expect(usage.sourdough_dough.used).toBeGreaterThan(0);
      
      // Should include cold drink ingredients
      expect(usage.coke_syrup).toBeDefined();
      expect(usage.coke_syrup.used).toBeGreaterThan(0);
    });

    test('should handle orders with no pizzas', () => {
      const orderNoPizzas = {
        id: 'test-order-2',
        coldDrinks: [{ drinkType: 'Coca-Cola 330ml', quantity: 1 }]
      };
      
      const usage = calculateOrderIngredientUsage(orderNoPizzas);
      expect(usage).toBeDefined();
      expect(usage.coke_syrup).toBeDefined();
    });

    test('should handle orders with no cold drinks', () => {
      const orderNoDrinks = {
        id: 'test-order-3',
        pizzas: [{ pizzaType: 'MARGIE', quantity: 1 }]
      };
      
      const usage = calculateOrderIngredientUsage(orderNoDrinks);
      expect(usage).toBeDefined();
      expect(usage.sourdough_dough).toBeDefined();
    });

    test('should handle empty order', () => {
      const emptyOrder = { id: 'empty-order' };
      const usage = calculateOrderIngredientUsage(emptyOrder);
      expect(usage).toEqual({});
    });

    test('should handle null/undefined order', () => {
      expect(calculateOrderIngredientUsage(null)).toEqual({});
      expect(calculateOrderIngredientUsage(undefined)).toEqual({});
    });
  });

  describe('calculateBatchIngredientUsage', () => {
    test('should calculate total usage for multiple orders', () => {
      const orders = [mockOrder, mockOrder]; // Same order twice
      const usage = calculateBatchIngredientUsage(orders);
      
      expect(usage).toBeDefined();
      expect(usage.sourdough_dough.used).toBeGreaterThan(0);
      
      // Usage should be doubled since we have the same order twice
      const singleUsage = calculateOrderIngredientUsage(mockOrder);
      expect(usage.sourdough_dough.used).toBe(singleUsage.sourdough_dough.used * 2);
    });

    test('should handle empty orders array', () => {
      const usage = calculateBatchIngredientUsage([]);
      expect(usage).toEqual({});
    });

    test('should aggregate different ingredients from multiple orders', () => {
      const order1 = {
        pizzas: [{ pizzaType: 'MARGIE', quantity: 1 }]
      };
      const order2 = {
        pizzas: [{ pizzaType: 'THE CHAMP', quantity: 1 }]
      };
      
      const usage = calculateBatchIngredientUsage([order1, order2]);
      expect(usage).toBeDefined();
      expect(Object.keys(usage).length).toBeGreaterThan(0);
    });
  });

  describe('deductInventoryForOrders', () => {
    test('should deduct correct amounts from inventory', () => {
      const orders = [mockOrder];
      const updatedInventory = deductInventoryForOrders(orders, mockInventory);
      
      expect(updatedInventory).toBeDefined();
      
      // Should maintain structure
      expect(updatedInventory.sourdough_dough.amount).toBeLessThan(mockInventory.sourdough_dough.amount);
      expect(updatedInventory.sourdough_dough.unit).toBe('balls');
      expect(updatedInventory.sourdough_dough.category).toBe('dough');
    });

    test('should not go below zero', () => {
      const lowInventory = {
        sourdough_dough: { amount: 1, threshold: 10, unit: 'balls', category: 'dough' }
      };
      
      const orders = [mockOrder]; // This will use more than 1 dough ball
      const updatedInventory = deductInventoryForOrders(orders, lowInventory);
      
      expect(updatedInventory.sourdough_dough.amount).toBe(0);
    });

    test('should create missing ingredients with zero stock', () => {
      const minimalInventory = {};
      const orders = [mockOrder];
      const updatedInventory = deductInventoryForOrders(orders, minimalInventory);
      
      expect(updatedInventory.sourdough_dough).toBeDefined();
      expect(updatedInventory.sourdough_dough.amount).toBe(0);
    });
  });

  describe('getLowStockAlerts', () => {
    test('should identify low stock items', () => {
      const alerts = getLowStockAlerts(mockInventory);
      
      expect(alerts).toBeInstanceOf(Array);
      
      // Should find pepperoni (0g) and coke_syrup (800ml < 1000ml threshold)
      const pepperoniAlert = alerts.find(alert => alert.ingredient === 'pepperoni');
      const colaAlert = alerts.find(alert => alert.ingredient === 'coke_syrup');
      
      expect(pepperoniAlert).toBeDefined();
      expect(pepperoniAlert.urgency).toBe('critical');
      expect(pepperoniAlert.currentStock).toBe(0);
      
      expect(colaAlert).toBeDefined();
      expect(colaAlert.urgency).toBe('low');
      expect(colaAlert.currentStock).toBe(800);
    });

    test('should sort critical items first', () => {
      const alerts = getLowStockAlerts(mockInventory);
      
      if (alerts.length > 1) {
        // Critical items (amount === 0) should come before low items
        const criticalItems = alerts.filter(alert => alert.urgency === 'critical');
        const lowItems = alerts.filter(alert => alert.urgency === 'low');
        
        if (criticalItems.length > 0 && lowItems.length > 0) {
          const firstCriticalIndex = alerts.findIndex(alert => alert.urgency === 'critical');
          const firstLowIndex = alerts.findIndex(alert => alert.urgency === 'low');
          expect(firstCriticalIndex).toBeLessThan(firstLowIndex);
        }
      }
    });

    test('should handle inventory with no low stock', () => {
      const goodInventory = {
        sourdough_dough: { amount: 50, threshold: 10, unit: 'balls', category: 'dough' },
        pizza_sauce: { amount: 2000, threshold: 500, unit: 'ml', category: 'sauce' }
      };
      
      const alerts = getLowStockAlerts(goodInventory);
      expect(alerts).toEqual([]);
    });
  });

  describe('generateDailyStockNotification', () => {
    test('should generate comprehensive notification data', () => {
      const notification = generateDailyStockNotification(mockInventory, []);
      
      expect(notification).toBeDefined();
      expect(notification.hasAlerts).toBe(true); // Should have alerts due to low stock
      expect(notification.criticalCount).toBeGreaterThan(0); // Pepperoni is out of stock
      expect(notification.totalItemsLow).toBeGreaterThan(0);
      expect(notification.message).toContain('CRITICAL');
      expect(notification.timestamp).toBeDefined();
    });

    test('should generate message for no alerts', () => {
      const goodInventory = {
        sourdough_dough: { amount: 50, threshold: 10, unit: 'balls', category: 'dough' }
      };
      
      const notification = generateDailyStockNotification(goodInventory, []);
      expect(notification.hasAlerts).toBe(false);
      expect(notification.message).toContain('✅');
    });

    test('should include usage data when provided', () => {
      const usage = { sourdough_dough: { used: 10, unit: 'balls' } };
      const notification = generateDailyStockNotification(mockInventory, usage);
      
      expect(notification).toBeDefined();
      expect(notification.hasAlerts).toBe(true);
    });
  });

  describe('Edge cases and error handling', () => {
    test('should handle malformed pizza types gracefully', () => {
      const badOrder = {
        pizzas: [
          { pizzaType: 'UNKNOWN_PIZZA', quantity: 1 },
          { pizzaType: null, quantity: 1 },
          { pizzaType: '', quantity: 1 }
        ]
      };
      
      const usage = calculateOrderIngredientUsage(badOrder);
      // Should not crash and should include base ingredients for valid orders
      expect(usage).toBeDefined();
    });

    test('should handle negative quantities', () => {
      const negativeOrder = {
        pizzas: [{ pizzaType: 'MARGIE', quantity: -1 }]
      };
      
      const usage = calculateOrderIngredientUsage(negativeOrder);
      expect(usage).toBeDefined();
    });

    test('should handle non-numeric quantities', () => {
      const invalidOrder = {
        pizzas: [{ pizzaType: 'MARGIE', quantity: 'invalid' }]
      };
      
      expect(() => calculateOrderIngredientUsage(invalidOrder)).not.toThrow();
    });
  });

  describe('Integration tests', () => {
    test('should work end-to-end with realistic data', () => {
      const realisticOrders = [
        {
          id: 'morning-order-1',
          pizzas: [
            { pizzaType: 'THE CHAMP', quantity: 2 },
            { pizzaType: 'MARGIE', quantity: 1 }
          ],
          coldDrinks: [
            { drinkType: 'Coca-Cola 330ml', quantity: 2 },
            { drinkType: 'Sprite 330ml', quantity: 1 }
          ]
        },
        {
          id: 'lunch-order-2',
          pizzas: [
            { pizzaType: 'MUSHROOM CLOUD', quantity: 1 },
            { pizzaType: 'PIG IN PARADISE', quantity: 2 }
          ],
          coldDrinks: [
            { drinkType: 'Coca-Cola 330ml', quantity: 3 }
          ]
        }
      ];

      const realisticInventory = {
        sourdough_dough: { amount: 30, threshold: 15, unit: 'balls', category: 'dough' },
        pizza_sauce: { amount: 2000, threshold: 500, unit: 'ml', category: 'sauce' },
        mozzarella: { amount: 1500, threshold: 300, unit: 'g', category: 'cheese' },
        pepperoni: { amount: 200, threshold: 150, unit: 'g', category: 'meat' },
        mushrooms: { amount: 50, threshold: 200, unit: 'g', category: 'vegetable' },
        ham: { amount: 300, threshold: 200, unit: 'g', category: 'meat' },
        pineapple: { amount: 250, threshold: 200, unit: 'g', category: 'vegetable' },
        coke_syrup: { amount: 1200, threshold: 1000, unit: 'ml', category: 'beverage_ingredient' },
        sprite_syrup: { amount: 800, threshold: 1000, unit: 'ml', category: 'beverage_ingredient' }
      };

      // Calculate usage
      const totalUsage = calculateBatchIngredientUsage(realisticOrders);
      expect(Object.keys(totalUsage).length).toBeGreaterThan(0);

      // Deduct from inventory
      const updatedInventory = deductInventoryForOrders(realisticOrders, realisticInventory);
      expect(updatedInventory.sourdough_dough.amount).toBeLessThan(realisticInventory.sourdough_dough.amount);

      // Get alerts
      const alerts = getLowStockAlerts(updatedInventory);
      expect(alerts).toBeInstanceOf(Array);

      // Generate notification
      const notification = generateDailyStockNotification(updatedInventory, totalUsage);
      expect(notification.timestamp).toBeDefined();
      expect(notification.message).toBeDefined();
      
      // Should provide actionable information
      expect(typeof notification.hasAlerts).toBe('boolean');
      expect(typeof notification.criticalCount).toBe('number');
      expect(typeof notification.lowStockCount).toBe('number');
    });
  });
});