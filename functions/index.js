/**
 * Firebase Inventory API - Cloud Functions Version
 * With Input Validation & Security
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

const serviceAccount = require('./firebase-service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://inventorymanagement-8be56.firebaseio.com'
});

const db = admin.firestore();

// Create Express app
const app = express();

// CORS configuration - allow all for Firebase hosting
app.use(cors({ origin: true }));
app.use(express.json());

// ==================== INPUT VALIDATION MIDDLEWARE ====================

/**
 * Sanitize input to prevent XSS and injection attacks
 */
function sanitize(input) {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  if (typeof email !== 'string' || !email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate required fields
 */
function validateRequired(obj, fields) {
  const errors = [];
  for (const field of fields) {
    if (!obj[field] || (typeof obj[field] === 'string' && !obj[field].trim())) {
      errors.push(`${field} is required`);
    }
  }
  return errors;
}

/**
 * Validate product data
 */
function validateProduct(product, isUpdate = false) {
  const errors = [];

  if (!isUpdate || product.name) {
    if (!product.name || product.name.trim().length < 2) {
      errors.push('Product name must be at least 2 characters');
    }
    if (product.name && product.name.length > 100) {
      errors.push('Product name must not exceed 100 characters');
    }
  }

  if (!isUpdate || product.price) {
    const price = parseFloat(product.price);
    if (isNaN(price) || price < 0) {
      errors.push('Price must be a positive number');
    }
    if (price > 1000000) {
      errors.push('Price must not exceed 1,000,000');
    }
  }

  if (!isUpdate || product.quantity) {
    const quantity = parseInt(product.quantity);
    if (isNaN(quantity) || quantity < 0) {
      errors.push('Quantity must be a non-negative number');
    }
  }

  if (product.email && !isValidEmail(product.email)) {
    errors.push('Invalid email format');
  }

  // Check for SQL injection patterns
  const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC|EXECUTE)\b)/i;
  const valueStr = JSON.stringify(product);
  if (sqlPatterns.test(valueStr)) {
    errors.push('Invalid characters detected');
  }

  return errors;
}

/**
 * Validate user registration
 */
