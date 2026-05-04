import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { collection, doc, query, onSnapshot, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ChangeDetectorRef } from '@angular/core';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen transition-colors duration-300 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <!-- Header -->
      <nav class="backdrop-blur-md sticky top-0 z-50 shadow-lg bg-slate-900/90 border-b border-slate-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span class="text-white font-bold text-lg">📦</span>
              </div>
              <div>
                <h1 class="text-xl font-bold text-white">Inventory Dashboard</h1>
                <p class="text-xs text-slate-400">Manage products in real-time</p>
              </div>
            </div>
            <div class="flex items-center gap-2 sm:gap-4">
              <!-- Connection Status -->
              <div class="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full"
                   [class]="connected() ? 'bg-green-100/80' : 'bg-red-100/80'">
                <span class="w-2 h-2 rounded-full animate-pulse"
                      [class]="connected() ? 'bg-green-500' : 'bg-red-500'"></span>
                <span class="text-xs font-medium" [class]="connected() ? 'text-green-700' : 'text-red-700'">
                  {{ connected() ? 'Live' : 'Offline' }}
                </span>
              </div>
              <!-- User Role -->
              <span class="hidden md:inline text-sm text-slate-300">
                Role: <strong>{{ userRole() }}</strong>
              </span>
              <button (click)="logout()" class="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-colors">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Page Header -->
        <div class="mb-6">
          <h2 class="text-2xl sm:text-3xl font-bold text-white">Product Inventory</h2>
          <p class="mt-1 text-slate-400">Manage your products and stock levels</p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-slate-700 transition-transform hover:scale-105">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-slate-400">Total Products</p>
                <p class="text-2xl font-bold text-white">{{ totalProducts }}</p>
              </div>
              <div class="w-12 h-12 bg-blue-900/30 rounded-xl flex items-center justify-center">
                <span class="text-2xl">📦</span>
              </div>
            </div>
          </div>
          <div class="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-slate-700 transition-transform hover:scale-105">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-slate-400">Low Stock</p>
                <p class="text-2xl font-bold text-red-600">{{ lowStockCount }}</p>
              </div>
              <div class="w-12 h-12 bg-red-900/30 rounded-xl flex items-center justify-center">
                <span class="text-2xl">⚠️</span>
              </div>
            </div>
          </div>
          <div class="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-slate-700 transition-transform hover:scale-105">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-slate-400">Out of Stock</p>
                <p class="text-2xl font-bold text-orange-400">{{ outOfStockCount }}</p>
              </div>
              <div class="w-12 h-12 bg-orange-900/30 rounded-xl flex items-center justify-center">
                <span class="text-2xl">🚫</span>
              </div>
            </div>
          </div>
          <div class="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-slate-700 transition-transform hover:scale-105">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-slate-400">Active</p>
                <p class="text-2xl font-bold text-green-600">{{ activeCount }}</p>
              </div>
              <div class="w-12 h-12 bg-green-900/30 rounded-xl flex items-center justify-center">
                <span class="text-2xl">✓</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Category Totals -->
        <div class="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 shadow-lg border border-slate-700">
          <h3 class="text-lg font-bold mb-4 text-white">Total Value by Category</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div *ngFor="let cat of getCategoryList()" class="flex flex-col p-3 rounded-xl border transition-colors"
                 [ngClass]="getCategoryColor(cat).bgDark + ' ' + getCategoryColor(cat).borderDark">
              <span class="text-xs font-bold mb-1 uppercase" [ngClass]="getCategoryColor(cat).textDark">{{ cat }}</span>
              <span class="text-lg font-bold" [ngClass]="getCategoryColor(cat).textDark">{{ formatCurrency(categoryTotals[cat]) }}</span>
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
        <div class="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 shadow-lg border border-slate-700">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="lg:col-span-2">
              <label class="block text-xs font-medium mb-1 text-slate-400">Search Products</label>
              <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange()"
                     placeholder="Search by name or SKU..."
                     class="w-full px-4 py-2.5 border rounded-xl bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label class="block text-xs font-medium mb-1 text-slate-400">Category</label>
              <select [(ngModel)]="selectedCategory" (ngModelChange)="onSearchChange()"
                      class="w-full px-4 py-2.5 border rounded-xl bg-slate-700 border-slate-600 text-white">
                <option value="">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Books">Books</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium mb-1 text-slate-400">Status</label>
              <select [(ngModel)]="selectedStatus" (ngModelChange)="onSearchChange()"
                      class="w-full px-4 py-2.5 border rounded-xl bg-slate-700 border-slate-600 text-white">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
          </div>
          <div class="mt-4">
            <label class="block text-xs font-medium mb-1 text-slate-400">Stock Level</label>
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
        <div *ngIf="loading" class="bg-slate-800 rounded-2xl p-12 shadow-lg text-center">
          <div class="animate-spin text-4xl mb-4">⏳</div>
          <p class="text-slate-400">Loading products...</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && filteredProducts.length === 0" class="bg-slate-800 rounded-2xl p-12 shadow-lg text-center">
          <div class="text-6xl mb-4">📦</div>
          <p class="text-lg font-medium text-blue-400">No products found</p>
          <p class="mt-2 text-slate-400">Try adjusting your filters or add a new product</p>
          <button (click)="addNewProduct()" class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add Product
          </button>
        </div>

        <!-- Products Table -->
        <div *ngIf="!loading && filteredProducts.length > 0" class="bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
          <!-- Table Header -->
          <div class="px-6 py-4 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex items-center gap-3">
              <input type="checkbox" (change)="toggleSelectAll($event)" [checked]="allSelected"
                     class="w-5 h-5 rounded" />
              <span class="font-medium text-slate-300">Select All</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm text-slate-400">
                Showing {{ paginatedProducts.length }} of {{ filteredProducts.length }} products
              </span>
            </div>
          </div>

          <!-- Responsive Table -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-700/50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">✓</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Product</th>
                  <th class="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell text-slate-400">Image</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden lg:table-cell text-slate-400">SKU</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider hidden md:table-cell text-slate-400">Category</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Price</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Qty</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-700">
                <tr *ngFor="let product of paginatedProducts"
                    class="hover:bg-slate-700/30 transition-colors"
                    [class]="isLowStock(product) ? 'bg-red-900/10' : ''">
                  <td class="px-4 py-3">
                    <input type="checkbox" [checked]="selectedProducts.has(product.id)" (change)="toggleSelect(product.id)"
                           class="w-5 h-5 rounded" />
                  </td>
                  <td class="px-4 py-3">
                    <div class="font-medium text-blue-400">{{ product.name }}</div>
                    <div *ngIf="isLowStock(product)" class="mt-1">
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-400">
                        ⚠️ Low Stock
                      </span>
                    </div>
                  </td>
                  <td class="px-2 py-3 hidden md:table-cell">
                    <img *ngIf="product.imageUrls && product.imageUrls[0]" [src]="product.imageUrls[0]"
                         class="w-10 h-10 object-cover rounded-lg" />
                    <div *ngIf="!product.imageUrls || !product.imageUrls[0]"
                         class="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                      <span class="text-slate-400">📷</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 hidden lg:table-cell text-sm text-slate-400">{{ product.sku }}</td>
                  <td class="px-4 py-3 hidden md:table-cell">
                    <span class="px-2 py-1 rounded-full text-xs font-medium bg-slate-600 text-slate-300">
                      {{ product.category || 'Uncategorized' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 font-semibold text-blue-400">
                    ₱{{ product.price | number:'1.2-2' }}
                  </td>
                  <td class="px-4 py-3">
                    <div [class]="isLowStock(product) ? 'text-red-600 font-bold' : 'text-blue-400'">
                      {{ product.quantity }}
                    </div>
                    <div *ngIf="product.minStock" class="text-xs text-slate-500">
                      min: {{ product.minStock }}
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span [class]="getStatusClass(product.status)">{{ product.status }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <button *ngIf="isAdmin()" (click)="editProduct(product.id)" class="text-blue-400 hover:text-blue-300 font-medium text-sm">Edit</button>
                      <button *ngIf="isAdmin()" (click)="confirmDelete($event, product.id)" class="text-red-400 hover:text-red-300 font-medium text-sm">Delete</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="px-6 py-4 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-2">
              <span class="text-sm text-slate-400">Items per page:</span>
              <select [(ngModel)]="itemsPerPage" (ngModelChange)="onItemsPerPageChange()"
                      class="px-3 py-1.5 border rounded-lg bg-slate-700 border-slate-600 text-white text-sm">
                <option [value]="5">5</option>
                <option [value]="10">10</option>
                <option [value]="25">25</option>
                <option [value]="50">50</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <button (click)="goToPage(1)" [disabled]="currentPage === 1"
                      class="px-3 py-1.5 border rounded-lg bg-slate-700 border-slate-600 text-white hover:bg-slate-600 disabled:opacity-50 transition-colors">««</button>
              <button (click)="prevPage()" [disabled]="currentPage === 1"
                      class="px-3 py-1.5 border rounded-lg bg-slate-700 border-slate-600 text-white hover:bg-slate-600 disabled:opacity-50 transition-colors">«</button>
              <span class="px-3 py-1.5 text-slate-300">
                {{ currentPage }} / {{ totalPages }}
              </span>
              <button (click)="nextPage()" [disabled]="currentPage >= totalPages"
                      class="px-3 py-1.5 border rounded-lg bg-slate-700 border-slate-600 text-white hover:bg-slate-600 disabled:opacity-50 transition-colors">»</button>
              <button (click)="goToPage(totalPages)" [disabled]="currentPage >= totalPages"
                      class="px-3 py-1.5 border rounded-lg bg-slate-700 border-slate-600 text-white hover:bg-slate-600 disabled:opacity-50 transition-colors">»»</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .dark-input { 
      background-color: #374151; 
      color: white; 
      border-color: #4b5563; 
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Dark mode always enabled
  darkMode = signal(true);

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
    // Load persisted pagination
    const savedPageSize = localStorage.getItem('itemsPerPage');
    if (savedPageSize) {
      this.itemsPerPage = parseInt(savedPageSize, 10);
    }
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

  // ... rest of methods unchanged except the ones below

  isAdmin() { 
    return this.userRole() === 'admin'; 
  }

  getStatusClass(status: string) {
    // Dark mode only status classes
    switch(status) {
      case 'active': 
        return 'px-3 py-1 rounded-full text-xs font-semibold bg-green-900/50 text-green-400';
      case 'inactive': 
        return 'px-3 py-1 rounded-full text-xs font-semibold bg-yellow-900/50 text-yellow-400';
      case 'discontinued': 
        return 'px-3 py-1 rounded-full text-xs font-semibold bg-red-900/50 text-red-400';
      default: 
        return 'px-3 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-300';
    }
  }

  getStockFilterClass(filter: string) {
    const base = 'px-4 py-1.5 rounded-full text-sm font-medium transition-colors';
    if (this.stockFilter === filter) {
      return base + ' bg-blue-600 text-white';
    }
    return base + ' bg-slate-700 text-slate-300 hover:bg-slate-600';
  }

  getCategoryColor(category: string): { bgDark: string; textDark: string; borderDark: string } {
    const colors: { [key: string]: { bgDark: string; textDark: string; borderDark: string } } = {
      'Electronics': { 
        bgDark: 'bg-blue-900/30', 
        textDark: 'text-blue-300', 
        borderDark: 'border-blue-700' 
      },
      'Clothing': { 
        bgDark: 'bg-purple-900/30', 
        textDark: 'text-purple-300', 
        borderDark: 'border-purple-700' 
      },
      'Books': { 
        bgDark: 'bg-amber-900/30', 
        textDark: 'text-amber-300', 
        borderDark: 'border-amber-700' 
      },
      'Other': { 
        bgDark: 'bg-slate-700', 
        textDark: 'text-slate-300', 
        borderDark: 'border-slate-600' 
      },
      'Uncategorized': { 
        bgDark: 'bg-slate-700', 
        textDark: 'text-slate-300', 
        borderDark: 'border-slate-600' 
      }
    };
    return colors[category] || colors['Other'];
  }

  formatCurrency(value: number): string {
    return '₱' + value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getCategoryList(): string[] {
    return Object.keys(this.categoryTotals).sort();
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
    if (!this.itemsPerPage || this.itemsPerPage <= 0) {
      this.itemsPerPage = 10;
    }
    
    this.totalPages = Math.max(1, Math.ceil(this.filteredProducts.length / this.itemsPerPage));
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = Math.min(start + this.itemsPerPage, this.filteredProducts.length);
    
    this.paginatedProducts = this.filteredProducts.slice(start, end);
  }

  onItemsPerPageChange() {
    localStorage.setItem('itemsPerPage', this.itemsPerPage.toString());
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

      for (const id of this.selectedProducts) {
        const product = this.products.find(p => p.id === id);
        const productQty = product ? product.quantity : 0;
        const productName = product ? product.name : 'Unknown';

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
      
      const product = this.products.find(p => p.id === id);
      const productQty = product ? product.quantity : 0;
      const productName = product ? product.name : 'Unknown';

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

      await deleteDoc(doc(db, 'products', id));

      this.products = this.products.filter(p => p.id !== id);
      this.selectedProducts.delete(id);
      this.applyFilters();
      this.cdr.detectChanges();
    } catch (error) { 
      console.error('Error:', error); 
    }
  }

  manageCategories() { this.router.navigate(['/categories']); }
  viewStockHistory() { this.router.navigate(['/stockHistory']); }
  manageUsers() { this.router.navigate(['/users']); }

  async logout() {
    const auth = getAuth();
    await signOut(auth);
    this.router.navigate(['/login']);
  }

subscribeToProducts() {
    this.loading = true;
    this.db = FirebaseService.getFirestore();
    if (!this.db) {
      this.loading = false;
      return;
    }

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

    this.categoryTotals = {};
    this.products.forEach(p => {
      const category = p.category || 'Uncategorized';
      const value = (p.price || 0) * (p.quantity || 0);
      this.categoryTotals[category] = (this.categoryTotals[category] || 0) + value;
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
        } catch { 
          this.userRole.set('user'); 
        }
      }
    });
  }
}

