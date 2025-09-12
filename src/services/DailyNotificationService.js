/**
 * DailyNotificationService.js
 * Handles daily stock notifications for management team
 * Integrates with InventoryDeductionService and EmailNotificationService
 */

import InventoryDeductionService from './InventoryDeductionService';
import EmailNotificationService from './EmailNotificationService';
import FirebaseService from './FirebaseService';

class DailyNotificationService {
  constructor() {
    this.managerEmail = 'craigparker6@gmail.com'; // Test email for Craig
    this.isEnabled = true;
    this.notificationTime = { hour: 22, minute: 0 }; // 10 PM SAST
  }

  /**
   * Configure notification settings
   * @param {Object} settings - Notification configuration
   */
  configure(settings) {
    if (settings.managerEmail) {
      this.managerEmail = settings.managerEmail;
    }
    if (settings.enabled !== undefined) {
      this.isEnabled = settings.enabled;
    }
    if (settings.notificationTime) {
      this.notificationTime = settings.notificationTime;
    }
    
    // Save to localStorage
    const config = {
      managerEmail: this.managerEmail,
      enabled: this.isEnabled,
      notificationTime: this.notificationTime,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('dailyNotificationConfig', JSON.stringify(config));
  }

  /**
   * Load configuration from localStorage
   */
  loadConfiguration() {
    try {
      const config = localStorage.getItem('dailyNotificationConfig');
      if (config) {
        const parsed = JSON.parse(config);
        this.managerEmail = parsed.managerEmail || this.managerEmail;
        this.isEnabled = parsed.enabled !== undefined ? parsed.enabled : this.isEnabled;
        this.notificationTime = parsed.notificationTime || this.notificationTime;
      }
    } catch (error) {
      console.warn('Error loading notification configuration:', error);
    }
  }

  /**
   * Generate and send daily stock notification
   * @param {Array} completedOrders - Today's completed orders (optional)
   * @returns {Object} Notification result
   */
  async sendDailyNotification(completedOrders = []) {
    try {
      if (!this.isEnabled) {
        return { success: false, message: 'Daily notifications are disabled' };
      }

      // Get current inventory
      const currentInventory = await FirebaseService.getInventory();
      
      // Calculate today's usage if orders provided
      let todaysUsage = [];
      if (completedOrders.length > 0) {
        todaysUsage = InventoryDeductionService.calculateBatchIngredientUsage(completedOrders);
      }
      
      // Generate notification data
      const notificationData = InventoryDeductionService.generateDailyStockNotification(
        currentInventory,
        todaysUsage
      );
      
      // Create comprehensive report for email
      const emailReport = this.createDailyReport(
        currentInventory,
        completedOrders,
        todaysUsage,
        notificationData
      );
      
      // Send email notification
      const emailResult = await EmailNotificationService.sendDailyStockReport(
        emailReport,
        this.managerEmail,
        'Mom'
      );
      
      // Log notification in Firebase for record keeping
      await this.logNotification(notificationData, emailResult);
      
      return {
        success: true,
        notification: notificationData,
        emailResult,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error sending daily notification:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Create comprehensive daily report data for email
   * @param {Object} inventory - Current inventory
   * @param {Array} orders - Today's orders
   * @param {Object} usage - Usage calculations
   * @param {Object} notification - Notification data
   * @returns {Object} Report data for email service
   */
  createDailyReport(inventory, orders, usage, notification) {
    // Get yesterday's inventory for comparison
    const yesterdayInventory = JSON.parse(
      localStorage.getItem('yesterdayInventory') || '{}'
    );
    
    // Calculate stock values (simplified without ingredient cost data)
    let startingStockValue = 0;
    let endingStockValue = 0;
    let totalUsageCost = 0;
    const topUsedIngredients = [];
    
    // Process each ingredient
    Object.entries(inventory).forEach(([ingredient, data]) => {
      const yesterdayAmount = yesterdayInventory[ingredient]?.amount || data.amount;
      const currentAmount = data.amount;
      const estimatedCost = this.getEstimatedIngredientCost(ingredient);
      
      startingStockValue += yesterdayAmount * estimatedCost;
      endingStockValue += currentAmount * estimatedCost;
      
      // If we have usage data, calculate costs
      if (usage[ingredient]) {
        const usageAmount = usage[ingredient].used;
        totalUsageCost += usageAmount * estimatedCost;
        topUsedIngredients.push({
          name: ingredient,
          used: usageAmount,
          unit: data.unit,
          cost: usageAmount * estimatedCost
        });
      }
    });
    
    // Sort ingredients by usage
    topUsedIngredients.sort((a, b) => b.used - a.used);
    
    // Calculate efficiency score (simplified)
    const efficiencyScore = Math.max(0, Math.min(100, 
      notification.totalItemsLow === 0 ? 95 : 
      Math.max(50, 90 - (notification.totalItemsLow * 10))
    ));
    
    // Process orders data
    const ordersToday = orders.length;
    const pizzasToday = orders.reduce((sum, order) => 
      sum + (order.pizzas ? order.pizzas.reduce((pSum, pizza) => 
        pSum + (pizza.quantity || 1), 0) : 0), 0);
    const drinksToday = orders.reduce((sum, order) => 
      sum + (order.coldDrinks ? order.coldDrinks.reduce((dSum, drink) => 
        dSum + (drink.quantity || 1), 0) : 0), 0);
    
    return {
      startingStockValue,
      endingStockValue,
      totalUsageCost,
      lowStockItems: notification.criticalItems.concat(notification.lowItems).map(item => ({
        name: item.ingredient,
        amount: item.currentStock,
        threshold: item.threshold,
        unit: item.unit
      })),
      efficiencyScore,
      topUsedIngredients,
      stockChangesSummary: [], // Could be enhanced with stock change tracking
      ordersToday,
      pizzasToday,
      drinksToday,
      // Additional data for enhanced reporting
      hasLowStock: notification.hasAlerts,
      criticalItemsCount: notification.criticalCount,
      lowStockItemsCount: notification.lowStockCount,
      notificationMessage: notification.message,
      generatedAt: notification.timestamp
    };
  }

  /**
   * Get estimated cost per unit for ingredient (simplified calculation)
   * @param {String} ingredient - Ingredient name
   * @returns {Number} Estimated cost per unit
   */
  getEstimatedIngredientCost(ingredient) {
    // Simplified cost estimation - in production this would come from ingredient database
    const costMap = {
      sourdough_dough: 2.50,
      pizza_sauce: 0.50,
      mozzarella: 8.00,
      pepperoni: 12.00,
      ham: 10.00,
      chicken: 15.00,
      mushrooms: 4.00,
      bell_peppers: 6.00,
      red_onions: 3.00,
      coca_cola_syrup: 15.00,
      sprite_syrup: 15.00,
      fanta_syrup: 15.00
    };
    
    return costMap[ingredient] || 1.00; // Default R1.00 per unit
  }

  /**
   * Check if it's time to send daily notification
   * @returns {Boolean} True if notification should be sent
   */
  shouldSendNotification() {
    if (!this.isEnabled) return false;
    
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Check if current time is past notification time
      const isAfterNotificationTime = 
        currentHour > this.notificationTime.hour ||
        (currentHour === this.notificationTime.hour && currentMinute >= this.notificationTime.minute);
      
      if (!isAfterNotificationTime) return false;
      
      // Check if we already sent notification today
      const lastSent = localStorage.getItem('lastDailyNotificationSent');
      if (!lastSent) return true; // Never sent before
      
      const lastSentDate = new Date(lastSent);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      lastSentDate.setHours(0, 0, 0, 0);
      
      // Send if last notification was sent before today
      return lastSentDate < today;
    } catch (error) {
      console.error('Error checking notification schedule:', error);
      return false;
    }
  }

  /**
   * Send notification if it's time
   * @param {Array} completedOrders - Today's completed orders
   * @returns {Object} Result or null if not time to send
   */
  async checkAndSendNotification(completedOrders = []) {
    if (!this.shouldSendNotification()) {
      return null; // Not time to send
    }
    
    const result = await this.sendDailyNotification(completedOrders);
    
    if (result.success) {
      // Mark as sent today
      localStorage.setItem('lastDailyNotificationSent', new Date().toISOString());
    }
    
    return result;
  }

  /**
   * Send immediate low stock alert (for critical situations)
   * @param {Array} criticalItems - Items that are out of stock
   * @returns {Object} Alert result
   */
  async sendLowStockAlert(criticalItems) {
    if (!this.isEnabled || criticalItems.length === 0) {
      return { success: false, message: 'No critical items or alerts disabled' };
    }
    
    try {
      // Format items for email service
      const alertItems = criticalItems.map(item => ({
        name: item.ingredient,
        amount: item.currentStock,
        threshold: item.threshold,
        unit: item.unit
      }));
      
      const emailResult = await EmailNotificationService.sendLowStockAlert(
        alertItems,
        this.managerEmail
      );
      
      return {
        success: true,
        itemsAlerted: criticalItems.length,
        emailResult,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error sending low stock alert:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Log notification to Firebase for record keeping
   * @param {Object} notificationData - The notification data sent
   * @param {Object} emailResult - Result from email service
   */
  async logNotification(notificationData, emailResult) {
    try {
      const logEntry = {
        type: 'daily_stock_notification',
        timestamp: new Date().toISOString(),
        recipient: this.managerEmail,
        hasAlerts: notificationData.hasAlerts,
        criticalCount: notificationData.criticalCount,
        lowStockCount: notificationData.lowStockCount,
        emailSuccess: emailResult.success,
        emailError: emailResult.error || null
      };
      
      // Store in notifications collection (you may need to add this to FirebaseService)
      // await FirebaseService.addNotificationLog(logEntry);
      
      // For now, store in localStorage as backup
      const existingLogs = JSON.parse(
        localStorage.getItem('notificationLogs') || '[]'
      );
      existingLogs.push(logEntry);
      
      // Keep only last 30 days of logs
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const filteredLogs = existingLogs.filter(log => 
        new Date(log.timestamp) > thirtyDaysAgo
      );
      
      localStorage.setItem('notificationLogs', JSON.stringify(filteredLogs));
      
    } catch (error) {
      console.warn('Error logging notification:', error);
    }
  }

  /**
   * Get notification history
   * @returns {Array} Recent notification logs
   */
  getNotificationHistory() {
    try {
      return JSON.parse(localStorage.getItem('notificationLogs') || '[]');
    } catch (error) {
      console.error('Error getting notification history:', error);
      return [];
    }
  }

  /**
   * Test notification system
   * @param {String} testEmail - Email to send test to (optional)
   * @returns {Object} Test result
   */
  async testNotification(testEmail = null) {
    const originalEmail = this.managerEmail;
    if (testEmail) {
      this.managerEmail = testEmail;
    }
    
    try {
      // Get current inventory for test
      const inventory = await FirebaseService.getInventory();
      
      // Generate test notification
      const testNotification = InventoryDeductionService.generateDailyStockNotification(inventory);
      
      // Create test report
      const testReport = this.createDailyReport(inventory, [], {}, testNotification);
      
      // Send test email
      const result = await EmailNotificationService.sendDailyStockReport(
        testReport,
        this.managerEmail,
        testEmail ? 'Test Recipient' : 'Mom'
      );
      
      return {
        success: true,
        message: 'Test notification sent successfully',
        result,
        testData: {
          hasAlerts: testNotification.hasAlerts,
          itemsCount: testNotification.totalItemsLow
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    } finally {
      // Restore original email
      this.managerEmail = originalEmail;
    }
  }
}

// Create singleton instance
const dailyNotificationService = new DailyNotificationService();

// Load configuration on startup
dailyNotificationService.loadConfiguration();

export default dailyNotificationService;