/**
 * Order Parsers
 *
 * Transform platform-specific order formats into our standard order structure
 */

const { mapPizzaName, mapBeverageName } = require('./platformMapping');

/**
 * Parse Uber Eats order webhook payload
 * @param {Object} uberOrder - Raw order data from Uber Eats webhook
 * @returns {Object} - Standardized order object for Firebase
 */
function parseUberEatsOrder(uberOrder) {
  console.log('Parsing Uber Eats order:', uberOrder.id);

  // Parse pizzas and items from cart
  const pizzas = [];
  const beverages = [];
  let totalAmount = 0;

  if (uberOrder.cart && uberOrder.cart.items) {
    uberOrder.cart.items.forEach(item => {
      const itemName = item.title || item.name;
      const quantity = item.quantity || 1;
      const price = item.price ? item.price.total / 100 : 0; // Convert cents to rands

      // Try to map as pizza
      const pizzaType = mapPizzaName('Uber Eats', itemName);
      if (pizzaType) {
        pizzas.push({
          pizzaType: pizzaType,
          quantity: quantity,
          size: item.size || 'Regular',
          customizations: item.selected_modifier_groups || [],
          specialInstructions: item.special_instructions || '',
          isCooked: false
        });
        totalAmount += price;
        return;
      }

      // Try to map as beverage
      const beverageType = mapBeverageName(itemName);
      if (beverageType) {
        beverages.push({
          name: beverageType,
          quantity: quantity
        });
        totalAmount += price;
        return;
      }

      // Unknown item - log warning but include it
      console.warn(`Unknown item from Uber Eats: ${itemName}`);
      pizzas.push({
        pizzaType: itemName, // Use raw name
        quantity: quantity,
        size: 'Regular',
        customizations: [],
        specialInstructions: `Unknown item: ${itemName}`,
        isCooked: false
      });
      totalAmount += price;
    });
  }

  // If cart total is available, use that instead
  if (uberOrder.payment && uberOrder.payment.charges) {
    const total = uberOrder.payment.charges.total;
    if (total) {
      totalAmount = total / 100; // Convert cents to rands
    }
  }

  // Build standard order object
  const order = {
    // Platform info
    platform: 'Uber Eats',
    platformOrderId: uberOrder.id,
    externalId: uberOrder.external_reference_id || uberOrder.id,

    // Customer info
    customerName: uberOrder.eater
      ? `${uberOrder.eater.first_name || ''} ${uberOrder.eater.last_name || ''}`.trim()
      : 'Uber Eats Customer',
    phoneNumber: uberOrder.eater?.phone_number || uberOrder.eater?.phone || '',

    // Order details
    orderTime: uberOrder.placed_at
      ? new Date(uberOrder.placed_at).toISOString()
      : new Date().toISOString(),
    pizzas: pizzas,
    beverages: beverages.length > 0 ? beverages : undefined,
    totalAmount: totalAmount,

    // Delivery info
    deliveryType: uberOrder.type === 'PICK_UP' ? 'pickup' : 'delivery',
    deliveryAddress: uberOrder.delivery?.location?.address || 'Pickup',
    deliveryInstructions: uberOrder.delivery?.notes || '',

    // Order status
    status: 'pending',
    estimatedPrepTime: uberOrder.estimated_ready_for_pickup_at
      ? Math.round((new Date(uberOrder.estimated_ready_for_pickup_at) - new Date()) / 60000)
      : 20, // Default 20 minutes

    // Special requests
    specialInstructions: uberOrder.special_instructions || '',

    // Metadata
    createdAt: new Date().toISOString(),
    source: 'uber_eats_webhook',
    rawData: JSON.stringify(uberOrder) // Store raw data for debugging
  };

  return order;
}

/**
 * Parse Mr. D Food order webhook payload
 * @param {Object} mrdOrder - Raw order data from Mr. D Food webhook
 * @returns {Object} - Standardized order object for Firebase
 */
