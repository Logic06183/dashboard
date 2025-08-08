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
  showDevelopmentAlert(summaryData, recipientEmail) {
    const summary = this.formatSummaryForEmail(summaryData);
    alert(`Email would be sent to: ${recipientEmail}\n\nSummary:\n${summary.substring(0, 300)}...\n\nTo enable email functionality, configure EmailJS in your environment variables.`);
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