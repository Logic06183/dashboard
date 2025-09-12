/**
 * EmailNotificationService.js
 * Handles automated email notifications for inventory summaries
 */

import emailjs from '@emailjs/browser';

class EmailNotificationService {
  constructor() {
    // Initialize EmailJS with your public key
    // Note: Replace with your actual EmailJS public key
    this.publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'your_public_key_here';
    this.serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'your_service_id';
    this.templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'your_template_id';
    
    if (this.publicKey !== 'your_public_key_here') {
      emailjs.init(this.publicKey);
    }
  }

  /**
   * Send daily stock vs usage report email
   * @param {Object} reportData - The daily report data including stock levels and usage
   * @param {string} recipientEmail - Email address to send to
   * @param {string} recipientName - Name of recipient
   */
  async sendDailyStockReport(reportData, recipientEmail, recipientName = 'Mom') {
    if (this.publicKey === 'your_public_key_here') {
      console.warn('EmailJS not configured. Please set up environment variables.');
      // For development, we'll show an alert instead
      this.showDevelopmentAlert(reportData, recipientEmail);
      return { success: true, message: 'Development mode - report displayed in alert' };
    }

    try {
      const templateParams = {
        to_name: recipientName,
        to_email: recipientEmail,
        from_name: "John Dough's Pizza Dashboard",
        subject: `Daily Stock Report - ${new Date().toLocaleDateString('en-ZA')}`,
        report_text: this.formatDailyStockReport(reportData),
        report_date: new Date().toLocaleDateString('en-ZA'),
        starting_stock_value: `R${reportData.startingStockValue.toFixed(2)}`,
        ending_stock_value: `R${reportData.endingStockValue.toFixed(2)}`,
        total_usage_cost: `R${reportData.totalUsageCost.toFixed(2)}`,
        low_stock_count: reportData.lowStockItems.length,
        efficiency_score: `${reportData.efficiencyScore}%`,
        restaurant_name: "John Dough's Sourdough Pizzeria",
        location: "Linden, Johannesburg, South Africa"
      };

      const response = await emailjs.send(
        this.serviceId,
        this.templateId, // Use the configured template ID
        templateParams
      );

      console.log('Daily stock report sent successfully:', response);
      return { success: true, response };
    } catch (error) {
      console.error('Error sending daily stock report:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Send inventory usage summary email
   * @param {Object} summaryData - The inventory summary data
   * @param {string} recipientEmail - Email address to send to
   * @param {string} recipientName - Name of recipient
   */
  async sendInventorySummary(summaryData, recipientEmail, recipientName = 'Inventory Manager') {
    if (this.publicKey === 'your_public_key_here') {
      console.warn('EmailJS not configured. Please set up environment variables.');
      // For development, we'll show an alert instead
      this.showDevelopmentAlert(summaryData, recipientEmail);
      return;
    }

    try {
      const templateParams = {
        to_name: recipientName,
        to_email: recipientEmail,
        from_name: "John Dough's Pizza Dashboard",
        subject: `Inventory Usage Summary - ${new Date().toLocaleDateString('en-ZA')}`,
        summary_text: this.formatSummaryForEmail(summaryData),
        report_date: new Date().toLocaleDateString('en-ZA'),
        total_orders: summaryData.totalOrders,
        total_pizzas: summaryData.totalPizzas,
        total_drinks: summaryData.totalDrinks,
        total_cost: `R${summaryData.totalCost.toFixed(2)}`,
        restaurant_name: "John Dough's Sourdough Pizzeria",
        location: "Linden, Johannesburg, South Africa"
      };

      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams
      );

      console.log('Email sent successfully:', response);
      return { success: true, response };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send low stock alert email
   * @param {Array} lowStockItems - Array of low stock items
   * @param {string} recipientEmail - Email address to send to
   */
  async sendLowStockAlert(lowStockItems, recipientEmail) {
    if (this.publicKey === 'your_public_key_here') {
      console.warn('EmailJS not configured. Using development alert.');
      alert(`Low Stock Alert!\n\nThe following items are running low:\n${lowStockItems.map(item => `- ${item.name}: ${item.amount} ${item.unit}`).join('\n')}`);
      return;
    }

    try {
      const templateParams = {
        to_email: recipientEmail,
        from_name: "John Dough's Pizza Dashboard",
        subject: `🚨 LOW STOCK ALERT - ${new Date().toLocaleDateString('en-ZA')}`,
        alert_text: this.formatLowStockAlert(lowStockItems),
        alert_date: new Date().toLocaleDateString('en-ZA'),
        items_count: lowStockItems.length,
        restaurant_name: "John Dough's Sourdough Pizzeria"
      };

      const response = await emailjs.send(
        this.serviceId,
        'low_stock_template', // Different template for alerts
        templateParams
      );

      return { success: true, response };
    } catch (error) {
      console.error('Error sending low stock alert:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Schedule recurring summary emails
   * @param {string} frequency - 'daily' or 'weekly'
   * @param {string} recipientEmail - Email to send to
   */
  scheduleRecurringSummary(frequency, recipientEmail) {
    // Note: This would typically be handled by a backend service
    // For now, we'll store the preference in localStorage
    const schedule = {
      frequency,
      recipientEmail,
      lastSent: null,
      enabled: true
    };

    localStorage.setItem('inventoryEmailSchedule', JSON.stringify(schedule));
    console.log(`Scheduled ${frequency} inventory summaries to ${recipientEmail}`);
    
    return { success: true, message: `${frequency} summaries scheduled successfully` };
  }

  /**
   * Send automated daily report at specified time
   * @param {Object} inventoryData - Current inventory data
   * @param {Array} todayOrders - Today's orders
   * @param {string} managerEmail - Email to send to
   */
  async sendAutomatedDailyReport(inventoryData, todayOrders = [], managerEmail) {
    if (!managerEmail) {
      console.warn('No manager email configured for daily reports');
      return { success: false, error: 'No recipient email' };
    }
    
    try {
      // Get yesterday's inventory from localStorage if available
      const yesterdayInventory = JSON.parse(localStorage.getItem('yesterdayInventory') || '{}');
      
      // Get stock changes from today
      const stockChanges = JSON.parse(localStorage.getItem('stockHistory') || '[]');
      
      // Calculate report data
      const reportData = this.calculateDailyStockReport(
        inventoryData,
        yesterdayInventory,
        todayOrders,
        stockChanges
      );
      
      // Send the report
      const result = await this.sendDailyStockReport(reportData, managerEmail, 'Mom');
      
      // Save today's inventory as yesterday's for tomorrow's report
      localStorage.setItem('yesterdayInventory', JSON.stringify(inventoryData));
      localStorage.setItem('lastDailyReportSent', new Date().toISOString());
      
      return result;
    } catch (error) {
      console.error('Error sending automated daily report:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Check if it's time to send a scheduled summary
   */
  checkScheduledSummaries() {
    const schedule = localStorage.getItem('inventoryEmailSchedule');
    if (!schedule) return false;

    try {
      const config = JSON.parse(schedule);
      if (!config.enabled) return false;

      const now = new Date();
      const lastSent = config.lastSent ? new Date(config.lastSent) : null;

      if (!lastSent) return true; // Never sent before

      const hoursSinceLastSent = (now - lastSent) / (1000 * 60 * 60);

      if (config.frequency === 'daily' && hoursSinceLastSent >= 24) {
        return true;
      }

      if (config.frequency === 'weekly' && hoursSinceLastSent >= 168) { // 7 days * 24 hours
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking scheduled summaries:', error);
      return false;
    }
  }
  
  /**
   * Check if daily report should be sent (typically at end of day)
   */
  shouldSendDailyReport() {
    try {
      const lastSent = localStorage.getItem('lastDailyReportSent');
      const now = new Date();
      
      // Check if we should send daily report (after 10 PM and before midnight)
      const hour = now.getHours();
      const isAfterReportTime = hour >= 22; // 10 PM
      
      if (!isAfterReportTime) return false;
      
      if (!lastSent) return true; // Never sent before
      
      const lastSentDate = new Date(lastSent);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      lastSentDate.setHours(0, 0, 0, 0);
      
      // Send if last report was sent before today
      return lastSentDate < today;
    } catch (error) {
      console.error('Error checking daily report schedule:', error);
      return false;
    }
  }

  /**
   * Format daily stock report for email
   */
  formatDailyStockReport(reportData) {
    const { 
      startingStockValue, 
      endingStockValue, 
      totalUsageCost, 
      ingredientChanges, 
      lowStockItems, 
      efficiencyScore,
      topUsedIngredients,
      stockChangesSummary 
    } = reportData;
    
    let text = `DAILY STOCK REPORT\n`;
    text += `Date: ${new Date().toLocaleDateString('en-ZA')}\n`;
    text += `Generated: ${new Date().toLocaleString('en-ZA')}\n\n`;
    
    text += `STOCK VALUE OVERVIEW:\n`;
    text += `• Starting Stock Value: R${startingStockValue.toFixed(2)}\n`;
    text += `• Ending Stock Value: R${endingStockValue.toFixed(2)}\n`;
    text += `• Total Usage Cost: R${totalUsageCost.toFixed(2)}\n`;
    text += `• Net Change: R${(endingStockValue - startingStockValue).toFixed(2)}\n`;
    text += `• Efficiency Score: ${efficiencyScore}%\n\n`;
    
    if (lowStockItems.length > 0) {
      text += `⚠️ LOW STOCK ALERTS (${lowStockItems.length} items):\n`;
      lowStockItems.forEach(item => {
        text += `• ${item.name.replace(/_/g, ' ').toUpperCase()}: ${item.amount} ${item.unit} (threshold: ${item.threshold})\n`;
      });
      text += `\n`;
    }
    
    if (topUsedIngredients && topUsedIngredients.length > 0) {
      text += `TOP USED INGREDIENTS TODAY:\n`;
      topUsedIngredients.slice(0, 5).forEach((item, index) => {
        text += `${index + 1}. ${item.name.replace(/_/g, ' ').toUpperCase()}: ${item.used.toFixed(1)} ${item.unit}\n`;
      });
      text += `\n`;
    }
    
    if (stockChangesSummary && stockChangesSummary.length > 0) {
      text += `STOCK ADJUSTMENTS TODAY:\n`;
      stockChangesSummary.forEach(change => {
        const changeText = change.difference > 0 ? `+${change.difference}` : `${change.difference}`;
        text += `• ${change.ingredient.replace(/_/g, ' ')}: ${changeText} ${change.unit} (${change.changeType})\n`;
      });
      text += `\n`;
    }
    
    text += `DAILY SUMMARY:\n`;
    text += `• Orders processed: ${reportData.ordersToday || 0}\n`;
    text += `• Pizzas made: ${reportData.pizzasToday || 0}\n`;
    text += `• Drinks served: ${reportData.drinksToday || 0}\n\n`;
    
    text += `---\nThis report was automatically generated by John Dough's Pizza Dashboard.\n`;
    text += `For detailed analysis, please access the full dashboard.\n`;
    text += `\nHave a wonderful day!\n❤️ The Dashboard Team`;

    return text;
  }
  
  /**
   * Format summary data for email
   */
  formatSummaryForEmail(summaryData) {
    const { totalOrders, totalPizzas, totalDrinks, totalCost, categories, timeRange } = summaryData;
    
    let text = `INVENTORY USAGE SUMMARY\n`;
    text += `Report Period: ${timeRange}\n`;
    text += `Generated: ${new Date().toLocaleDateString('en-ZA')}\n\n`;
    text += `OVERVIEW:\n`;
    text += `• Total Orders: ${totalOrders}\n`;
    text += `• Total Pizzas: ${totalPizzas}\n`;
    text += `• Total Cold Drinks: ${totalDrinks}\n`;
    text += `• Total Ingredient Cost: R${totalCost.toFixed(2)}\n\n`;

    text += `COST BY CATEGORY:\n`;
    Object.entries(categories)
      .sort(([,a], [,b]) => b.totalCost - a.totalCost)
      .forEach(([category, data]) => {
        text += `• ${category.replace(/_/g, ' ').toUpperCase()}: R${data.totalCost.toFixed(2)}\n`;
      });

    text += `\n---\nThis report was automatically generated by John Dough's Pizza Dashboard.\n`;
    text += `For detailed analysis, please access the full dashboard.`;

    return text;
  }

  /**
   * Format low stock alert for email
   */
  formatLowStockAlert(lowStockItems) {
    let text = `LOW STOCK ALERT!\n\n`;
    text += `The following ingredients are running low and need to be reordered:\n\n`;
    
    lowStockItems.forEach(item => {
      text += `⚠️  ${item.name.replace(/_/g, ' ').toUpperCase()}\n`;
      text += `   Current Stock: ${item.amount} ${item.unit}\n`;
      text += `   Minimum Threshold: ${item.threshold} ${item.unit}\n\n`;
    });

    text += `Please place orders for these items as soon as possible to avoid stock-outs.\n\n`;
    text += `This alert was automatically generated by John Dough's Pizza Dashboard.`;

    return text;
  }

  /**
   * Development alert when EmailJS is not configured
   */
  showDevelopmentAlert(reportData, recipientEmail) {
    // Check if it's daily stock report or regular summary
    const isStockReport = reportData.hasOwnProperty('startingStockValue');
    const summary = isStockReport ? 
      this.formatDailyStockReport(reportData) : 
      this.formatSummaryForEmail(reportData);
    const reportType = isStockReport ? 'Daily Stock Report' : 'Usage Summary';
    
    alert(`${reportType} would be sent to: ${recipientEmail}\n\nReport:\n${summary.substring(0, 400)}...\n\nTo enable email functionality, configure EmailJS in your environment variables.`);
  }
  
  /**
   * Calculate daily stock report data
   * @param {Object} currentInventory - Current inventory levels
   * @param {Object} yesterdayInventory - Yesterday's inventory levels (if available)
   * @param {Array} todayOrders - Today's orders for usage calculation
   * @param {Array} stockChanges - Manual stock changes made today
   */
  calculateDailyStockReport(currentInventory, yesterdayInventory = {}, todayOrders = [], stockChanges = []) {
    // Calculate starting and ending stock values
    let startingStockValue = 0;
    let endingStockValue = 0;
    let totalUsageCost = 0;
    const ingredientChanges = {};
    const lowStockItems = [];
    const topUsedIngredients = [];
    
    // Get ingredients database for cost calculations
    import('../data/ingredients').then(({ PIZZA_INGREDIENTS }) => {
      Object.entries(currentInventory).forEach(([ingredient, currentData]) => {
        const yesterdayAmount = yesterdayInventory[ingredient]?.amount || currentData.amount;
        const currentAmount = currentData.amount;
        
        // Find cost per unit
        let costPerUnit = 0;
        if (PIZZA_INGREDIENTS.base[ingredient]) {
          costPerUnit = PIZZA_INGREDIENTS.base[ingredient].cost || 0;
        } else {
          // Check pizza-specific ingredients
          for (const pizza of Object.values(PIZZA_INGREDIENTS.pizzas)) {
            if (pizza.ingredients && pizza.ingredients[ingredient]) {
              costPerUnit = pizza.ingredients[ingredient].cost || 0;
              break;
            }
          }
          // Check cold drink ingredients
          if (costPerUnit === 0 && PIZZA_INGREDIENTS.coldDrinks) {
            for (const drink of Object.values(PIZZA_INGREDIENTS.coldDrinks)) {
              if (drink.ingredients && drink.ingredients[ingredient]) {
                costPerUnit = drink.ingredients[ingredient].cost || 0;
                break;
              }
            }
          }
        }
        
        startingStockValue += yesterdayAmount * costPerUnit;
        endingStockValue += currentAmount * costPerUnit;
        
        const usageAmount = Math.max(0, yesterdayAmount - currentAmount);
        if (usageAmount > 0) {
          totalUsageCost += usageAmount * costPerUnit;
          topUsedIngredients.push({
            name: ingredient,
            used: usageAmount,
            unit: currentData.unit,
            cost: usageAmount * costPerUnit
          });
        }
        
        ingredientChanges[ingredient] = {
          yesterday: yesterdayAmount,
          today: currentAmount,
          change: currentAmount - yesterdayAmount,
          unit: currentData.unit
        };
        
        // Check for low stock
        if (currentAmount <= (currentData.threshold || 0)) {
          lowStockItems.push({
            name: ingredient,
            amount: currentAmount,
            threshold: currentData.threshold || 0,
            unit: currentData.unit
          });
        }
      });
    });
    
    // Calculate efficiency score (simple metric: less waste = higher score)
    const expectedUsage = totalUsageCost;
    const actualStockChange = Math.abs(endingStockValue - startingStockValue);
    const efficiencyScore = Math.max(0, Math.min(100, 
      100 - Math.abs((actualStockChange - expectedUsage) / Math.max(expectedUsage, 1)) * 100
    ));
    
    // Sort top used ingredients
    topUsedIngredients.sort((a, b) => b.used - a.used);
    
    // Process today's orders for context
    const ordersToday = todayOrders.length;
    const pizzasToday = todayOrders.reduce((sum, order) => 
      sum + (order.pizzas ? order.pizzas.reduce((pSum, pizza) => pSum + (pizza.quantity || 1), 0) : 0), 0);
    const drinksToday = todayOrders.reduce((sum, order) => 
      sum + (order.coldDrinks ? order.coldDrinks.reduce((dSum, drink) => dSum + (drink.quantity || 1), 0) : 0), 0);
    
    // Filter stock changes to only show today's manual adjustments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const stockChangesSummary = stockChanges.filter(change => {
      const changeDate = new Date(change.timestamp);
      return changeDate >= today && change.changeType !== 'usage_deduction';
    }).map(change => ({
      ingredient: change.ingredient,
      difference: change.difference,
      changeType: change.changeType,
      unit: currentInventory[change.ingredient]?.unit || 'units'
    }));
    
    return {
      startingStockValue: Math.round(startingStockValue * 100) / 100,
      endingStockValue: Math.round(endingStockValue * 100) / 100,
      totalUsageCost: Math.round(totalUsageCost * 100) / 100,
      ingredientChanges,
      lowStockItems,
      efficiencyScore: Math.round(efficiencyScore),
      topUsedIngredients,
      stockChangesSummary,
      ordersToday,
      pizzasToday,
      drinksToday
    };
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(testEmail) {
    if (this.publicKey === 'your_public_key_here') {
      return { success: false, message: 'EmailJS not configured' };
    }

    try {
      const response = await emailjs.send(
        this.serviceId,
        'test_template',
        {
          to_email: testEmail,
          from_name: "John Dough's Pizza Dashboard",
          subject: 'Test Email Configuration',
          message: 'This is a test email to verify your email configuration is working correctly.'
        }
      );

      return { success: true, response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const emailNotificationService = new EmailNotificationService();

export default emailNotificationService;