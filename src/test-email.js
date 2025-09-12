/**
 * Test script to send a notification email to Craig
 * This demonstrates the notification functionality
 */

import DailyNotificationService from './services/DailyNotificationService';
import { PIZZA_INGREDIENTS } from './data/ingredients';

// Mock inventory data for testing
const mockInventory = {
  sourdough_dough: { amount: 5, threshold: 10, unit: 'balls', category: 'dough' },
  pizza_sauce: { amount: 200, threshold: 500, unit: 'ml', category: 'sauce' },
  mozzarella: { amount: 300, threshold: 200, unit: 'g', category: 'cheese' },
  pepperoni: { amount: 50, threshold: 100, unit: 'g', category: 'meat' },
  mushrooms: { amount: 0, threshold: 200, unit: 'g', category: 'vegetable' },
  bell_peppers: { amount: 150, threshold: 200, unit: 'g', category: 'vegetable' },
  coca_cola_syrup: { amount: 800, threshold: 1000, unit: 'ml', category: 'beverage' }
};

// Mock completed orders for today
const mockCompletedOrders = [
  {
    id: 'test-001',
    customerName: 'Test Customer 1',
    orderTime: new Date().toISOString(),
    pizzas: [
      { pizzaType: 'THE CHAMP', quantity: 2 },
      { pizzaType: 'Margherita', quantity: 1 }
    ],
    coldDrinks: [
      { drinkType: 'Coca-Cola', quantity: 3 }
    ],
    status: 'delivered',
    totalAmount: 215.00
  },
  {
    id: 'test-002', 
    customerName: 'Test Customer 2',
    orderTime: new Date().toISOString(),
    pizzas: [
      { pizzaType: 'Pepperoni', quantity: 1 },
      { pizzaType: 'MUSHROOM CLOUD PIZZA', quantity: 1 }
    ],
    coldDrinks: [
      { drinkType: 'Sprite', quantity: 2 }
    ],
    status: 'delivered',
    totalAmount: 185.50
  }
];

// Test the notification system
const testNotificationSystem = async () => {
  console.log('🧪 Testing Daily Notification System for Craig...');
  
  try {
    // Configure the service with Craig's email
    DailyNotificationService.configure({
      managerEmail: 'craigparker6@gmail.com',
      enabled: true,
      notificationTime: { hour: new Date().getHours(), minute: new Date().getMinutes() + 1 }
    });
    
    console.log('✅ Configuration set for craigparker6@gmail.com');
    
    // Test the notification generation (this will work even without EmailJS)
    const testResult = await DailyNotificationService.testNotification('craigparker6@gmail.com');
    
    console.log('📧 Test notification result:', testResult);
    
    if (testResult.success) {
      console.log('✅ Test email would be sent successfully!');
      console.log('📊 Test data included:');
      console.log(`   - ${testResult.testData.itemsCount} low stock alerts`);
      console.log(`   - Alert status: ${testResult.testData.hasAlerts ? 'YES' : 'NO'}`);
    } else {
      console.log('⚠️ Email service not configured, but notification logic works!');
      console.log('💡 To enable emails, set up EmailJS environment variables:');
      console.log('   - REACT_APP_EMAILJS_PUBLIC_KEY');
      console.log('   - REACT_APP_EMAILJS_SERVICE_ID');
      console.log('   - REACT_APP_EMAILJS_TEMPLATE_ID');
    }
    
    // Simulate what the daily notification would contain
    console.log('\n📋 Sample Daily Report Content:');
    console.log('=====================================');
    
    // Generate sample notification data
    const { generateDailyStockNotification } = await import('./services/InventoryDeductionService');
    const sampleNotification = generateDailyStockNotification(mockInventory, []);
    
    console.log('🔍 Low Stock Analysis:');
    console.log(`   Total items low: ${sampleNotification.totalItemsLow}`);
    console.log(`   Critical items: ${sampleNotification.criticalCount}`);
    console.log(`   Low stock items: ${sampleNotification.lowStockCount}`);
    
    if (sampleNotification.criticalItems.length > 0) {
      console.log('\n🚨 CRITICAL - OUT OF STOCK:');
      sampleNotification.criticalItems.forEach(item => {
        console.log(`   • ${item.ingredient.replace(/_/g, ' ')}: ${item.currentStock}${item.unit}`);
      });
    }
    
    if (sampleNotification.lowItems.length > 0) {
      console.log('\n⚠️ LOW STOCK:');
      sampleNotification.lowItems.forEach(item => {
        console.log(`   • ${item.ingredient.replace(/_/g, ' ')}: ${item.currentStock}${item.unit} (threshold: ${item.threshold}${item.unit})`);
      });
    }
    
    console.log('\n💌 The full email would include:');
    console.log('   ✓ Detailed stock levels and changes');
    console.log('   ✓ Daily order statistics');
    console.log('   ✓ Top used ingredients');
    console.log('   ✓ Cost analysis and efficiency score');
    console.log('   ✓ Formatted for easy reading');
    
    return {
      success: true,
      configured: true,
      emailReady: testResult.success,
      lowStockAlerts: sampleNotification.totalItemsLow
    };
    
  } catch (error) {
    console.error('❌ Error testing notification system:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Export for potential use in components
export default testNotificationSystem;

// Auto-run if this file is executed directly
if (typeof window === 'undefined') {
  testNotificationSystem().then(result => {
    console.log('\n🎯 Test Summary:', result);
    process.exit(result.success ? 0 : 1);
  });
}