function parseMrDFoodOrder(mrdOrder) {
  console.log('Parsing Mr. D Food order:', mrdOrder.id || mrdOrder.orderId);

  // Mr. D Food format may vary - adjust based on actual webhook payload
  const pizzas = [];
  const beverages = [];
  let totalAmount = 0;

  // Parse items (adjust field names based on actual Mr. D webhook structure)
  const items = mrdOrder.items || mrdOrder.orderItems || [];

  items.forEach(item => {
    const itemName = item.name || item.itemName || item.title;
    const quantity = item.quantity || item.qty || 1;
    const price = item.price || item.totalPrice || 0;

    // Try to map as pizza
    const pizzaType = mapPizzaName('Mr D Food', itemName);
    if (pizzaType) {
      pizzas.push({
        pizzaType: pizzaType,
        quantity: quantity,
        size: item.size || 'Regular',
        customizations: item.modifiers || item.extras || [],
        specialInstructions: item.notes || item.specialInstructions || '',
        isCooked: false
      });
      totalAmount += price * quantity;
      return;
    }

    // Try to map as beverage
    const beverageType = mapBeverageName(itemName);
    if (beverageType) {
      beverages.push({
        name: beverageType,
        quantity: quantity
      });
      totalAmount += price * quantity;
      return;
    }

    // Unknown item
    console.warn(`Unknown item from Mr. D Food: ${itemName}`);
    pizzas.push({
      pizzaType: itemName,
      quantity: quantity,
      size: 'Regular',
      customizations: [],
      specialInstructions: `Unknown item: ${itemName}`,
      isCooked: false
    });
    totalAmount += price * quantity;
  });

  // Use order total if available
  if (mrdOrder.total || mrdOrder.totalAmount) {
    totalAmount = mrdOrder.total || mrdOrder.totalAmount;
  }

  // Build standard order object
  const order = {
    // Platform info
    platform: 'Mr D Food',
    platformOrderId: mrdOrder.id || mrdOrder.orderId || mrdOrder.orderNumber,
    externalId: mrdOrder.referenceNumber || mrdOrder.id,

    // Customer info
    customerName: mrdOrder.customer?.name || mrdOrder.customerName || 'Mr D Customer',
    phoneNumber: mrdOrder.customer?.phone || mrdOrder.customerPhone || '',

    // Order details
    orderTime: mrdOrder.createdAt || mrdOrder.orderTime || new Date().toISOString(),
    pizzas: pizzas,
    beverages: beverages.length > 0 ? beverages : undefined,
    totalAmount: totalAmount,

    // Delivery info
    deliveryType: mrdOrder.deliveryType === 'collection' ? 'pickup' : 'delivery',
    deliveryAddress: mrdOrder.deliveryAddress?.fullAddress || mrdOrder.address || 'Pickup',
    deliveryInstructions: mrdOrder.deliveryInstructions || '',

    // Order status
    status: 'pending',
    estimatedPrepTime: mrdOrder.estimatedPrepTime || 20,

    // Special requests
    specialInstructions: mrdOrder.specialInstructions || mrdOrder.notes || '',

    // Metadata
    createdAt: new Date().toISOString(),
    source: 'mrd_food_webhook',
    rawData: JSON.stringify(mrdOrder)
  };

  return order;
}

/**
 * Validate parsed order has required fields
 * @param {Object} order - Parsed order object
 * @returns {boolean} - True if valid
 */
function validateOrder(order) {
  const required = ['platform', 'customerName', 'orderTime', 'pizzas', 'status'];

  for (const field of required) {
    if (!order[field]) {
      console.error(`Order validation failed: missing ${field}`);
      return false;
    }
  }

  if (!Array.isArray(order.pizzas) || order.pizzas.length === 0) {
    console.error('Order validation failed: no pizzas');
    return false;
  }

  return true;
}

module.exports = {
  parseUberEatsOrder,
  parseMrDFoodOrder,
  validateOrder
};
