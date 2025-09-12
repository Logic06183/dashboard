/**
 * DailyNotificationService.test.js
 * Unit tests for daily notification system
 */

import DailyNotificationService from './DailyNotificationService';

// Mock dependencies
jest.mock('./InventoryDeductionService', () => ({
  calculateBatchIngredientUsage: jest.fn(),
  generateDailyStockNotification: jest.fn()
}));

jest.mock('./EmailNotificationService', () => ({
  sendDailyStockReport: jest.fn()
}));

jest.mock('./FirebaseService', () => ({
  getInventory: jest.fn()
}));

// Import mocked modules
import InventoryDeductionService from './InventoryDeductionService';
import EmailNotificationService from './EmailNotificationService';
import FirebaseService from './FirebaseService';

describe('DailyNotificationService', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Clear localStorage
    localStorage.clear();
    
    // Reset service configuration
    DailyNotificationService.configure({
      managerEmail: 'test@example.com',
      enabled: true,
      notificationTime: { hour: 22, minute: 0 }
    });
  });

  describe('Configuration', () => {
    test('should configure notification settings correctly', () => {
      const config = {
        managerEmail: 'manager@test.com',
        enabled: true,
        notificationTime: { hour: 20, minute: 30 }
      };

      DailyNotificationService.configure(config);

      // Check if configuration is saved to localStorage
      const savedConfig = JSON.parse(localStorage.getItem('dailyNotificationConfig'));
      expect(savedConfig.managerEmail).toBe(config.managerEmail);
      expect(savedConfig.enabled).toBe(config.enabled);
      expect(savedConfig.notificationTime).toEqual(config.notificationTime);
    });

    test('should load configuration from localStorage', () => {
      const config = {
        managerEmail: 'saved@test.com',
        enabled: false,
        notificationTime: { hour: 23, minute: 15 }
      };

      localStorage.setItem('dailyNotificationConfig', JSON.stringify(config));
      
      // Create new instance to trigger loadConfiguration
      DailyNotificationService.loadConfiguration();

      expect(DailyNotificationService.managerEmail).toBe(config.managerEmail);
      expect(DailyNotificationService.isEnabled).toBe(config.enabled);
    });

    test('should handle multiple email addresses', () => {
      DailyNotificationService.configure({
        managerEmail: 'craig@test.com,parker@test.com',
        enabled: true
      });

      expect(DailyNotificationService.managerEmail).toContain('craig@test.com');
      expect(DailyNotificationService.managerEmail).toContain('parker@test.com');
    });
  });

  describe('Notification Generation', () => {
    beforeEach(() => {
      // Setup mock responses
      FirebaseService.getInventory.mockResolvedValue({
        sourdough_dough: { amount: 5, threshold: 10, unit: 'balls' },
        pepperoni: { amount: 0, threshold: 100, unit: 'g' }
      });

      InventoryDeductionService.calculateBatchIngredientUsage.mockReturnValue({
        sourdough_dough: { used: 10, unit: 'balls' }
      });

      InventoryDeductionService.generateDailyStockNotification.mockReturnValue({
        hasAlerts: true,
        criticalCount: 1,
        lowStockCount: 1,
        totalItemsLow: 2,
        criticalItems: [{ ingredient: 'pepperoni', currentStock: 0, unit: 'g' }],
        lowItems: [{ ingredient: 'sourdough_dough', currentStock: 5, unit: 'balls' }],
        message: 'Test notification message',
        timestamp: new Date().toISOString()
      });

      EmailNotificationService.sendDailyStockReport.mockResolvedValue({
        success: true,
        response: { messageId: 'test-message-id' }
      });
    });

    test('should send daily notification successfully', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          pizzas: [{ pizzaType: 'Margherita', quantity: 1 }],
          status: 'delivered'
        }
      ];

      const result = await DailyNotificationService.sendDailyNotification(mockOrders);

      expect(result.success).toBe(true);
      expect(result.notification).toBeDefined();
      expect(result.emailResults).toBeDefined();
      expect(result.recipientCount).toBe(1);
      expect(result.timestamp).toBeDefined();

      // Verify service calls
      expect(FirebaseService.getInventory).toHaveBeenCalled();
      expect(InventoryDeductionService.calculateBatchIngredientUsage).toHaveBeenCalledWith(mockOrders);
      expect(InventoryDeductionService.generateDailyStockNotification).toHaveBeenCalled();
      expect(EmailNotificationService.sendDailyStockReport).toHaveBeenCalled();
    });

    test('should handle multiple email recipients', async () => {
      DailyNotificationService.configure({
        managerEmail: 'craig@test.com,parker@test.com',
        enabled: true
      });

      const result = await DailyNotificationService.sendDailyNotification([]);

      expect(result.success).toBe(true);
      expect(result.recipientCount).toBe(2);
      expect(result.emailResults).toHaveLength(2);

      // Should call email service twice
      expect(EmailNotificationService.sendDailyStockReport).toHaveBeenCalledTimes(2);
    });

    test('should not send notification when disabled', async () => {
      DailyNotificationService.configure({
        managerEmail: 'test@example.com',
        enabled: false
      });

      const result = await DailyNotificationService.sendDailyNotification([]);

      expect(result.success).toBe(false);
      expect(result.message).toContain('disabled');
      expect(EmailNotificationService.sendDailyStockReport).not.toHaveBeenCalled();
    });

    test('should handle empty orders array', async () => {
      const result = await DailyNotificationService.sendDailyNotification([]);

      expect(result.success).toBe(true);
      expect(InventoryDeductionService.calculateBatchIngredientUsage).toHaveBeenCalledWith([]);
    });

    test('should handle Firebase service errors', async () => {
      FirebaseService.getInventory.mockRejectedValue(new Error('Firebase error'));

      const result = await DailyNotificationService.sendDailyNotification([]);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Firebase error');
    });

    test('should handle email service errors', async () => {
      EmailNotificationService.sendDailyStockReport.mockResolvedValue({
        success: false,
        error: 'Email service unavailable'
      });

      const result = await DailyNotificationService.sendDailyNotification([]);

      expect(result.success).toBe(true); // Overall success even if email fails
      expect(result.emailResults[0].result.success).toBe(false);
    });
  });

  describe('Daily Report Generation', () => {
    test('should create comprehensive daily report', () => {
      const mockInventory = {
        sourdough_dough: { amount: 15, unit: 'balls', category: 'dough' },
        pizza_sauce: { amount: 1000, unit: 'ml', category: 'sauce' }
      };

      const mockOrders = [
        {
          pizzas: [{ pizzaType: 'Margherita', quantity: 2 }],
          coldDrinks: [{ drinkType: 'Coca-Cola', quantity: 1 }],
          totalAmount: 150.00
        }
      ];

      const mockUsage = {
        sourdough_dough: { used: 2, unit: 'balls' },
        pizza_sauce: { used: 120, unit: 'ml' }
      };

      const mockNotification = {
        hasAlerts: false,
        criticalCount: 0,
        lowStockCount: 0,
        totalItemsLow: 0,
        criticalItems: [],
        lowItems: []
      };

      const report = DailyNotificationService.createDailyReport(
        mockInventory,
        mockOrders,
        mockUsage,
        mockNotification
      );

      expect(report).toBeDefined();
      expect(report.startingStockValue).toBeDefined();
      expect(report.endingStockValue).toBeDefined();
      expect(report.totalUsageCost).toBeDefined();
      expect(report.lowStockItems).toEqual([]);
      expect(report.efficiencyScore).toBeDefined();
      expect(report.ordersToday).toBe(1);
      expect(report.pizzasToday).toBe(2);
      expect(report.drinksToday).toBe(1);
    });

    test('should handle missing data gracefully', () => {
      const report = DailyNotificationService.createDailyReport({}, [], {}, {
        hasAlerts: false,
        criticalCount: 0,
        lowStockCount: 0,
        totalItemsLow: 0,
        criticalItems: [],
        lowItems: []
      });

      expect(report).toBeDefined();
      expect(report.startingStockValue).toBe(0);
      expect(report.endingStockValue).toBe(0);
      expect(report.ordersToday).toBe(0);
    });
  });

  describe('Notification Timing', () => {
    test('should check if notification time has passed', () => {
      const now = new Date();
      const pastTime = { hour: now.getHours() - 1, minute: 0 };
      const futureTime = { hour: now.getHours() + 1, minute: 0 };

      DailyNotificationService.configure({
        managerEmail: 'test@example.com',
        enabled: true,
        notificationTime: pastTime
      });

      expect(DailyNotificationService.shouldSendNotification()).toBe(true);

      DailyNotificationService.configure({
        managerEmail: 'test@example.com',
        enabled: true,
        notificationTime: futureTime
      });

      expect(DailyNotificationService.shouldSendNotification()).toBe(false);
    });

    test('should not send if already sent today', () => {
      const now = new Date();
      localStorage.setItem('lastDailyNotificationSent', now.toISOString());

      DailyNotificationService.configure({
        managerEmail: 'test@example.com',
        enabled: true,
        notificationTime: { hour: now.getHours() - 1, minute: 0 }
      });

      expect(DailyNotificationService.shouldSendNotification()).toBe(false);
    });

    test('should send if last notification was yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      localStorage.setItem('lastDailyNotificationSent', yesterday.toISOString());

      const now = new Date();
      DailyNotificationService.configure({
        managerEmail: 'test@example.com',
        enabled: true,
        notificationTime: { hour: now.getHours() - 1, minute: 0 }
      });

      expect(DailyNotificationService.shouldSendNotification()).toBe(true);
    });
  });

  describe('Low Stock Alerts', () => {
    test('should send immediate low stock alert', async () => {
      const criticalItems = [
        { ingredient: 'pepperoni', currentStock: 0, threshold: 100, unit: 'g' },
        { ingredient: 'mushrooms', currentStock: 0, threshold: 200, unit: 'g' }
      ];

      EmailNotificationService.sendLowStockAlert.mockResolvedValue({
        success: true,
        response: { messageId: 'alert-message-id' }
      });

      const result = await DailyNotificationService.sendLowStockAlert(criticalItems);

      expect(result.success).toBe(true);
      expect(result.itemsAlerted).toBe(2);
      expect(EmailNotificationService.sendLowStockAlert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'pepperoni', amount: 0 }),
          expect.objectContaining({ name: 'mushrooms', amount: 0 })
        ]),
        DailyNotificationService.managerEmail
      );
    });

    test('should not send alert for empty critical items', async () => {
      const result = await DailyNotificationService.sendLowStockAlert([]);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No critical items');
      expect(EmailNotificationService.sendLowStockAlert).not.toHaveBeenCalled();
    });
  });

  describe('Test Functionality', () => {
    test('should send test notification', async () => {
      FirebaseService.getInventory.mockResolvedValue({
        test_ingredient: { amount: 5, threshold: 10, unit: 'g' }
      });

      InventoryDeductionService.generateDailyStockNotification.mockReturnValue({
        hasAlerts: true,
        totalItemsLow: 1
      });

      EmailNotificationService.sendDailyStockReport.mockResolvedValue({
        success: true
      });

      const result = await DailyNotificationService.testNotification('test@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully');
      expect(result.testData).toBeDefined();
      expect(EmailNotificationService.sendDailyStockReport).toHaveBeenCalledWith(
        expect.any(Object),
        'test@example.com',
        'Test Recipient'
      );
    });

    test('should handle test notification errors', async () => {
      FirebaseService.getInventory.mockRejectedValue(new Error('Test error'));

      const result = await DailyNotificationService.testNotification();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Test error');
    });
  });

  describe('Notification History', () => {
    test('should maintain notification history', () => {
      const mockLogs = [
        {
          type: 'daily_stock_notification',
          timestamp: new Date().toISOString(),
          recipient: 'test@example.com',
          hasAlerts: true,
          criticalCount: 1,
          emailSuccess: true
        }
      ];

      localStorage.setItem('notificationLogs', JSON.stringify(mockLogs));

      const history = DailyNotificationService.getNotificationHistory();
      expect(history).toEqual(mockLogs);
    });

    test('should handle corrupted history gracefully', () => {
      localStorage.setItem('notificationLogs', 'invalid-json');

      const history = DailyNotificationService.getNotificationHistory();
      expect(history).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    test('should handle malformed email addresses', () => {
      DailyNotificationService.configure({
        managerEmail: 'invalid-email, ,valid@test.com,',
        enabled: true
      });

      // Should filter out empty and malformed entries
      expect(DailyNotificationService.managerEmail).toContain('valid@test.com');
    });

    test('should handle very large order datasets', async () => {
      const largeOrderSet = Array(1000).fill(null).map((_, i) => ({
        id: `order-${i}`,
        pizzas: [{ pizzaType: 'Margherita', quantity: 1 }]
      }));

      FirebaseService.getInventory.mockResolvedValue({});
      InventoryDeductionService.calculateBatchIngredientUsage.mockReturnValue({});
      InventoryDeductionService.generateDailyStockNotification.mockReturnValue({
        hasAlerts: false,
        criticalCount: 0,
        lowStockCount: 0,
        totalItemsLow: 0,
        criticalItems: [],
        lowItems: [],
        message: 'Test'
      });
      EmailNotificationService.sendDailyStockReport.mockResolvedValue({ success: true });

      const result = await DailyNotificationService.sendDailyNotification(largeOrderSet);

      expect(result.success).toBe(true);
      expect(InventoryDeductionService.calculateBatchIngredientUsage).toHaveBeenCalledWith(largeOrderSet);
    });
  });
});