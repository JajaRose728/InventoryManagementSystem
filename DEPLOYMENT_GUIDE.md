# Deployment Guide for Inventory Management System

## Overview

Your project consists of:
- **Frontend**: Angular 21 (SPA - runs in browser)
- **Backend**: Express.js server (Node.js API)
- **Database**: Firebase Firestore

For school purposes, I recommend **Firebase Hosting + Cloud Functions** - it's free, secure, and integrates perfectly with your existing setup.

---

## Option 1: Firebase Hosting + Cloud Functions (RECOMMENDED)

### Why This Option?
- ✅ 100% Free forever (no credit card)
- ✅ Native Firebase integration - no API key changes needed
- ✅ Automatic SSL/HTTPS
- ✅ Custom domain support
- ✅ Global CDN (fast loading worldwide)
- ✅ No cold start issues on Spark plan

### Step-by-Step Deployment

#### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

#### Step 2: Login to Firebase
```bash
firebase login
```

#### Step 3: Initialize Firebase Project
Run in your project root (NOT the server folder):
```bash
firebase init
```

**Select these options using arrow keys and Enter:**
```
? Which Firebase features do you want to set up?
  Hosting: Configure files for deployment
  Functions: Configure and deploy Node.js functions
  Firestore: Deploy rules and enable indexes

? What do you want to use as your public directory?
> dist/inventory-management-system/browser

? Configure as a single-page app (SPA)?
> Yes

? Does Firebase overwrite index.html with a 404?
> No
```

#### Step 4: Set Up Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `inventory-system-demo`
3. Click Project Settings (gear icon)
4. Scroll to "Service accounts"
5. Click "Generate new private key"
6. Save the JSON file securely

#### Step 5: Configure Server for Cloud Functions

Edit `server/src/config/firebase.ts` to load credentials from environment:

```typescript
import admin from 'firebase-admin';

// Check if running in production (Cloud Functions)
if (process.env.FIREBASE_PROJECT_ID) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace escaped newlines for private key
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
} else {
  // Local development - use service account file
  const serviceAccount = require('../../firebase-adminsdk.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
```

#### Step 6: Deploy

**Build the Angular app:**
```bash
npm run build
```

**Deploy to Firebase:**
```bash
firebase deploy --only hosting
```

**Deploy Cloud Functions:**
```bash
firebase deploy --only functions
```

**Deploy everything:**
```bash
firebase deploy
```

Your app will be live at: `https://inventory-system-demo.web.app`

---

## Option 2: Vercel + Render (Alternative)

### When to Use This
- You want to separate frontend/backend hosting
- You prefer Vercel's analytics
- You want to use Express server (not Cloud Functions)

### Frontend: Deploy to Vercel (Free)

#### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

#### Step 2: Deploy
Run in your project root:
```bash
vercel
```

#### Step 3: Answer Prompts
```
? Set up and deploy? Yes
? Which scope? (your username)
? What's your project's name? inventory-management-system
? In which directory is your build output? dist/inventory-management-system/browser
? Want to modify settings? No
```

#### Step 4: Update API URLs
After deployment, update your Angular environment:
- Edit `src/environments/environment.prod.ts`
- Change API base URL to your Render backend URL

### Backend: Deploy to Render (Free)

#### Step 1: Push to GitHub
1. Create a GitHub repository
2. Push your `server` folder (or whole project)

#### Step 2: Create Render Service
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New Web Service"
4. Connect your GitHub repository
5. Select the server folder

#### Step 3: Configure Settings

| Setting | Value |
|---------|-------|
| Name | inventory-api |
| Region | Oregon (or closest) |
| Branch | main |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Plan | Free |

#### Step 4: Add Environment Variables
In Render Dashboard > Your Service > Environment:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
```

> ⚠️ For FIREBASE_PRIVATE_KEY: Paste the full multiline private key as-is (don't escape newlines in Render UI)

#### Step 5: Deploy
Click "Create Web Service"

Your API will be live at: `https://inventory-api.onrender.com`

---

## Option 3: Firebase Hosting + Railway (Backend)

### Frontend: Firebase Hosting
Same as Option 1, Steps 1-3

### Backend: Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Empty Project"
5. Add PostgreSQL (or keep empty)
6. Connect your GitHub repo
7. Set environment variables
8. Deploy

---

## Quick Comparison Table

| Platform | Free Tier | Sleep | SSL | Best For |
|----------|----------|-------|-----|---------|
| **Firebase Hosting** | ✅ Full free | No | ✅ Auto | Angular |
| **Vercel** | 100GB/mo | Yes (after 5min) | ✅ Auto | Angular/SPA |
| **Render** | 750 hrs/mo | Yes | ✅ Auto | Express API |
| **Railway** | $5 credit | Yes | ✅ Paid | Full stack |

---

## Estimated Costs

| Option | Monthly Cost | Notes |
|--------|------------|-------|
| **Option 1 (Firebase)** | **$0** | Free Spark plan |
| **Option 2 (Vercel+Render)** | **$0** | Both free tiers |
| **Option 3 (Railway)** | $0-5 | Depends on usage |

---

## Testing Your Deployment

After deployment, test:
1. ✅ Login page loads at your URL
2. ✅ User registration works
3. ✅ Login works
4. ✅ Dashboard loads after login
5. ✅ Products can be added/edited/deleted

---

## Troubleshooting

### CORS Errors
If you get CORS errors with Express on Render:
```typescript
// In server/src/index.ts, add:
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});
```

### Firebase Permissions
Make sure your Firestore rules allow read/write:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Build Errors
If Angular build fails:
```bash
# Clear cache and rebuild
rm -rf dist
npm run build
```

---

## Useful Commands

```bash
# Build for production
npm run build

# Deploy only frontend
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# Deploy everything
firebase deploy

# Check deployment status
firebase hosting:channel:list
```

---

## Need Help?

If you encounter issues:
1. Check Firebase Console for error logs
2. Run `firebase debug:functions` for backend logs
3. Check browser console (F12) for frontend errors

---

**Recommended for school: Option 1 (Firebase Hosting + Cloud Functions) - Completely free and easiest setup!**