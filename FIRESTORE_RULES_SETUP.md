# Firestore Security Rules Setup Guide

## Problem: "Missing or insufficient permissions" Error

This error occurs because Firestore Security Rules are blocking read/write access. You need to configure the rules in Firebase Console.

## Quick Fix: Development Rules (Temporary)

For development and testing, use these rules that allow full access:

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **hackchackpack**
3. Click on **Firestore Database** in the left sidebar
4. Click on the **Rules** tab

### Step 2: Copy Development Rules
Copy and paste this into the Rules editor:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Development rules - allows all read/write access
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Step 3: Publish Rules
1. Click **Publish** button
2. Wait for the rules to deploy (usually a few seconds)

### Step 4: Test Connection
1. Go back to your app
2. Visit `http://localhost:3000/seed-admin`
3. Click "Test Firebase Connection"
4. You should now see "Firebase connection successful"

## Production Rules (Secure)

⚠️ **IMPORTANT:** For production, you should use the secure rules in `firestore.rules.production` file. 

The production rules include:
- User authentication checks
- Role-based access (admin vs member)
- User can only access their own data
- Admin can access all data
- Proper security for all collections

**When to switch to production rules:**
- After development and testing is complete
- Before deploying to production
- When you want to secure your database

## Collections and Permissions

### Collections Structure:
- `users` - User accounts (name, phone, role, isActive)
- `wallets` - User wallet data (rechargeWallet, balanceWallet, etc.)
- `transactions` - All transactions (recharge, withdraw)
- `teams` - Team/network data
- `products` - Product catalog

### Development Rules:
- ✅ **Full access** to all collections
- ⚠️ **Not secure** - use only for development

### Production Rules:
- ✅ Users can read/write their own data
- ✅ Admins can manage all data
- ✅ Registration allowed (anyone can create user)
- ✅ Secure and production-ready

## Troubleshooting

### Still getting permission errors?
1. Make sure you clicked **Publish** in Firebase Console
2. Wait 10-30 seconds for rules to propagate
3. Refresh your browser
4. Check browser console for detailed error messages
5. Verify you're using the correct Firebase project

### Need to switch between development and production rules?
- Development: Use rules from `firestore.rules` file
- Production: Use rules from `firestore.rules.production` file

## Next Steps

1. ✅ Set up development rules (allows all access)
2. ✅ Test connection and seed admin data
3. ✅ Develop and test your application
4. ⚠️ Switch to production rules before going live

## Need Help?

If you continue to have issues:
1. Check Firebase Console → Firestore Database → Rules tab
2. Verify your Firebase project ID matches: `hackchackpack`
3. Ensure you're logged into the correct Firebase account
