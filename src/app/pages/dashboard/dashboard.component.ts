import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

/**
 * Dashboard Component - Main inventory management interface
 * Shows product list with search, filter, and quick actions
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navigation Bar -->
      <nav class="bg-white shadow-md">
        <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-blue-600">Inventory System</h1>
          <div class="flex items-center gap-6">
            <span class="text-gray-700">Welcome, <strong>{{ currentUser }}</strong></span>
            <button
              (click)="logout()"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- Header Section -->
        <div class="mb-8">
          <h2 class="text-3xl font-bold text-gray-900 mb-2">Product Inventory</h2>
          <p class="text-gray-600">Manage your products and categories efficiently</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-4 mb-8">
          <button
            (click)="addNewProduct()"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            ➕ Add Product
          </button>
          <button
            (click)="manageCategories()"
            class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold"
          >
            📁 Categories
          </button>
          <button
            class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
          >
            📊 Reports
          </button>
        </div>

        <!-- Search & Filter Section -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- Search Input -->
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search products..."
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <!-- Category Filter -->
            <select
              [(ngModel)]="selectedCategory"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="clothing">Clothing</option>
              <option value="books">Books</option>
            </select>

            <!-- Status Filter -->
            <select
              [(ngModel)]="selectedStatus"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
            </select>

            <!-- Search Button -->
            <button
              (click)="performSearch()"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Search
            </button>
          </div>
        </div>

        <!-- Products Table -->
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-200">
              <tr>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Product Name</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">SKU</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Price</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Quantity</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let product of filteredProducts" class="border-t hover:bg-gray-50 transition">
                <td class="px-6 py-4 text-gray-900">{{ product.name }}</td>
                <td class="px-6 py-4 text-gray-600">{{ product.sku }}</td>
                <td class="px-6 py-4 text-gray-600">{{ product.category }}</td>
                <td class="px-6 py-4 font-semibold text-gray-900">\${{ product.price }}</td>
                <td class="px-6 py-4">
                  <span [ngClass]="product.quantity < product.minStock ? 'text-red-600 font-bold' : 'text-gray-900'">
                    {{ product.quantity }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span
                    [ngClass]="{
                      'bg-green-100 text-green-800': product.status === 'active',
                      'bg-yellow-100 text-yellow-800': product.status === 'inactive',
                      'bg-red-100 text-red-800': product.status === 'discontinued'
                    }"
                    class="px-3 py-1 rounded-full text-xs font-semibold"
                  >
                    {{ product.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm space-x-2">
                  <button (click)="editProduct(product.id)" class="text-blue-600 hover:underline">Edit</button>
                  <span class="text-gray-400">|</span>
                  <button (click)="deleteProduct(product.id)" class="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Empty State -->
          <div *ngIf="filteredProducts.length === 0" class="p-12 text-center">
            <p class="text-gray-500 text-lg">No products found. Try adjusting your filters.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardComponent implements OnInit {
  currentUser = 'Admin User';
  searchQuery = '';
  selectedCategory = '';
  selectedStatus = '';

  filteredProducts = [
    {
      id: '1',
      name: 'Laptop Pro 15',
      sku: 'LP-001',
      category: 'Electronics',
      price: 1299.99,
      quantity: 5,
      minStock: 10,
      status: 'active'
    },
    {
      id: '2',
      name: 'Wireless Mouse',
      sku: 'WM-002',
      category: 'Electronics',
      price: 29.99,
      quantity: 50,
      minStock: 20,
      status: 'active'
    },
    {
      id: '3',
      name: 'USB-C Cable',
      sku: 'UC-003',
      category: 'Electronics',
      price: 12.99,
      quantity: 3,
      minStock: 15,
      status: 'inactive'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    // Load products from Firebase Firestore
    // this.productService.getProducts().subscribe(...)
  }

  performSearch() {
    console.log('Search:', this.searchQuery, this.selectedCategory, this.selectedStatus);
    // Implement RxJS-based search with debounceTime and switchMap
  }

  addNewProduct() {
    this.router.navigate(['/products/new']);
  }

  editProduct(id: string) {
    this.router.navigate(['/products/edit', id]);
  }

  deleteProduct(id: string) {
    if (confirm('Are you sure you want to delete this product?')) {
      console.log('Delete product:', id);
      // Call service to delete
    }
  }

  manageCategories() {
    this.router.navigate(['/categories']);
  }

  logout() {
    console.log('Logging out...');
    // TODO: Call AuthService to logout
    this.router.navigate(['/login']);
  }
}
