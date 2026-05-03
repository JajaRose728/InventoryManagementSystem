/**
 * Firebase Inventory API
 * Uses Firebase Realtime Database for data storage
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import * as admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';

const app = express();
const PORT = 3000;

// Initialize Firebase Admin
let firebaseApp: admin.app.App | null = null;

function initializeFirebase() {
  if (firebaseApp) return firebaseApp;
  
  // Production: Use environment variables (Render)\n  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {\n    firebaseApp = admin.initializeApp({\n      credential: admin.credential.cert({\n        projectId: process.env.FIREBASE_PROJECT_ID,\n        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,\n        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\\\n/g, '\\n'),\n      }),\n    });\n    console.log('✅ Firebase Production Env Vars Mode (Render)');\n    return firebaseApp;\n  }\n\n  const useEmulator = process.env.USE_FIRESTORE_EMULATOR === 'true';\n  const serviceAccountPath = './firebase-service-account.json';\n  const hasServiceAccount = existsSync(serviceAccountPath);
  
  if (useEmulator && !hasServiceAccount) {
    // Emulator mode - no credentials needed
    process.env.FIREBASE_DATABASE_EMULATOR_HOST = process.env.FIREBASE_DATABASE_EMULATOR_HOST || 'localhost:9000';
    firebaseApp = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'inventory-system-demo'
    });
    console.log('✅ Firebase Emulator Mode enabled');
  } else if (hasServiceAccount) {
    // Production mode - use service account
    try {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      console.log('✅ Firebase Production Mode enabled');
    } catch (err) {
      console.error('❌ Invalid service account file. Using emulator mode instead.');
      process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';
      firebaseApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'inventory-system-demo'
      });
      console.log('✅ Firebase Emulator Mode (fallback)');
    }
  } else {
    // No credentials - use emulator
    process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';
    firebaseApp = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'inventory-system-demo'
    });
    console.log('✅ Firebase Emulator Mode (no credentials)');
  }
  
  return firebaseApp;
}

// Initialize Firebase
initializeFirebase();
const db = admin.firestore();

// Middleware
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? '*' : 'http://localhost:4200' }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'OK', database: 'Firebase Firestore' });
});

// Diagnostic endpoint
app.get('/api/diagnostic', async (req, res) => {
  try {
    // Try to get Firestore info
    const projects = await admin.firestore().listCollections();
    res.json({ 
      success: true, 
      message: 'Firestore connected',
      collections: projects.map(c => c.id)
    });
  } catch (error: any) {
    res.json({ 
      success: false, 
      error: error.message,
      code: error.code,
      details: error.toString()
    });
  }
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    
    // Check if user exists
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    
    if (!snapshot.empty) {
      return res.json({ success: false, error: 'Email already exists' });
    }
    
    // Create user
    const userData = {
      email,
      password, // Note: In production, hash this password!
      displayName: displayName || email.split('@')[0],
      role: 'user',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await usersRef.add(userData);
    const token = 'firebase-token-' + docRef.id;
    
    res.json({ success: true, user: { uid: docRef.id, ...userData }, token });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    
    if (snapshot.empty) {
      return res.json({ success: false, error: 'Invalid credentials' });
    }
    
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    
    if (userData.password !== password) {
      return res.json({ success: false, error: 'Invalid credentials' });
    }
    
    const token = 'firebase-token-' + userDoc.id;
    
    res.json({ success: true, user: { uid: userDoc.id, ...userData }, token });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

// Product routes
app.get('/api/products', async (req, res) => {
  try {
    const { search, categoryId } = req.query;
    let productsRef = db.collection('products');
    
    const snapshot = await productsRef.get();
    let products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter by search
    if (search) {
      const searchLower = (search as string).toLowerCase();
      products = products.filter((p: any) => 
        p.name.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filter by category
    if (categoryId) {
      products = products.filter((p: any) => p.categoryId === categoryId);
    }
    
    res.json({ success: true, data: products });
  } catch (error: any) {
    res.json({ success: false, error: error.message, data: [] });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = req.body;
    product.createdAt = admin.firestore.FieldValue.serverTimestamp();
    
    const docRef = await db.collection('products').add(product);
    const newProduct = { id: docRef.id, ...product };
    
    res.json({ success: true, data: newProduct });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = req.body;
    product.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    await db.collection('products').doc(id).update(product);
    
    res.json({ success: true, data: { id, ...product } });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('products').doc(id).delete();
    
    res.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

// Category routes
app.get('/api/categories', async (req, res) => {
  try {
    const snapshot = await db.collection('categories').get();
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.json({ success: false, error: error.message, data: [] });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const category = req.body;
    category.createdAt = admin.firestore.FieldValue.serverTimestamp();
    
    const docRef = await db.collection('categories').add(category);
    const newCategory = { id: docRef.id, ...category };
    
    res.json({ success: true, data: newCategory });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = req.body;
    category.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    await db.collection('categories').doc(id).update(category);
    
    res.json({ success: true, data: { id, ...category } });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('categories').doc(id).delete();
    
    res.json({ success: true, message: 'Category deleted' });
  } catch (error: any) {
    res.json({ success: false, error: error.message });
  }
});

// Swagger documentation
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Inventory API',
    version: '1.0.0',
    description: 'Firebase-backed Inventory Management System'
  },
  servers: [{ url: `http://localhost:${PORT}` }],
  paths: {
    '/health': { get: { summary: 'Health check' } },
    '/api/auth/register': { post: { summary: 'Register user', tags: ['Auth'] } },
    '/api/auth/login': { post: { summary: 'Login user', tags: ['Auth'] } },
    '/api/products': {
      get: { summary: 'Get products', tags: ['Products'] },
      post: { summary: 'Create product', tags: ['Products'] }
    },
    '/api/categories': {
      get: { summary: 'Get categories', tags: ['Categories'] },
      post: { summary: 'Create category', tags: ['Categories'] }
    }
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║   Inventory Management System - Firebase       ║
║   Server running on: http://localhost:${PORT}     ║
║   Swagger Docs: http://localhost:${PORT}/api-docs║
╚════════════════════════════════════════════════╝
  `);
});

export default app;
