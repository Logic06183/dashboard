/**
 * Email Demo - Shows what the daily notification would contain
 * Run this to see the exact content that would be sent to Craig & Parker
 */

// Mock data representing current inventory state
const mockCurrentInventory = {
  sourdough_dough: { amount: 5, threshold: 10, unit: 'balls', category: 'dough' },
  pizza_sauce: { amount: 200, threshold: 500, unit: 'ml', category: 'sauce' },
  mozzarella: { amount: 300, threshold: 200, unit: 'g', category: 'cheese' },
  pepperoni: { amount: 50, threshold: 100, unit: 'g', category: 'meat' },
  mushrooms: { amount: 0, threshold: 200, unit: 'g', category: 'vegetable' },
  bell_peppers: { amount: 0, threshold: 200, unit: 'g', category: 'vegetable' },
  red_onions: { amount: 75, threshold: 150, unit: 'g', category: 'vegetable' },
  ham: { amount: 180, threshold: 200, unit: 'g', category: 'meat' },
  chicken: { amount: 250, threshold: 300, unit: 'g', category: 'meat' },
  coca_cola_syrup: { amount: 800, threshold: 1000, unit: 'ml', category: 'beverage' },
  sprite_syrup: { amount: 600, threshold: 1000, unit: 'ml', category: 'beverage' }
};

// Mock today's completed orders
const mockCompletedOrders = [
  {
    id: 'order-001',
    customerName: 'Sarah Johnson',
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
    id: 'order-002',
    customerName: 'Mike Roberts', 
    orderTime: new Date().toISOString(),
    pizzas: [
      { pizzaType: 'MUSHROOM CLOUD PIZZA', quantity: 1 },
      { pizzaType: 'Pepperoni', quantity: 2 }
    ],
    coldDrinks: [
      { drinkType: 'Sprite', quantity: 2 }
    ],
    status: 'delivered',
    totalAmount: 185.50
  },
  {
    id: 'order-003',
    customerName: 'Lisa Chen',
    orderTime: new Date().toISOString(),
    pizzas: [
      { pizzaType: 'Hawaiian', quantity: 1 },
      { pizzaType: 'SOURDOUGH SPECIAL', quantity: 1 }
    ],
    coldDrinks: [
      { drinkType: 'Coca-Cola', quantity: 1 },
      { drinkType: 'Sprite', quantity: 1 }
    ],
    status: 'delivered',
    totalAmount: 195.00
  }
];

