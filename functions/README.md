# Firebase Cloud Functions - Delivery Integration

## 📂 What's in this directory?

- **`index.js`** - Main Cloud Functions (webhook endpoints)
- **`config.js`** - API credentials and settings (⚠️ Add real keys here)
- **`platformMapping.js`** - Maps platform item names to your pizza types
- **`orderParsers.js`** - Transforms platform orders to your format

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Add your API credentials
Edit `config.js` and replace placeholder values with real credentials from your brother.

### 3. Deploy to Firebase
```bash
# From project root
firebase deploy --only functions
```

### 4. Test it
```bash
# Check if deployed successfully
curl https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/healthCheck
```

## 📖 Full Documentation

See `../DELIVERY_INTEGRATION_GUIDE.md` for complete setup instructions.

## 🔧 Local Development

### Run functions locally (emulator)
```bash
npm run serve
```

### View logs
```bash
npm run logs
```

### Test locally
```bash
# Start emulator
firebase emulators:start --only functions

# In another terminal, send test request
curl -X POST http://localhost:5001/pizza-dashboard-92057/us-central1/receiveUberEatsOrder \
  -H "Content-Type: application/json" \
  -d '{"id":"test123","placed_at":"2026-02-08T12:00:00Z","cart":{"items":[{"title":"The Champ","quantity":1}]}}'
```

## 🎯 Function Endpoints

Once deployed, you'll have 3 endpoints:

1. **`receiveUberEatsOrder`** - Receives Uber Eats webhooks
2. **`receiveMrDFoodOrder`** - Receives Mr. D Food webhooks
3. **`healthCheck`** - Verify deployment status

## ⚠️ Before You Deploy

Make sure you:
- ✅ Added real API credentials in `config.js`
- ✅ Set `enabled: true` for platforms you want to use
- ✅ Ran `npm install`
- ✅ Have Firebase CLI installed (`npm install -g firebase-tools`)
- ✅ Are logged in to Firebase (`firebase login`)

## 🔒 Security Note

**Never commit `config.js` with real API keys to GitHub!**

If you accidentally do:
1. Immediately regenerate API keys at the platform
2. Update `config.js` with new keys
3. Remove from git history: `git filter-branch --force --index-filter "git rm --cached --ignore-unmatch functions/config.js"`