function validateUser(user) {
  const errors = [];

  if (!user.email || !user.email.trim()) {
    errors.push('Email is required');
  } else if (!isValidEmail(user.email)) {
    errors.push('Invalid email format');
  }

  if (!user.password || user.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (user.displayName && user.displayName.length > 50) {
    errors.push('Display name must not exceed 50 characters');
  }

  const validRoles = ['admin', 'manager', 'user'];
  if (user.role && !validRoles.includes(user.role)) {
    errors.push('Invalid role');
  }

  return errors;
}

/**
 * Validate category data
 */
function validateCategory(category, isUpdate = false) {
  const errors = [];

  if (!isUpdate || category.name) {
    if (!category.name || category.name.trim().length < 2) {
      errors.push('Category name must be at least 2 characters');
    }
    if (category.name && category.name.length > 50) {
      errors.push('Category name must not exceed 50 characters');
    }
  }

  return errors;
}

// ==================== AUTH ROUTES ====================

// Register
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // Validate input
    const errors = validateUser({ email, password, displayName });
    if (errors.length > 0) {
      return res.json({ success: false, error: errors.join(', ') });
    }

    // Sanitize inputs
    const sanitizedEmail = sanitize(email);
    const sanitizedName = sanitize(displayName || email.split('@')[0]);

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', sanitizedEmail).get();

    if (!snapshot.empty) {
      return res.json({ success: false, error: 'Email already exists' });
    }

    const userData = {
      email: sanitizedEmail,
      password: sanitize(password),
      displayName: sanitizedName,
      role: 'user',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await usersRef.add(userData);
    const token = 'firebase-token-' + docRef.id;

    res.json({ success: true, user: { uid: docRef.id, email: sanitizedEmail, role: 'user' }, token });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const errors = validateUser({ email, password });
    if (errors.length > 0) {
      return res.json({ success: false, error: errors.join(', ') });
    }

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

    res.json({ success: true, user: { uid: userDoc.id, email: userData.email, role: userData.role }, token });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// ==================== PRODUCT ROUTES ====================

// Get all products with search/filter
app.get('/products', async (req, res) => {
  try {
    const { search, categoryId, status, page = 1, limit = 10 } = req.query;
    let productsRef = db.collection('products');

    const snapshot = await productsRef.get();
    let products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Filter by search
    if (search) {
      const searchLower = search.toString().toLowerCase();
      products = products.filter(p =>
        p.name?.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category
    if (categoryId) {
      products = products.filter(p => p.category === categoryId);
    }

    // Filter by status
    if (status) {
      if (status === 'lowstock') {
        products = products.filter(p => p.quantity < (p.minStock || 5));
      } else {
        products = products.filter(p => p.status === status);
      }
    }

    // Sort by name
    products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const start = (pageNum - 1) * limitNum;
    const paginatedProducts = products.slice(start, start + limitNum);

    res.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: products.length,
        totalPages: Math.ceil(products.length / limitNum)
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message, data: [] });
  }
});

// Create product
app.post('/products', async (req, res) => {
  try {
    const product = req.body;

    // Validate input
    const errors = validateProduct(product);
    if (errors.length > 0) {
      return res.json({ success: false, error: errors.join(', ') });
    }

    // Sanitize all string fields
    const sanitizedProduct = {
      name: sanitize(product.name),
      sku: sanitize(product.sku) || '',
      category: sanitize(product.category) || 'Other',
      price: parseFloat(product.price) || 0,
      quantity: parseInt(product.quantity) || 0,
      minStock: parseInt(product.minStock) || 5,
      status: sanitize(product.status) || 'active',
      supplier: sanitize(product.supplier) || '',
      description: sanitize(product.description) || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('products').add(sanitizedProduct);
    const newProduct = { id: docRef.id, ...sanitizedProduct };

    res.json({ success: true, data: newProduct });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Update product
app.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = req.body;

    // Validate input
    const errors = validateProduct(product, true);
    if (errors.length > 0) {
      return res.json({ success: false, error: errors.join(', ') });
    }

    // Sanitize fields
    const sanitizedProduct = {};
    if (product.name) sanitizedProduct.name = sanitize(product.name);
    if (product.sku !== undefined) sanitizedProduct.sku = sanitize(product.sku);
    if (product.category) sanitizedProduct.category = sanitize(product.category);
    if (product.price !== undefined) sanitizedProduct.price = parseFloat(product.price);
    if (product.quantity !== undefined) sanitizedProduct.quantity = parseInt(product.quantity);
    if (product.minStock !== undefined) sanitizedProduct.minStock = parseInt(product.minStock);
    if (product.status) sanitizedProduct.status = sanitize(product.status);
    if (product.supplier !== undefined) sanitizedProduct.supplier = sanitize(product.supplier);
    if (product.description !== undefined) sanitizedProduct.description = sanitize(product.description);
    sanitizedProduct.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('products').doc(id).update(sanitizedProduct);

    res.json({ success: true, data: { id, ...sanitizedProduct } });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Delete product
app.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.trim() === '') {
      return res.json({ success: false, error: 'Product ID is required' });
    }

    await db.collection('products').doc(id).delete();

    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// ==================== CATEGORY ROUTES ====================

// Get all categories
app.get('/categories', async (req, res) => {
  try {
    const snapshot = await db.collection('categories').get();
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ success: true, data: categories });
  } catch (error) {
    res.json({ success: false, error: error.message, data: [] });
  }
});

// Create category
app.post('/categories', async (req, res) => {
  try {
    const category = req.body;

    // Validate input
    const errors = validateCategory(category);
    if (errors.length > 0) {
      return res.json({ success: false, error: errors.join(', ') });
    }

    const sanitizedCategory = {
      name: sanitize(category.name),
      description: sanitize(category.description) || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('categories').add(sanitizedCategory);
    const newCategory = { id: docRef.id, ...sanitizedCategory };

    res.json({ success: true, data: newCategory });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Update category
app.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = req.body;

    // Validate input
    const errors = validateCategory(category, true);
    if (errors.length > 0) {
      return res.json({ success: false, error: errors.join(', ') });
    }

    const sanitizedCategory = {};
    if (category.name) sanitizedCategory.name = sanitize(category.name);
    if (category.description !== undefined) sanitizedCategory.description = sanitize(category.description);
    sanitizedCategory.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('categories').doc(id).update(sanitizedCategory);

    res.json({ success: true, data: { id, ...sanitizedCategory } });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Delete category
app.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id.trim() === '') {
      return res.json({ success: false, error: 'Category ID is required' });
    }

    await db.collection('categories').doc(id).delete();

    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// ==================== FILE UPLOAD ROUTE ====================

// Upload file (image/document)
app.post('/upload', async (req, res) => {
  try {
    const { fileName, fileContent, fileType } = req.body;

    if (!fileName || !fileContent) {
      return res.json({ success: false, error: 'File name and content are required' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (fileType && !allowedTypes.includes(fileType)) {
      return res.json({ success: false, error: 'Invalid file type. Allowed: JPEG, PNG, GIF, PDF' });
    }

    // Validate file size (max 5MB)
    if (fileContent.length > 5 * 1024 * 1024) {
      return res.json({ success: false, error: 'File size must not exceed 5MB' });
    }

    // Sanitize file name
    const sanitizedFileName = sanitize(fileName);

    // For Firebase Storage, we'd upload to Storage
    // Here we store metadata in Firestore for demonstration
    const fileData = {
      fileName: sanitizedFileName,
      fileType: fileType || 'application/octet-stream',
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
      size: fileContent.length
    };

    const docRef = await db.collection('uploads').add(fileData);

    res.json({
      success: true,
      data: {
        id: docRef.id,
        fileName: sanitizedFileName,
        fileType: fileType
      }
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'OK', database: 'Firebase Firestore' });
});

// Export as Firebase Cloud Function
exports.api = functions.https.onRequest(app);