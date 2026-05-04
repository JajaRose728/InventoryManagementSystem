/**
 * Firebase Inventory API - Render Ready
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import * as admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin
let firebaseApp: admin.app.App | null = null;

function initializeFirebase() {
  if (firebaseApp) return firebaseApp;
  
  // Production Render env vars first
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID as string,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY as string).replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Production (Render)');
    return firebaseApp;
  }

  // Local fallback
  const useEmulator = process.env.USE_FIRESTORE_EMULATOR === 'true';
  const serviceAccountPath = './firebase-service-account.json';
  const hasServiceAccount = existsSync(serviceAccountPath);
  
  if (useEmulator && !hasServiceAccount) {
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    firebaseApp = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'inventorymanagement-8be56'
    });
    console.log('✅ Firebase Emulator');
  } else if (hasServiceAccount) {
    try {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Service Account');
    } catch (err) {
      console.error('❌ Service account fallback emulator');
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
      firebaseApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'inventorymanagement-8be56'
      });
    }
  } else {
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
    firebaseApp = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'inventorymanagement-8be56'
    });
    console.log('✅ Firebase Emulator fallback');
  }

  return firebaseApp;
}

// Init Firebase
initializeFirebase();
const db = admin.firestore();

// Middleware
app.use(cors({ origin: process.env.NODE_ENV === 'production' ? '*' : 'http://localhost:4200' }));
app.use(express.json({ limit: '10mb' }));

// Health
app.get('/health', (req, res) => res.json({ success: true, message: 'OK', database: 'Firestore' }));

// Diagnostic
app.get('/api/diagnostic', async (req, res) => {
  try {
    const collections = await admin.firestore().listCollections();
    res.json({ success: true, collections: collections.map(c => c.id) });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Auth
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    
    if (!snapshot.empty) return res.json({ success: false, error: 'Email exists' });
    
    const userData = {
      email,
      password,
      displayName: displayName || email.split('@')[0],
      role: 'user',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await usersRef.add(userData);
    res.json({ success: true, user: { uid: docRef.id, ...userData }, token: `token-${docRef.id}` });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    
    if (snapshot.empty) return res.json({ success: false, error: 'Invalid credentials' });
    
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    
    if (userData.password !== password) return res.json({ success: false, error: 'Invalid credentials' });
    
    res.json({ success: true, user: { uid: userDoc.id, ...userData }, token: `token-${userDoc.id}` });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Products
app.get('/api/products', async (req, res) => {
  try {
    const snapshot = await db.collection('products').get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: products });
  } catch (error) {
    res.json({ success: false, error: error.message, data: [] });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = req.body;
    product.createdAt = admin.firestore.FieldValue.serverTimestamp();
    const docRef = await db.collection('products').add(product);
    res.json({ success: true, data: { id: docRef.id, ...product } });
  } catch (error) {
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
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('products').doc(id).delete();
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Categories
app.get('/api/categories', async (req, res) => {
  try {
    const snapshot = await db.collection('categories').get();
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: categories });
  } catch (error) {
    res.json({ success: false, error: error.message, data: [] });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const category = req.body;
    category.createdAt = admin.firestore.FieldValue.serverTimestamp();
    const docRef = await db.collection('categories').add(category);
    res.json({ success: true, data: { id: docRef.id, ...category } });
  } catch (error) {
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
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection('categories').doc(id).delete();
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup({
  openapi: '3.0.0',
  info: {
    title: 'Inventory API',
    version: '1.0.0',
    description: 'Firebase Inventory Management - Render Deployed'
  },
  servers: [{ url: `http://localhost:${PORT}` }],
  paths: {
    '/health': { get: { summary: 'Health check' } },
    '/api/auth/register': { post: { summary: 'Register' } },
    '/api/auth/login': { post: { summary: 'Login' } },
    '/api/products': { get: { summary: 'List products' }, post: { summary: 'Create product' } },
    '/api/categories': { get: { summary: 'List categories' }, post: { summary: 'Create category' } }
  }
}));

app.listen(PORT, () => {
  console.log(`🚀 Inventory API running on port ${PORT}`);
  console.log(`Docs: http://localhost:${PORT}/api-docs`);
});

export default app;

