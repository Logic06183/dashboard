/**
 * Configuration for Delivery Platform Integration
 *
 * SETUP INSTRUCTIONS:
 * 1. Get API credentials from your brother who set up Uber Eats and Mr. D Food
 * 2. Replace the placeholder values below with actual credentials
 * 3. Deploy the functions: npm run deploy
 *
 * WHAT YOU NEED FROM UBER EATS:
 * - Restaurant ID (your unique store identifier)
 * - Client ID (from Uber Developer Dashboard)
 * - Client Secret (from Uber Developer Dashboard)
 * - Webhook signing secret (for verifying webhook authenticity)
 *
 * WHERE TO GET UBER EATS CREDENTIALS:
 * 1. Go to: https://developer.uber.com/
 * 2. Sign in with restaurant partner account
 * 3. Navigate to: Dashboard > Apps > Your App
 * 4. Find credentials under "Settings" and "Webhooks"
 *
 * WHAT YOU NEED FROM MR. D FOOD:
 * - API Key or Partner Token
 * - Restaurant/Store ID
 * - Webhook secret (if available)
 *
 * WHERE TO GET MR. D FOOD CREDENTIALS:
 * Contact Mr. D Food partner support:
 * - Email: partnersupport@mrd.co.za (check your partner emails for correct contact)
 * - Or through your restaurant partner portal
 * - Request: "API access for POS integration"
 */

module.exports = {
  // ========================
  // UBER EATS CONFIGURATION
  // ========================
  uberEats: {
    // Set to true once you have credentials and want to activate
    enabled: false,

    // Your restaurant's unique ID on Uber Eats
    restaurantId: 'YOUR_UBER_EATS_RESTAURANT_ID',

    // OAuth credentials from Uber Developer Dashboard
    clientId: 'YOUR_UBER_EATS_CLIENT_ID',
    clientSecret: 'YOUR_UBER_EATS_CLIENT_SECRET',

    // Webhook signing secret (for security verification)
    webhookSecret: 'YOUR_UBER_EATS_WEBHOOK_SECRET',

    // API base URL (usually production, but can use sandbox for testing)
    apiUrl: 'https://api.uber.com/v2/eats',

    // Webhook endpoint (auto-generated after deployment)
    // Format: https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/receiveUberEatsOrder
    webhookUrl: 'Will be generated after deployment'
  },

  // ========================
  // MR. D FOOD CONFIGURATION
  // ========================
  mrDFood: {
    // Set to true once you have credentials and want to activate
    enabled: false,

    // Your restaurant/store ID on Mr. D Food
    storeId: 'YOUR_MRD_STORE_ID',

    // API credentials from Mr. D Food partner support
    apiKey: 'YOUR_MRD_API_KEY',
    partnerToken: 'YOUR_MRD_PARTNER_TOKEN',

    // Webhook secret (if provided by Mr. D)
    webhookSecret: 'YOUR_MRD_WEBHOOK_SECRET',

    // API base URL (will be provided by Mr. D support)
    apiUrl: 'https://api.mrd.co.za',

    // Webhook endpoint (auto-generated after deployment)
    webhookUrl: 'Will be generated after deployment'
  },

  // ========================
  // GENERAL SETTINGS
  // ========================
  settings: {
    // Automatically accept all incoming orders (or require manual confirmation)
    autoAcceptOrders: true,

    // Send notifications for new orders
    enableNotifications: true,

    // Log all incoming orders for debugging
    debugMode: true,

    // Default order status when created
    defaultStatus: 'pending',

    // Timeout for webhook acknowledgment (milliseconds)
    webhookTimeout: 10000, // 10 seconds (Uber requires response within 11.5 minutes)
  },

  // ========================
  // FIREBASE CONFIGURATION
  // ========================
  firebase: {
    // Firebase Realtime Database path for orders
    ordersPath: 'orders',

    // Firebase Realtime Database path for platform logs
    logsPath: 'delivery_platform_logs'
  }
};
