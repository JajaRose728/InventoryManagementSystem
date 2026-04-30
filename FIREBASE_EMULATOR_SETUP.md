# Firebase Configuration for Inventory Management System

## 🔥 Local Development with Firebase Emulator

For **localhost development**, we'll use the **Firebase Emulator Suite** instead of real Firebase, which:
- ✅ Costs nothing
- ✅ Runs completely offline
- ✅ Fast development/testing
- ✅ No data conflicts with production

---

## 📋 Setup Firebase Emulator

### Step 1: Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase (Required once)
```bash
firebase login
```

This opens a browser for authentication.

### Step 3: Initialize Firebase in Project
```bash
cd c:\Users\MikhaiLev\Inventory-Management-System
firebase init
```

**When prompted, select:**
- `Firestore` ✅
- `Authentication` ✅
- `Storage` ✅
- `Emulators` ✅

**Firebase Project:** Use existing or create `inventory-system-demo`

### Step 4: Configure Emulator Settings

Edit `firebase.json` (auto-generated):

```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### Step 5: Start Emulators
```bash
firebase emulators:start
```

**Output should show:**
```
✔ Emulator Suite has started.
│ Firestore Emulator: http://localhost:8080
│ Authentication Emulator: http://localhost:9099
│ Storage Emulator: http://localhost:9199
│ Emulator UI: http://localhost:4000
```

---

## 🗂️ Firestore Collections Setup

### Option A: Auto-Create (Recommended for Testing)

Collections are created automatically when you first write data.

### Option B: Manual Setup via Emulator UI

1. Go to: **http://localhost:4000** (Emulator UI)
2. Select **Firestore** tab
3. Click **Create Collection**
4. Create these collections:

- **users** - User accounts
- **products** - Product inventory
- **categories** - Product categories
- **auditLogs** - Action tracking

---

## 👥 Create Demo Users

Via Emulator UI (http://localhost:4000):

### Admin User
```
Email: admin@demo.com
Password: admin123
```

### Regular User
```
Email: user@demo.com
Password: user123
```

---

## 📊 Sample Data for Testing

### Sample Category
```json
{
  "id": "cat-001",
  "name": "Electronics",
  "description": "Electronic devices and components",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

### Sample Product
```json
{
  "id": "prod-001",
  "name": "Laptop Pro 15",
  "description": "High-performance laptop",
  "categoryId": "cat-001",
  "categoryName": "Electronics",
  "sku": "LP-001",
  "price": 1299.99,
  "quantity": 5,
  "minStockLevel": 10,
  "supplier": "Tech Suppliers",
  "status": "active",
  "images": [],
  "tags": ["laptop", "electronics"],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

---

## 🔌 Connect Backend to Emulator

**Server `.env` file:**
```
FIREBASE_PROJECT_ID=inventory-system-demo
USE_FIRESTORE_EMULATOR=true
FIRESTORE_EMULATOR_HOST=localhost:8080
```

The backend will automatically connect when these are set.

---

## 🔌 Connect Frontend to Emulator

**Client `src/environments/environment.ts`:**
```typescript
export const environment = {
  production: false,
  firebase: {
    projectId: 'inventory-system-demo',
    apiKey: 'AIzaSyDummyKey',
    authDomain: 'inventory-system-demo.firebaseapp.com',
    // ... other config
  },
  useEmulator: true,
  emulatorSettings: {
    firestoreEmulatorHost: 'localhost:8080',
    authEmulatorUrl: 'http://localhost:9099'
  }
};
```

---

## 🚀 Running Full Stack Locally

### Terminal 1: Start Firebase Emulator
```bash
firebase emulators:start
```

### Terminal 2: Start Backend API
```bash
cd server
npm install  # First time only
npm run dev
```

Server runs on: **http://localhost:3000**

### Terminal 3: Start Frontend
```bash
npm install  # First time only
npm start
```

Frontend runs on: **http://localhost:4200**

---

## 🧪 Test the Setup

### 1. Access Emulator UI
```
http://localhost:4000
```

Verify:
- ✅ Firestore has collections
- ✅ Auth has demo users
- ✅ Storage is initialized

### 2. Test Backend API
```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@123",
    "displayName": "Test User"
  }'
```

### 3. Test Frontend
```
http://localhost:4200/login
Login with: admin@demo.com / admin123
```

---

## 🧹 Clear Emulator Data

Reset all data:
```bash
firebase emulators:start --clear-on-exit
```

Or manually delete:
```bash
rm -rf ~/.cache/firebase  # Mac/Linux
# Windows: Delete %AppData%\.firebase
```

---

## 📝 Notes

- Emulator data is **persistent** between restarts (unless `--clear-on-exit`)
- Security rules are **not enforced** in emulator (for development ease)
- Use for development only; don't expose emulator to internet

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 8080
netstat -ano | findstr :8080
# Kill the process
taskkill /PID <PID> /F
```

### Firebase Init Issues
```bash
firebase --version  # Check version
firebase login --reauthenticate  # Re-login
```

### Emulator Won't Start
```bash
# Check Java (required for emulator)
java -version

# Update Firebase tools
npm install -g firebase-tools@latest
```

---

## 📚 More Info

- Firebase Docs: https://firebase.google.com/docs
- Emulator Suite: https://firebase.google.com/docs/emulator-suite
- Firestore: https://firebase.google.com/docs/firestore
