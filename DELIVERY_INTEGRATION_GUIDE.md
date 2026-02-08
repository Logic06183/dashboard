# 🚀 Delivery Platform Integration Guide

## Overview

This system automatically receives orders from **Uber Eats** and **Mr. D Food** and adds them directly to your Firebase dashboard. No more manual order entry!

**Status:** ✅ Infrastructure built, ⏸️ Waiting for API credentials

---

## 📋 What You Need From Your Brother

Your brother set up the Uber Eats and Mr. D Food accounts. You need to get these credentials from him:

### For Uber Eats:
1. **Restaurant ID** - Your unique store identifier on Uber Eats
2. **Client ID** - From Uber Developer Dashboard
3. **Client Secret** - From Uber Developer Dashboard
4. **Webhook Secret** - For security verification

**Where he can find these:**
- Go to: https://developer.uber.com/
- Sign in with the restaurant partner account
- Navigate to: Dashboard > Apps > [Your App Name]
- Find credentials under "Settings" and "Webhooks"

### For Mr. D Food:
1. **Store ID** - Your restaurant ID on Mr. D
2. **API Key** or **Partner Token**
3. **Webhook Secret** (if available)

**Where he can find these:**
- Contact Mr. D Food partner support: partnersupport@mrd.co.za
- Or check the restaurant partner portal
- Request: "API access for POS integration"

---

## 🔧 Activation Steps (Once You Have Credentials)

### Step 1: Update Configuration

Open `functions/config.js` and replace the placeholder values:

```javascript
uberEats: {
  enabled: true,  // ✅ Change to true
  restaurantId: 'YOUR_ACTUAL_RESTAURANT_ID',  // ✅ Add real ID
  clientId: 'YOUR_ACTUAL_CLIENT_ID',  // ✅ Add real ID
  clientSecret: 'YOUR_ACTUAL_CLIENT_SECRET',  // ✅ Add real secret
  webhookSecret: 'YOUR_ACTUAL_WEBHOOK_SECRET',  // ✅ Add real secret
},

mrDFood: {
  enabled: true,  // ✅ Change to true
  storeId: 'YOUR_ACTUAL_STORE_ID',  // ✅ Add real ID
  apiKey: 'YOUR_ACTUAL_API_KEY',  // ✅ Add real key
  // ... etc
}
```

### Step 2: Install Dependencies

```bash
cd functions
npm install
```

### Step 3: Deploy Functions to Firebase

```bash
# From the project root directory
firebase deploy --only functions
```

This will deploy 3 cloud functions:
- `receiveUberEatsOrder` - Receives Uber Eats orders
- `receiveMrDFoodOrder` - Receives Mr. D Food orders
- `healthCheck` - Verify everything is working

### Step 4: Get Your Webhook URLs

After deployment, Firebase will show you the URLs:

```
✔  functions[receiveUberEatsOrder]: https://us-central1-pizza-dashboard-92057.cloudfunctions.net/receiveUberEatsOrder
✔  functions[receiveMrDFoodOrder]: https://us-central1-pizza-dashboard-92057.cloudfunctions.net/receiveMrDFoodOrder
✔  functions[healthCheck]: https://us-central1-pizza-dashboard-92057.cloudfunctions.net/healthCheck
```

**Copy these URLs!** You'll need them for the next step.

### Step 5: Register Webhooks with Platforms

#### Uber Eats:
1. Go to: https://developer.uber.com/
2. Navigate to: Dashboard > Your App > Webhooks
3. Add Primary Webhook URL: `[Your receiveUberEatsOrder URL]`
4. Enable event types:
   - `orders.notification` - New orders
   - `orders.cancel` - Cancelled orders
5. Save

#### Mr. D Food:
1. Contact Mr. D Food partner support
2. Provide them your webhook URL: `[Your receiveMrDFoodOrder URL]`
3. Request they configure it for: New orders, Updates, Cancellations

### Step 6: Test It!

#### Test Health Check:
Visit: `https://[YOUR_REGION]-[YOUR_PROJECT].cloudfunctions.net/healthCheck`

You should see:
```json
{
  "status": "ok",
  "integrations": {
    "uberEats": { "enabled": true, "configured": true },
    "mrDFood": { "enabled": true, "configured": true }
  }
}
```

#### Test Real Order:
1. Place a test order through Uber Eats or Mr. D Food
2. Check your Firebase dashboard - order should appear automatically!
3. Check Firebase Console > Functions > Logs to see the processing

---

## 🎯 How It Works

