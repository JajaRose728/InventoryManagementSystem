/**
 * Centralized models/types for the Inventory Management System
 */

export interface User {
  uid: string;
  email: string;
  displayName: string;
  avatar?: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  sku: string;
  price: number;
  quantity: number;
  minStockLevel: number;
  images: string[];
  supplier: string;
  status: 'active' | 'inactive' | 'discontinued';
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastUpdatedBy: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
