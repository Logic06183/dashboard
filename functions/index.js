/**
 * Firebase Cloud Functions for John Dough's Delivery Platform Integration
 *
 * This file contains webhook endpoints to receive orders from:
 * - Uber Eats
 * - Mr. D Food
 *
 * Orders are automatically parsed, validated, and saved to Firebase Realtime Database
 * where they appear in the dashboard immediately.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const config = require('./config');
const { parseUberEatsOrder, parseMrDFoodOrder, validateOrder } = require('./orderParsers');

// Initialize Firebase Admin
admin.initializeApp();
const database = admin.database();

// ========================================
// UBER EATS WEBHOOK ENDPOINT
// ========================================

/**
 * Receive order webhooks from Uber Eats
 *
 * URL: https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/receiveUberEatsOrder
 *
 * Uber Eats will POST order data to this endpoint when:
 * - New order is placed
 * - Order is updated
 * - Order is cancelled
 */
exports.receiveUberEatsOrder = functions.https.onRequest(async (req, res) => {
  // Check if Uber Eats integration is enabled
  if (!config.uberEats.enabled) {
    console.log('Uber Eats integration is disabled in config');
    return res.status(503).json({
      error: 'Uber Eats integration not enabled',
      message: 'Please enable in functions/config.js and redeploy'
    });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookData = req.body;

    // Log incoming webhook for debugging
    if (config.settings.debugMode) {
      console.log('Uber Eats webhook received:', JSON.stringify(webhookData, null, 2));
      await logPlatformRequest('uber_eats', webhookData);
    }

    // Verify webhook signature (security check)
    const signature = req.headers['x-uber-signature'];
    if (config.uberEats.webhookSecret && signature) {
      const isValid = verifyUberEatsSignature(signature, req.body, config.uberEats.webhookSecret);
      if (!isValid) {
        console.error('Invalid Uber Eats webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Handle different event types
    const eventType = webhookData.event_type || webhookData.type;

    if (eventType === 'orders.notification' || eventType === 'order.created') {
      // New order received
      const order = parseUberEatsOrder(webhookData);

      if (!validateOrder(order)) {
        console.error('Order validation failed');
        return res.status(400).json({ error: 'Invalid order data' });
      }

      // Save to Firebase
      const orderRef = await database.ref(config.firebase.ordersPath).push(order);
      console.log(`✅ Uber Eats order saved: ${orderRef.key}`);

      // Acknowledge receipt to Uber (must respond within 11.5 minutes)
      return res.status(200).json({
        status: 'accepted',
        orderId: orderRef.key,
        message: 'Order received and saved'
      });

    } else if (eventType === 'orders.cancel') {
      // Order cancelled
      console.log('Uber Eats order cancelled:', webhookData.order_id);

      // Find and update order in Firebase
      const ordersSnapshot = await database.ref(config.firebase.ordersPath)
        .orderByChild('platformOrderId')
        .equalTo(webhookData.order_id)
        .once('value');

      if (ordersSnapshot.exists()) {
        const updates = {};
        ordersSnapshot.forEach(child => {
          updates[`${child.key}/status`] = 'cancelled';
          updates[`${child.key}/cancelledAt`] = new Date().toISOString();
          updates[`${child.key}/cancellationReason`] = webhookData.cancellation_reason || 'Unknown';
        });
        await database.ref(config.firebase.ordersPath).update(updates);
      }

      return res.status(200).json({ status: 'acknowledged' });

    } else {
      console.log(`Unhandled Uber Eats event type: ${eventType}`);
      return res.status(200).json({ status: 'acknowledged' });
    }

  } catch (error) {
    console.error('Error processing Uber Eats webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// ========================================
// MR. D FOOD WEBHOOK ENDPOINT
// ========================================

/**
 * Receive order webhooks from Mr. D Food
 *
 * URL: https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/receiveMrDFoodOrder
 */
exports.receiveMrDFoodOrder = functions.https.onRequest(async (req, res) => {
  // Check if Mr. D integration is enabled
  if (!config.mrDFood.enabled) {
    console.log('Mr. D Food integration is disabled in config');
    return res.status(503).json({
      error: 'Mr. D Food integration not enabled',
      message: 'Please enable in functions/config.js and redeploy'
    });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookData = req.body;

    // Log incoming webhook for debugging
    if (config.settings.debugMode) {
      console.log('Mr. D Food webhook received:', JSON.stringify(webhookData, null, 2));
      await logPlatformRequest('mrd_food', webhookData);
    }

    // Verify webhook signature if available
    const signature = req.headers['x-mrd-signature'] || req.headers['authorization'];
    if (config.mrDFood.webhookSecret && signature) {
      const isValid = verifyMrDFoodSignature(signature, req.body, config.mrDFood.webhookSecret);
      if (!isValid) {
        console.error('Invalid Mr. D Food webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    // Parse order
    const order = parseMrDFoodOrder(webhookData);

    if (!validateOrder(order)) {
      console.error('Order validation failed');
      return res.status(400).json({ error: 'Invalid order data' });
    }

    // Save to Firebase
    const orderRef = await database.ref(config.firebase.ordersPath).push(order);
    console.log(`✅ Mr. D Food order saved: ${orderRef.key}`);

    // Acknowledge receipt
    return res.status(200).json({
      status: 'accepted',
      orderId: orderRef.key,
      message: 'Order received and saved'
    });

  } catch (error) {
    console.error('Error processing Mr. D Food webhook:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Verify Uber Eats webhook signature
 * This ensures the webhook is actually from Uber and not a malicious actor
 */
function verifyUberEatsSignature(signature, payload, secret) {
  // TODO: Implement actual Uber Eats signature verification
  // See: https://developer.uber.com/docs/eats/guides/webhooks#webhook-security
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = hmac.digest('hex');
  return signature === expectedSignature;
}

/**
 * Verify Mr. D Food webhook signature
 */
function verifyMrDFoodSignature(signature, payload, secret) {
  // TODO: Implement based on Mr. D Food's signature method
  // (Contact Mr. D support for their signature verification method)
  return true; // Placeholder - implement actual verification
}

/**
 * Log platform requests for debugging and monitoring
 */
async function logPlatformRequest(platform, data) {
  try {
    await database.ref(config.firebase.logsPath).push({
      platform: platform,
      timestamp: new Date().toISOString(),
      data: JSON.stringify(data),
      type: 'webhook_received'
    });
  } catch (error) {
    console.error('Failed to log platform request:', error);
  }
}

// ========================================
// HEALTH CHECK ENDPOINT
// ========================================

/**
 * Simple health check to verify functions are deployed
 * URL: https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/healthCheck
 */
exports.healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'John Dough\'s delivery integration is running',
    timestamp: new Date().toISOString(),
    integrations: {
      uberEats: {
        enabled: config.uberEats.enabled,
        configured: config.uberEats.restaurantId !== 'YOUR_UBER_EATS_RESTAURANT_ID'
      },
      mrDFood: {
        enabled: config.mrDFood.enabled,
        configured: config.mrDFood.storeId !== 'YOUR_MRD_STORE_ID'
      }
    }
  });
});