// Function to generate the demo notification
function generateDemoNotification() {
  console.log('\n🎯 DAILY STOCK NOTIFICATION DEMO');
  console.log('='.repeat(50));
  console.log('📧 Recipients: craigparker6@gmail.com, parkerjaneandcourt@gmail.com');
  console.log('🏪 John Dough\'s Sourdough Pizzeria');
  console.log('📍 Linden, Johannesburg, South Africa');
  console.log('📅 Date:', new Date().toLocaleDateString('en-ZA'));
  console.log('⏰ Time: 22:00 SAST');
  console.log('\n');

  // Analyze inventory for low stock
  const lowStockItems = [];
  const criticalItems = [];
  let totalStockValue = 0;
  
  Object.entries(mockCurrentInventory).forEach(([ingredient, data]) => {
    const estimatedCost = getEstimatedCost(ingredient);
    totalStockValue += data.amount * estimatedCost;
    
    if (data.amount === 0) {
      criticalItems.push({
        ingredient,
        amount: data.amount,
        threshold: data.threshold,
        unit: data.unit
      });
    } else if (data.amount <= data.threshold) {
      lowStockItems.push({
        ingredient,
        amount: data.amount,
        threshold: data.threshold,
        unit: data.unit
      });
    }
  });

  // Critical alerts
  if (criticalItems.length > 0) {
    console.log('🚨 CRITICAL - OUT OF STOCK (' + criticalItems.length + ' items):');
    criticalItems.forEach(item => {
      console.log(`   • ${formatIngredientName(item.ingredient)}: ${item.amount}${item.unit} (REORDER IMMEDIATELY)`);
    });
    console.log();
  }

  // Low stock alerts  
  if (lowStockItems.length > 0) {
    console.log('⚠️  LOW STOCK (' + lowStockItems.length + ' items):');
    lowStockItems.forEach(item => {
      console.log(`   • ${formatIngredientName(item.ingredient)}: ${item.amount}${item.unit} (threshold: ${item.threshold}${item.unit})`);
    });
    console.log();
  }

  // Daily performance
  console.log('📈 TODAY\'S PERFORMANCE:');
  console.log('   • Orders processed:', mockCompletedOrders.length);
  console.log('   • Total pizzas made:', mockCompletedOrders.reduce((sum, order) => 
    sum + (order.pizzas ? order.pizzas.reduce((pSum, pizza) => pSum + pizza.quantity, 0) : 0), 0));
  console.log('   • Total drinks served:', mockCompletedOrders.reduce((sum, order) => 
    sum + (order.coldDrinks ? order.coldDrinks.reduce((dSum, drink) => dSum + drink.quantity, 0) : 0), 0));
  console.log('   • Total revenue: R' + mockCompletedOrders.reduce((sum, order) => sum + order.totalAmount, 0).toFixed(2));
  console.log('   • Average order value: R' + (mockCompletedOrders.reduce((sum, order) => sum + order.totalAmount, 0) / mockCompletedOrders.length).toFixed(2));
  console.log('   • Current stock value: R' + totalStockValue.toFixed(2));
  console.log();

  // Shopping recommendations
  console.log('🛒 SHOPPING LIST FOR TOMORROW:');
  if (criticalItems.length > 0) {
    console.log('   🔴 URGENT - OUT OF STOCK:');
    criticalItems.forEach(item => {
      console.log(`      • ${formatIngredientName(item.ingredient)} - Need minimum ${getRecommendedOrder(item.ingredient)}`);
    });
  }
  if (lowStockItems.length > 0) {
    console.log('   🟡 LOW STOCK - REORDER SOON:');
    lowStockItems.forEach(item => {
      console.log(`      • ${formatIngredientName(item.ingredient)} - Current: ${item.amount}${item.unit}, Need: ${getRecommendedOrder(item.ingredient)}`);
    });
  }
  console.log();

  // Top used ingredients (mock data)
  console.log('🏆 TOP USED INGREDIENTS TODAY:');
  const topUsed = [
    { name: 'Mozzarella', used: 2914, unit: 'g', cost: 58.28 },
    { name: 'Sourdough Dough', used: 31, unit: 'balls', cost: 77.50 },
    { name: 'Pizza Sauce', used: 1860, unit: 'ml', cost: 9.30 },
    { name: 'Pepperoni', used: 1184, unit: 'g', cost: 14.21 },
    { name: 'Red Onions', used: 248, unit: 'g', cost: 1.24 }
  ];
  
  topUsed.forEach((item, index) => {
    console.log(`   ${index + 1}. ${item.name}: ${item.used}${item.unit} (R${item.cost})`);
  });
  console.log();

  // Final summary
  const totalAlerts = criticalItems.length + lowStockItems.length;
  const efficiencyScore = Math.max(50, 95 - (totalAlerts * 5));
  
  console.log('📊 SUMMARY:');
  console.log('   • Total alerts:', totalAlerts);
  console.log('   • Critical items:', criticalItems.length);
  console.log('   • Low stock items:', lowStockItems.length);
  console.log('   • Efficiency score:', efficiencyScore + '%');
  console.log('   • Daily usage cost: R158.25');
  console.log();

  console.log('💡 RECOMMENDATIONS:');
  if (criticalItems.length > 0) {
    console.log('   🔥 IMMEDIATE ACTION: We\'re completely out of ' + criticalItems.length + ' items!');
  }
  console.log('   📦 Consider bulk ordering for better prices');
  console.log('   🎯 High mozzarella usage indicates cheese pizzas are popular');
  console.log('   📈 Weekend prep: increase dough ball preparation');
  console.log();

  console.log('🤖 This email would be automatically sent to:');
  console.log('   📧 craigparker6@gmail.com');
  console.log('   📧 parkerjaneandcourt@gmail.com');
  console.log();
  console.log('🔗 Dashboard URL: https://pizza-dashboard-92057.web.app');
  console.log('⏰ Next notification: Tomorrow at 22:00 SAST');
  console.log('\n' + '='.repeat(50));
  console.log('✅ Notification demo completed!');
  
  return {
    totalAlerts,
    criticalItems: criticalItems.length,
    lowStockItems: lowStockItems.length,
    recipients: ['craigparker6@gmail.com', 'parkerjaneandcourt@gmail.com'],
    efficiencyScore
  };
}

// Helper functions
function formatIngredientName(ingredient) {
  return ingredient.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getEstimatedCost(ingredient) {
  const costs = {
    sourdough_dough: 2.50,
    pizza_sauce: 0.005, // per ml
    mozzarella: 0.02, // per gram
    pepperoni: 0.012,
    mushrooms: 0.008,
    bell_peppers: 0.006,
    red_onions: 0.003,
    ham: 0.011,
    chicken: 0.015,
    coca_cola_syrup: 0.015,
    sprite_syrup: 0.015
  };
  return costs[ingredient] || 0.01;
}

function getRecommendedOrder(ingredient) {
  const recommendations = {
    sourdough_dough: '20+ balls',
    pizza_sauce: '2 liters',
    mozzarella: '2kg',
    pepperoni: '1kg', 
    mushrooms: '1kg',
    bell_peppers: '1kg',
    red_onions: '500g',
    ham: '1kg',
    chicken: '1kg',
    coca_cola_syrup: '2 liters',
    sprite_syrup: '2 liters'
  };
  return recommendations[ingredient] || '1kg';
}

// Run the demo
if (typeof window === 'undefined') {
  // Node.js environment
  const result = generateDemoNotification();
  console.log('\n📋 Demo completed with', result.totalAlerts, 'total alerts');
  process.exit(0);
} else {
  // Browser environment
  console.log('Run this in Node.js or check the browser console');
}

// Export for use
export default generateDemoNotification;