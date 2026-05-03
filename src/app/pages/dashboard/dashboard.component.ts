/**
 * Dashboard Component - Improved UI with Real-time Updates
 */

import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { collection, doc, getDocs, deleteDoc, query, onSnapshot, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { ChangeDetectorRef } from '@angular/core';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen transition-colors duration-300"
         [class]="darkMode() ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gray-50'">

      <!-- Header -->
      <nav class="backdrop-blur-md sticky top-0 z-50 shadow-lg"
           [class]="darkMode() ? 'bg-slate-900/90 border-b border-slate-700' : 'bg-white/90'">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span class="text-white font-bold text-lg">📦</span>
              </div>
              <div>
                <h1 class="text-xl font-bold" [class]="darkMode() ? 'text-white' : 'text-blue-600'">Inventory System</h1>
                <p class="text-xs" [class]="darkMode() ? 'text-slate-400' : 'text-gray-400'">Manage products in real-time</p>
              </div>
            </div>
            <div class="flex items-center gap-2 sm:gap-4">
              <!-- Connection Status -->
              <div class="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full"
                   [class]="connected() ? 'bg-green-100' : 'bg-red-100'">
                <span class="w-2 h-2 rounded-full animate-pulse"
                      [class]="connected() ? 'bg-green-500' : 'bg-red-500'"></span>
                <span class="text-xs font-medium" [class]="connected() ? 'text-green-700' : 'text-red-700'">
                  {{ connected() ? 'Live' : 'Offline' }}
                </span>
              </div>
              <button (click)="toggleDark()" class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                {{ darkMode() ? '☀️' : '🌙' }}
              </button>
              <span class="hidden md:inline text-sm" [class]="darkMode() ? 'text-slate-300' : 'text-gray-600'">
                Role: <strong>{{ userRole() }}</strong>
              </span>
              <button (click)="logout()" class="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Page Header -->
        <div class="mb-6">
          <h2 class="text-2xl sm:text-3xl font-bold" [class]="darkMode() ? 'text-white' : 'text-gray-900'">Product Inventory</h2>
          <p class="mt-1" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">Manage your products and stock levels</p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="bg-white dark:bg-slate-800/80 rounded-2xl p-4 shadow-lg border transition-transform hover:scale-105">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">Total Products</p>
                <p class="text-2xl font-bold" [class]="darkMode() ? 'text-white' : 'text-gray-900'">{{ totalProducts }}</p>
              </div>
              <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <span class="text-2xl">📦</span>
              </div>
            </div>
          </div>
          <div class="bg-white dark:bg-slate-800/80 rounded-2xl p-4 shadow-lg border transition-transform hover:scale-105">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">Low Stock</p>
                <p class="text-2xl font-bold text-red-600">{{ lowStockCount }}</p>
              </div>
              <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <span class="text-2xl">⚠️</span>
              </div>
            </div>
          </div>
          <div class="bg-white dark:bg-slate-800/80 rounded-2xl p-4 shadow-lg border transition-transform hover:scale-105">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">Out of Stock</p>
                <p class="text-2xl font-bold" [class]="darkMode() ? 'text-orange-400' : 'text-orange-600'">{{ outOfStockCount }}</p>
              </div>
              <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <span class="text-2xl">🚫</span>
              </div>
            </div>
          </div>
          <div class="bg-white dark:bg-slate-800/80 rounded-2xl p-4 shadow-lg border transition-transform hover:scale-105">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">Active</p>
                <p class="text-2xl font-bold text-green-600">{{ activeCount }}</p>
              </div>
              <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <span class="text-2xl">✓</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Category Totals -->
        <div class="bg-white dark:bg-slate-800/80 rounded-2xl p-4 sm:p-6 mb-6 shadow-lg border">
          <h3 class="text-lg font-bold mb-4" [class]="darkMode() ? 'text-white' : 'text-gray-900'">Total Value by Category</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div *ngFor="let cat of getCategoryList()" class="flex flex-col p-3 rounded-xl border transition-colors"
                 [ngClass]="getCategoryColor(cat).bg + ' ' + getCategoryColor(cat).border">
              <span class="text-xs font-bold mb-1 uppercase" [ngClass]="getCategoryColor(cat).text">{{ cat }}</span>
              <span class="text-lg font-bold" [ngClass]="getCategoryColor(cat).text">{{ formatCurrency(categoryTotals[cat]) }}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-3 mb-6">
          <button (click)="addNewProduct()"
                  class="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
            <span>➕</span>
            <span class="font-medium">Add Product</span>
          </button>
          <button *ngIf="isAdmin()" (click)="batchDelete()" [disabled]="selectedProducts.size === 0"
                  class="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
            <span>🗑️</span>
            <span class="font-medium">Batch Delete ({{ selectedProducts.size }})</span>
          </button>
          <button *ngIf="isAdmin()" (click)="manageCategories()"
                  class="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
            <span>📁</span>
            <span class="font-medium">Categories</span>
          </button>
          <button *ngIf="isAdmin()" (click)="viewStockHistory()"
                  class="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl hover:from-slate-600 hover:to-slate-700 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
            <span>📋</span>
            <span class="font-medium">Stock History</span>
          </button>
          <button *ngIf="isAdmin()" (click)="manageUsers()"
                  class="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
            <span>👥</span>
            <span class="font-medium">Users</span>
          </button>
        </div>

        <!-- Filters Panel -->
        <div class="bg-white dark:bg-slate-800/80 rounded-2xl p-4 sm:p-6 mb-6 shadow-lg border">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="lg:col-span-2">
              <label class="block text-xs font-medium mb-1" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">Search Products</label>
              <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange()"
                     placeholder="Search by name or SKU..."
                     class="w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label class="block text-xs font-medium mb-1" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">Category</label>
              <select [(ngModel)]="selectedCategory" (ngModelChange)="onSearchChange()"
                      class="w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white text-gray-900">
                <option value="">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Books">Books</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium mb-1" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">Status</label>
              <select [(ngModel)]="selectedStatus" (ngModelChange)="onSearchChange()"
                      class="w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white text-gray-900">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
          </div>
          <div class="mt-4">
            <label class="block text-xs font-medium mb-1" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">Stock Level</label>
            <div class="flex flex-wrap gap-2">
              <button (click)="setStockFilter('')" [class]="getStockFilterClass('')"
                      class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors">All</button>
              <button (click)="setStockFilter('low')" [class]="getStockFilterClass('low')"
                      class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors">Low Stock</button>
              <button (click)="setStockFilter('normal')" [class]="getStockFilterClass('normal')"
                      class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors">Normal</button>
              <button (click)="setStockFilter('out')" [class]="getStockFilterClass('out')"
                      class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors">Out of Stock</button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow-lg text-center">
          <div class="animate-spin text-4xl mb-4">⏳</div>
          <p [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">Loading products...</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && filteredProducts.length === 0" class="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow-lg text-center">
          <div class="text-6xl mb-4">📦</div>
          <p class="text-lg font-medium text-blue-600 dark:text-blue-400">No products found</p>
          <p class="mt-2" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">Try adjusting your filters or add a new product</p>
          <button (click)="addNewProduct()" class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add Product
          </button>
        </div>

        <!-- Products Table -->
        <div *ngIf="!loading && filteredProducts.length > 0" class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
          <!-- Table Header -->
          <div class="px-6 py-4 border-b dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex items-center gap-3">
              <input type="checkbox" (change)="toggleSelectAll($event)" [checked]="allSelected"
                     class="w-5 h-5 rounded" />
              <span class="font-medium" [class]="darkMode() ? 'text-slate-300' : 'text-gray-700'">Select All</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">
                Showing {{ paginatedProducts.length }} of {{ filteredProducts.length }} products
              </span>
            </div>
          </div>

          <!-- Responsive Table -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">✓</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">Product</th>
                  <th class="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">Image</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">SKU</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">Category</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">Price</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">Qty</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-slate-700">
                <tr *ngFor="let product of paginatedProducts"
                    class="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                    [class]="isLowStock(product) ? 'bg-red-50 dark:bg-red-900/10' : ''">
                  <td class="px-4 py-3">
                    <input type="checkbox" [checked]="selectedProducts.has(product.id)" (change)="toggleSelect(product.id)"
                           class="w-5 h-5 rounded" />
                  </td>
                  <td class="px-4 py-3">
                    <div class="font-medium text-blue-600 dark:text-blue-400">{{ product.name }}</div>
                    <div *ngIf="isLowStock(product)" class="mt-1">
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        ⚠️ Low Stock
                      </span>
                    </div>
                  </td>
                  <td class="px-2 py-3 hidden md:table-cell">
                    <img *ngIf="product.imageUrls && product.imageUrls[0]" [src]="product.imageUrls[0]"
                         class="w-10 h-10 object-cover rounded-lg" />
                    <div *ngIf="!product.imageUrls || !product.imageUrls[0]"
                         class="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                      <span class="text-gray-400">📷</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 hidden lg:table-cell text-sm" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">{{ product.sku }}</td>
                  <td class="px-4 py-3 hidden md:table-cell">
                    <span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-600" [class]="darkMode() ? 'text-slate-300' : 'text-gray-600'">
                      {{ product.category || 'Uncategorized' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 font-semibold text-blue-600 dark:text-blue-400">
                    ₱{{ product.price | number:'1.2-2' }}
                  </td>
                  <td class="px-4 py-3">
                    <div [class]="isLowStock(product) ? 'text-red-600 font-bold' : 'text-blue-600 dark:text-blue-400'">
                      {{ product.quantity }}
                    </div>
                    <div *ngIf="product.minStock" class="text-xs" [class]="darkMode() ? 'text-slate-500' : 'text-gray-400'">
                      min: {{ product.minStock }}
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span [class]="getStatusClass(product.status)">{{ product.status }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <button *ngIf="isAdmin()" (click)="editProduct(product.id)" class="text-blue-600 hover:text-blue-800 font-medium text-sm">Edit</button>
                      <button *ngIf="isAdmin()" (click)="confirmDelete($event, product.id)" class="text-red-600 hover:text-red-800 font-medium text-sm">Delete</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="px-6 py-4 border-t dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-2">
              <span class="text-sm" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">Items per page:</span>
              <select [(ngModel)]="itemsPerPage" (ngModelChange)="onItemsPerPageChange()"
                      class="px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm text-gray-900">
                <option [value]="5">5</option>
                <option [value]="10">10</option>
                <option [value]="25">25</option>
                <option [value]="50">50</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <button (click)="goToPage(1)" [disabled]="currentPage === 1"
                      class="px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white hover:bg-gray-100 disabled:opacity-50 text-gray-700">««</button>
              <button (click)="prevPage()" [disabled]="currentPage === 1"
                      class="px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white hover:bg-gray-100 disabled:opacity-50 text-gray-700">«</button>
              <span class="px-3 py-1.5" [class]="darkMode() ? 'text-slate-300' : 'text-gray-700'">
                {{ currentPage }} / {{ totalPages }}
              </span>
              <button (click)="nextPage()" [disabled]="currentPage >= totalPages"
                      class="px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white hover:bg-gray-100 disabled:opacity-50 text-gray-700">»</button>
              <button (click)="goToPage(totalPages)" [disabled]="currentPage >= totalPages"
                      class="px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white hover:bg-gray-100 disabled:opacity-50 text-gray-700">»»</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .dark-input { background-color: #374151; color: white; border-color: #4b5563; }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  darkMode = signal(false);
  connected = signal(false);
  userRole = signal('user');
  currentUser = 'User';
  currentUserId = '';
  private db: any = null;
  private unsubscribe: (() => void) | null = null;

  // Quick filters
  stockFilter = '';

  // Data
  searchQuery = '';
  selectedCategory = '';
  selectedStatus = '';
  products: any[] = [];
  filteredProducts: any[] = [];
  loading = true;

  // Stats
  totalProducts = 0;
  lowStockCount = 0;
  outOfStockCount = 0;
  activeCount = 0;
  categoryTotals: { [category: string]: number } = {};

  // Batch delete
  selectedProducts = new Set<string>();
  allSelected = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  paginatedProducts: any[] = [];

  constructor(private router: Router, private cdr: ChangeDetectorRef) {
    if (localStorage.getItem('darkMode') === 'true') this.darkMode.set(true);
  }

  ngOnInit() {
    this.db = FirebaseService.getFirestore();
    this.checkUserRole();
    this.subscribeToProducts();
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  subscribeToProducts() {
    this.loading = true;
    this.db = FirebaseService.getFirestore();
    if (!this.db) {
      this.loading = false;
      return;
    }

    // Real-time listener
    const q = query(collection(this.db, 'products'));
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      this.products = [];
      snapshot.forEach((doc: any) => {
        this.products.push({ id: doc.id, ...doc.data() });
      });

      this.connected.set(true);
      this.calculateStats();
      this.applyFilters();
      this.loading = false;
      this.cdr.detectChanges();
    }, (error) => {
      console.error('Real-time error:', error);
      this.connected.set(false);
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  calculateStats() {
    this.totalProducts = this.products.length;
    this.lowStockCount = this.products.filter(p => this.isLowStock(p)).length;
    this.outOfStockCount = this.products.filter(p => p.quantity === 0).length;
    this.activeCount = this.products.filter(p => p.status === 'active').length;

    // Calculate total value per category
    this.categoryTotals = {};
    this.products.forEach(p => {
      const category = p.category || 'Uncategorized';
      const value = (p.price || 0) * (p.quantity || 0);
      if (!this.categoryTotals[category]) {
        this.categoryTotals[category] = 0;
      }
      this.categoryTotals[category] += value;
    });
  }

  async checkUserRole() {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.currentUser = user.email || 'User';
        this.currentUserId = user.uid;
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const db = FirebaseService.getFirestore();
          if (db) {
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              this.userRole.set(data['role'] || 'user');
            }
          }
        } catch { this.userRole.set('user'); }
      }
    });
  }

  toggleDark() {
    this.darkMode.update(v => !v);
    localStorage.setItem('darkMode', String(this.darkMode()));
  }

  isAdmin() { return this.userRole() === 'admin'; }

  getStatusClass(status: string) {
    const dark = this.darkMode();
    switch(status) {
      case 'active': return dark
        ? 'px-3 py-1 rounded-full text-xs font-semibold bg-green-900/50 text-green-400'
        : 'px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700';
      case 'inactive': return dark
        ? 'px-3 py-1 rounded-full text-xs font-semibold bg-yellow-900/50 text-yellow-400'
        : 'px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700';
      case 'discontinued': return dark
        ? 'px-3 py-1 rounded-full text-xs font-semibold bg-red-900/50 text-red-400'
        : 'px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700';
      default: return dark
        ? 'px-3 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-300'
        : 'px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700';
    }
  }

  getStockFilterClass(filter: string) {
    const base = 'px-4 py-1.5 rounded-full text-sm font-medium transition-colors';
    if (this.stockFilter === filter) {
      return base + ' bg-blue-600 text-white';
    }
    return base + (this.darkMode() ? ' bg-slate-700 text-slate-300 hover:bg-slate-600' : ' bg-gray-100 text-gray-600 hover:bg-gray-200');
  }

  formatCurrency(value: number): string {
    return '₱' + value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getCategoryList(): string[] {
    return Object.keys(this.categoryTotals).sort();
  }

  getCategoryColor(category: string): { bg: string; text: string; border: string; badge: string } {
    const colors: { [key: string]: { bg: string; text: string; border: string; badge: string } } = {
      'Electronics': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
      'Clothing': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300' },
      'Books': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
      'Other': { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-300 dark:border-gray-600', badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
      'Uncategorized': { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-600', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' }
    };
    return colors[category] || colors['Other'];
  }

  setStockFilter(filter: string) {
    this.stockFilter = filter;
    this.onSearchChange();
  }

  isLowStock(product: any): boolean {
    const minStock = product.minStock || 10;
    return product.quantity <= minStock;
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFilters();
    this.cdr.detectChanges();
  }

  applyFilters() {
    this.filteredProducts = this.products.filter(p => {
      const matchesSearch = !this.searchQuery ||
        p.name?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesCategory = !this.selectedCategory || p.category?.toLowerCase() === this.selectedCategory.toLowerCase();
      const matchesStatus = !this.selectedStatus || p.status === this.selectedStatus;

      const minStock = p.minStock || 10;
      let matchesStock = true;
      if (this.stockFilter === 'low') {
        matchesStock = p.quantity <= minStock && p.quantity > 0;
      } else if (this.stockFilter === 'normal') {
        matchesStock = p.quantity > minStock;
      } else if (this.stockFilter === 'out') {
        matchesStock = p.quantity === 0;
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesStock;
    });

    this.calculateStats();
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.max(1, Math.ceil(this.filteredProducts.length / this.itemsPerPage));
    if (this.currentPage > this.totalPages) this.currentPage = 1;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedProducts = this.filteredProducts.slice(start, end);
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.updatePagination();
    this.cdr.detectChanges();
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
      this.cdr.detectChanges();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
      this.cdr.detectChanges();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      this.cdr.detectChanges();
    }
  }

  addNewProduct() { this.router.navigate(['/products/new']); }
  editProduct(id: string) { this.router.navigate(['/products/edit', id]); }

  toggleSelect(id: string) {
    if (this.selectedProducts.has(id)) {
      this.selectedProducts.delete(id);
    } else {
      this.selectedProducts.add(id);
    }
    this.updateSelectAllState();
    this.cdr.detectChanges();
  }

  toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.paginatedProducts.forEach(p => this.selectedProducts.add(p.id));
      this.allSelected = true;
    } else {
      this.selectedProducts.clear();
      this.allSelected = false;
    }
    this.cdr.detectChanges();
  }

  updateSelectAllState() {
    this.allSelected = this.paginatedProducts.length > 0 &&
      this.paginatedProducts.every(p => this.selectedProducts.has(p.id));
  }

  async batchDelete() {
    if (this.selectedProducts.size === 0) return;
    if (!confirm(`Delete ${this.selectedProducts.size} selected products?`)) return;

    try {
      const db = this.db || FirebaseService.getFirestore();
      if (!db) {
        console.error('Firestore not initialized');
        return;
      }
      const { deleteDoc, doc, collection, addDoc, serverTimestamp } = await import('firebase/firestore');

      // Delete each product and log to stock history
      for (const id of this.selectedProducts) {
        const product = this.products.find(p => p.id === id);
        const productQty = product ? product.quantity : 0;
        const productName = product ? product.name : 'Unknown';

        // Always log delete action
        await addDoc(collection(db, 'stockHistory'), {
          productId: id,
          productName: productName,
          action: 'product_delete',
          quantity: productQty,
          previousQuantity: productQty,
          newQuantity: 0,
          userId: this.currentUserId || 'system',
          userEmail: this.currentUser || '',
          timestamp: serverTimestamp(),
          note: 'Product deleted via batch delete'
        });

        // Delete the product
        await deleteDoc(doc(db, 'products', id));
      }
      this.products = this.products.filter(p => !this.selectedProducts.has(p.id));
      this.selectedProducts.clear();
      this.allSelected = false;
      this.applyFilters();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Batch delete error:', error);
    }
  }

  confirmDelete(event: Event, id: string) {
    event.stopPropagation();
    if (confirm('Delete this product?')) this.deleteProduct(id);
  }

  async deleteProduct(id: string) {
    try {
      const db = this.db || FirebaseService.getFirestore();
      if (!db) {
        console.error('Firestore not initialized');
        return;
      }
      // Find product before deleting
      const product = this.products.find(p => p.id === id);
      const productQty = product ? product.quantity : 0;
      const productName = product ? product.name : 'Unknown';
      const { doc, deleteDoc, collection, addDoc, serverTimestamp } = await import('firebase/firestore');

      // Always log delete action
      await addDoc(collection(db, 'stockHistory'), {
        productId: id,
        productName: productName,
        action: 'product_delete',
        quantity: productQty,
        previousQuantity: productQty,
        newQuantity: 0,
        userId: this.currentUserId || 'system',
        userEmail: this.currentUser || '',
        timestamp: serverTimestamp(),
        note: 'Product deleted via dashboard'
      });

      // Delete the product
      await deleteDoc(doc(db, 'products', id));

      this.products = this.products.filter(p => p.id !== id);
      this.selectedProducts.delete(id);
      this.applyFilters();
      this.cdr.detectChanges();
    } catch (error) { console.error('Error:', error); }
  }

  manageCategories() { this.router.navigate(['/categories']); }
  viewStockHistory() { this.router.navigate(['/stockHistory']); }

  manageUsers() { this.router.navigate(['/users']); }

  async logout() {
    const auth = getAuth();
    await signOut(auth);
    this.router.navigate(['/login']);
  }
}