/**
 * Simple Inventory API - No Firebase Required
 * For student projects - uses in-memory storage
 */

import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

// In-memory storage
let users = [
  { uid: '1', email: 'admin@demo.com', password: 'admin123', displayName: 'Admin User', role: 'admin' }
];

let products = [
  { id: '1', name: 'Laptop', sku: 'LAP-001', categoryId: 'cat1', categoryName: 'Electronics', price: 999.99, quantity: 15, description: 'High-end laptop', status: 'active' },
  { id: '2', name: 'Mouse', sku: 'MOU-001', categoryId: 'cat1', categoryName: 'Electronics', price: 29.99, quantity: 50, description: 'Wireless mouse', status: 'active' },
  { id: '3', name: 'Notebook', sku: 'NOTE-001', categoryId: 'cat2', categoryName: 'Office Supplies', price: 5.99, quantity: 5, description: 'A5 notebook', status: 'active' }
];

let categories = [
  { id: 'cat1', name: 'Electronics', description: 'Electronic devices' },
  { id: 'cat2', name: 'Office Supplies', description: 'Office materials' }
];

let nextProductId = 4;
let nextCategoryId = 3;

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'OK' });
});

// Auth routes
app.post('/api/auth/register', (req, res) => {
  const { email, password, displayName } = req.body;
  if (users.find(u => u.email === email)) {
    return res.json({ success: false, error: 'Email already exists' });
  }
  const newUser = { uid: String(users.length + 1), email, password, displayName, role: 'user' };
  users.push(newUser);
  res.json({ success: true, user: newUser, token: 'demo-token-' + newUser.uid });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    res.json({ success: true, user, token: 'demo-token-' + user.uid });
  } else {
    res.json({ success: false, error: 'Invalid credentials' });
  }
});

// Product routes
app.get('/api/products', (req, res) => {
  let result = [...products];
  const { search, categoryId } = req.query;
  if (search) {
    const s = String(search).toLowerCase();
    result = result.filter(p => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
  }
  if (categoryId) {
    result = result.filter(p => p.categoryId === categoryId);
  }
  res.json({ success: true, data: result, total: result.length });
});

app.post('/api/products', (req, res) => {
  const { name, sku, categoryId, categoryName, price, quantity, description, status } = req.body;
  const newProduct = { id: String(nextProductId++), name, sku, categoryId, categoryName, price, quantity, description, status: status || 'active' };
  products.push(newProduct);
  res.json({ success: true, data: newProduct });
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const idx = products.findIndex(p => p.id === id);
  if (idx >= 0) {
    products[idx] = { ...products[idx], ...req.body };
    res.json({ success: true, data: products[idx] });
  } else {
    res.json({ success: false, error: 'Product not found' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  products = products.filter(p => p.id !== id);
  res.json({ success: true });
});

// Category routes
app.get('/api/categories', (req, res) => {
  res.json({ success: true, data: categories });
});

app.post('/api/categories', (req, res) => {
  const { name, description } = req.body;
  const newCategory = { id: 'cat' + nextCategoryId++, name, description };
  categories.push(newCategory);
  res.json({ success: true, data: newCategory });
});

app.put('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const idx = categories.findIndex(c => c.id === id);
  if (idx >= 0) {
    categories[idx] = { ...categories[idx], ...req.body };
    res.json({ success: true, data: categories[idx] });
  } else {
    res.json({ success: false, error: 'Category not found' });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  categories = categories.filter(c => c.id !== id);
  res.json({ success: true });
});

// Swagger UI
const swaggerDefinition = {
  openapi: '3.0.0',
  info: { title: 'Inventory API', version: '1.0.0', description: 'Simple inventory system' },
  servers: [{ url: 'http://localhost:3000', description: 'Dev' }],
  paths: {
    '/api/auth/login': { post: { tags: ['Auth'], summary: 'Login', responses: { 200: { description: 'OK' } } } },
    '/api/products': { get: { tags: ['Products'], summary: 'Get products', responses: { 200: { description: 'OK' } } }, post: { tags: ['Products'], summary: 'Create product', responses: { 201: { description: 'OK' } } } },
    '/api/categories': { get: { tags: ['Categories'], summary: 'Get categories', responses: { 200: { description: 'OK' } } } }
  }
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDefinition));

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ Server running: http://localhost:${PORT}`);
  console.log(`📚 Swagger: http://localhost:${PORT}/api-docs`);
  console.log(`🔐 Demo Login: admin@demo.com / admin123\n`);
});
