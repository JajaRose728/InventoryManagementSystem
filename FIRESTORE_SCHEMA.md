# Firestore Database Schema Design

## Collections Structure

### 1. `users` Collection
Stores user account information and roles.

```javascript
{
  uid: string (document ID from Firebase Auth)
  email: string
  displayName: string
  avatar: string (URL from Firebase Storage)
  role: 'admin' | 'user'
  createdAt: timestamp
  updatedAt: timestamp
  isActive: boolean
}
```

### 2. `categories` Collection
Stores product categories.

```javascript
{
  id: string (auto-generated)
  name: string (e.g., "Electronics", "Clothing")
  description: string
  image: string (URL from Firebase Storage)
  createdBy: string (user uid)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 3. `products` Collection
Stores product inventory data.

```javascript
{
  id: string (auto-generated)
  name: string (e.g., "Laptop Pro 15")
  description: string
  categoryId: string (reference to categories)
  categoryName: string (denormalized for faster queries)
  sku: string (unique product code)
  price: number
  quantity: number
  minStockLevel: number (threshold for low stock alert)
  images: array of strings (URLs from Firebase Storage)
  supplier: string
  status: 'active' | 'inactive' | 'discontinued'
  tags: array of strings (for filtering)
  createdBy: string (user uid)
  createdAt: timestamp
  updatedAt: timestamp
  lastUpdatedBy: string (user uid)
}
```

### 4. `auditLogs` Collection (Optional)
Tracks all user actions for accountability.

```javascript
{
  id: string (auto-generated)
  userId: string (reference to users)
  userName: string (denormalized)
  action: string (e.g., 'create_product', 'delete_product', 'update_category')
  entityType: string (e.g., 'product', 'category')
  entityId: string
  changes: object (before/after values)
  timestamp: timestamp
  ipAddress: string (optional)
}
```

## Firestore Indexes
- Compound index: `products` (categoryId, status, createdAt)
- Compound index: `products` (status, quantity ASC)
- Single index: `products` (name) for text search

## Security Rules (Future Implementation)
- Only authenticated users can read/write
- Admins can modify categories and delete products
- Users can only create new products and view inventory
- Each user can only modify their own data

---

## Summary for Local Testing:
For localhost development, use **Firestore Emulator** to avoid real Firebase costs and data pollution.