```
┌─────────────┐
│ Customer    │
│ Orders via  │
│ Uber Eats   │
└──────┬──────┘
       │
       ↓
┌──────────────────┐
│ Uber Eats sends  │
│ webhook POST to  │
│ your Cloud       │
│ Function         │
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│ Parse order      │
│ - Extract pizzas │
│ - Map item names │
│ - Calculate total│
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│ Save to Firebase │
│ Realtime DB      │
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│ Order appears in │
│ Kitchen Display  │
│ INSTANTLY! ✨    │
└──────────────────┘
```

---

## 📊 What Gets Automatically Tracked

For each order, the system captures:

✅ **Customer Info**
- Name
- Phone number

✅ **Order Details**
- All pizzas with types and quantities
- Beverages
- Total amount
- Special instructions
- Platform (Uber Eats/Mr. D)

✅ **Delivery Info**
- Delivery vs Pickup
- Address
- Delivery instructions

✅ **Status**
- Automatically set to "pending"
- Ready for kitchen to start

✅ **Inventory**
- Ingredients automatically deducted (already working!)

---

## 🔍 Monitoring & Debugging

### Check Function Logs:
```bash
firebase functions:log
```

Or in Firebase Console:
- Go to: https://console.firebase.google.com/project/pizza-dashboard-92057/functions
- Click on a function
- View "Logs" tab

### Check Incoming Orders:
All webhook requests are logged to:
`Firebase Realtime Database > delivery_platform_logs`

### Test Endpoint:
```bash
# Test if functions are live
curl https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/healthCheck
```

---

## 🛠 Troubleshooting

### "Orders not appearing in dashboard"

**Check:**
1. ✅ Are functions deployed? Run `firebase deploy --only functions`
2. ✅ Are credentials correct in `functions/config.js`?
3. ✅ Is `enabled: true` for the platform?
4. ✅ Are webhooks registered with the platforms?
5. ✅ Check function logs: `firebase functions:log`

### "Getting 503 error"

**Solution:** The integration is disabled. Set `enabled: true` in `functions/config.js` and redeploy.

### "Invalid signature error"

**Solution:** The webhook secret might be wrong. Verify it with Uber Eats/Mr. D and update `functions/config.js`.

### "Unknown item warnings in logs"

**Solution:** A pizza/item name from the platform doesn't match our mappings. Update `functions/platformMapping.js` to add the new name variant.

---

## 🎨 Customization

### Add New Pizza Name Variants

If orders show up as "Unknown item", add the mapping in `functions/platformMapping.js`:

```javascript
'Uber Eats': {
  'New Pizza Name Variant': 'YOUR_INTERNAL_PIZZA_TYPE',
  // ... existing mappings
}
```

### Adjust Auto-Accept Behavior

In `functions/config.js`:

```javascript
settings: {
  autoAcceptOrders: true,  // Auto-accept all orders
  enableNotifications: true,  // Send notifications
  debugMode: true,  // Log everything (useful for initial testing)
}
```

### Change Order Status

By default, orders are created with `status: 'pending'`. Change in `functions/config.js`:

```javascript
settings: {
  defaultStatus: 'pending',  // or 'cooking', 'ready', etc.
}
```

---

## 💰 Cost Estimate

Firebase Cloud Functions pricing:
- **2 million invocations/month: FREE**
- Your estimated usage: ~5,000 orders/month = **FREE**
- Firebase Realtime Database: Already included in your plan

**Cost: R0** (well within free tier)

---

## 🔒 Security

✅ **Webhook signature verification** - Ensures requests are from real platforms
✅ **HTTPS only** - All communication encrypted
✅ **Firebase Admin SDK** - Secure database access
✅ **No API keys in code** - Stored in config file (excluded from git)
✅ **Request logging** - Track all incoming webhooks

---

## 📞 Support

**If something isn't working:**

1. Check the logs: `firebase functions:log`
2. Check Firebase Console: https://console.firebase.google.com/project/pizza-dashboard-92057/functions
3. Check this guide's troubleshooting section
4. Contact me (Claude) for help!

**Need to update platform credentials?**
- Edit `functions/config.js`
- Run `firebase deploy --only functions`
- Done!

---

## ✅ Checklist

Before going live, verify:

- [ ] Got credentials from brother
- [ ] Updated `functions/config.js` with real credentials
- [ ] Set `enabled: true` for both platforms
- [ ] Ran `npm install` in functions directory
- [ ] Deployed functions: `firebase deploy --only functions`
- [ ] Registered webhook URLs with Uber Eats
- [ ] Registered webhook URL with Mr. D Food
- [ ] Tested health check endpoint
- [ ] Placed test order to verify

---

🎉 **You're all set! Orders will now flow automatically into your dashboard!**
