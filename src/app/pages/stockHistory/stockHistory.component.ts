/**
 * Stock History Component
 * Real-time stock movement history from Firebase
 */

import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { collection, query, orderBy, limit, onSnapshot, where, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';

interface StockHistoryEntry {
  id: string;
  productId: string;
  productName: string;
  action: string;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  userId: string;
  userEmail: string;
  timestamp: any;
  note?: string;
}

@Component({
  selector: 'app-stockHistory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); min-height: 100vh;">
      <!-- Header -->
      <nav class="bg-slate-900/90 backdrop-blur-md shadow-lg border-b border-slate-700">
        <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div class="flex items-center gap-4">
            <button (click)="goBack()" class="text-2xl hover:scale-110 transition-transform">←</button>
            <div>
              <h1 class="text-2xl font-bold text-blue-400">Stock History</h1>
              <p class="text-xs text-slate-400">Real-time inventory movements</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" [class.bg-green-500]="connected" [class.bg-red-500]="!connected"></span>
              <span class="text-xs text-slate-400">{{ connected ? 'Live' : 'Offline' }}</span>
            </div>
            <button (click)="logout()" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Logout</button>
          </div>
        </div>
      </nav>

      <div class="max-w-7xl mx-auto px-4 py-6">
        <!-- Stats Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-slate-800 rounded-xl p-4 shadow-md border border-slate-700">
            <p class="text-xs text-slate-400">Total Entries</p>
            <p class="text-2xl font-bold text-white">{{ totalEntries }}</p>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 shadow-md border border-slate-700">
            <p class="text-xs text-slate-400">Stock Ins</p>
            <p class="text-2xl font-bold text-green-400">{{ stockIns }}</p>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 shadow-md border border-slate-700">
            <p class="text-xs text-slate-400">Stock Outs</p>
            <p class="text-2xl font-bold text-red-400">{{ stockOuts }}</p>
          </div>
          <div class="bg-slate-800 rounded-xl p-4 shadow-md border border-slate-700">
            <p class="text-xs text-slate-400">Adjustments</p>
            <p class="text-2xl font-bold text-blue-400">{{ adjustments }}</p>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-slate-800 rounded-xl p-4 mb-6 shadow-md border border-slate-700">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div class="sm:col-span-2">
              <label class="text-xs text-slate-400 block mb-1">Search Product</label>
              <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="filterData()"
                     placeholder="Search by product name..."
                     class="w-full px-4 py-2 border rounded-lg bg-slate-700 border-slate-600 text-white placeholder-slate-400" />
            </div>
            <div>
              <label class="text-xs text-slate-400 block mb-1">Action Type</label>
              <select [(ngModel)]="filterAction" (ngModelChange)="filterData()"
                      class="w-full px-4 py-2 border rounded-lg bg-slate-700 border-slate-600 text-white">
                <option value="">All Actions</option>
                <option value="stock_in">Stock In</option>
                <option value="stock_out">Stock Out</option>
                <option value="product_edit">Edit</option>
                <option value="product_delete">Delete</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>
            <div>
              <label class="text-xs text-slate-400 block mb-1">Date Range</label>
              <select [(ngModel)]="dateRange" (ngModelChange)="filterData()"
                      class="w-full px-4 py-2 border rounded-lg bg-slate-700 border-slate-600 text-white">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <div>
              <label class="text-xs text-slate-400 block mb-1">Items</label>
              <select [(ngModel)]="pageSize" (ngModelChange)="updatePagination()"
                      class="w-full px-4 py-2 border rounded-lg bg-slate-700 border-slate-600 text-white">
                <option [value]="10">10</option>
                <option [value]="25">25</option>
                <option [value]="50">50</option>
                <option [value]="100">100</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Real-time indicator -->
        <div *ngIf="recentUpdate" class="bg-green-900/30 border border-green-700 rounded-lg p-3 mb-4 flex items-center gap-2">
          <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span class="text-sm text-green-400">Updated just now</span>
        </div>

        <!-- Loading -->
        <div *ngIf="loading" class="bg-slate-800 rounded-xl p-12 shadow-md border border-slate-700 text-center">
          <div class="animate-spin text-4xl mb-4">⏳</div>
          <p class="text-slate-400">Loading stock history...</p>
        </div>

        <!-- No Data -->
        <div *ngIf="!loading && filteredData.length === 0" class="bg-slate-800 rounded-xl p-12 shadow-md border border-slate-700 text-center">
          <div class="text-4xl mb-4">📦</div>
          <p class="text-slate-400">No stock history found</p>
          <p class="text-xs text-slate-500 mt-2">Stock movements will appear here when you add or update products</p>
        </div>

        <!-- History Table -->
        <div *ngIf="!loading && filteredData.length > 0" class="bg-slate-800 rounded-xl shadow-md overflow-hidden border border-slate-700">
          <!-- Batch Delete Header -->
          <div *ngIf="isAdmin()" class="px-4 py-3 border-b border-slate-700 flex items-center gap-3">
            <input type="checkbox" (change)="toggleSelectAll($event)" [checked]="allSelected"
                   class="w-5 h-5 rounded" />
            <span class="text-sm text-slate-300">Select All</span>
            <button *ngIf="selectedLogs.size > 0" (click)="confirmBatchDelete()"
                    class="ml-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
              Delete Selected ({{ selectedLogs.size }})
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-700/50">
                <tr>
                  <th *ngIf="isAdmin()" class="px-4 py-3 text-left text-xs font-semibold text-slate-400">✓</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-slate-400">Time</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-slate-400">Product</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-slate-400">Action</th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-slate-400">Qty Change</th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-slate-400">Prev → New</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-slate-400">User</th>
                  <th class="px-4 py-3 text-left text-xs font-semibold text-slate-400">Note</th>
                  <th *ngIf="isAdmin()" class="px-4 py-3 text-left text-xs font-semibold text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let entry of paginatedData"
                    class="border-t border-slate-700 hover:bg-slate-700/30 transition-colors">
                  <td *ngIf="isAdmin()" class="px-4 py-3">
                    <input type="checkbox" [checked]="selectedLogs.has(entry.id)" (change)="toggleSelectLog(entry.id)"
                           class="w-5 h-5 rounded" />
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-300">
                    <div class="font-medium text-white">{{ formatDate(entry.timestamp) }}</div>
                    <div class="text-xs text-slate-500">{{ formatTime(entry.timestamp) }}</div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="font-medium text-white">{{ entry.productName }}</div>
                    <div class="text-xs text-slate-500">{{ entry.productId.substring(0, 8) }}...</div>
                  </td>
                  <td class="px-4 py-3">
                    <span [class]="getActionBadge(entry.action)">{{ getActionLabel(entry.action) }}</span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <span [class]="entry.action === 'stock_in' ? 'text-green-400' : entry.action === 'stock_out' ? 'text-red-400' : entry.action === 'product_edit' ? 'text-purple-400' : entry.action === 'product_delete' ? 'text-red-400' : 'text-blue-400'"
                          class="font-bold">
                      {{ entry.action === 'stock_out' ? '-' : '' }}{{ entry.action === 'product_edit' ? '-' : '' }}{{ entry.action === 'product_delete' ? '-' : '' }}{{ entry.quantity }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right text-sm text-slate-300">
                    {{ entry.previousQuantity }} → {{ entry.newQuantity }}
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-300">
                    {{ entry.userEmail || entry.userId.substring(0, 8) }}
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-400">
                    {{ entry.note || '-' }}
                  </td>
                  <td *ngIf="isAdmin()" class="px-4 py-3">
                    <button (click)="confirmDeleteLog(entry)" class="text-red-400 hover:text-red-300 text-sm font-medium">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="px-6 py-4 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="text-sm text-slate-400">
              Showing {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredData.length) }}
              of {{ filteredData.length }}
            </div>
            <div class="flex items-center gap-2">
              <button (click)="goToPage(1)" [disabled]="currentPage === 1"
                      class="px-3 py-1 border border-slate-600 rounded bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-50">««</button>
              <button (click)="prevPage()" [disabled]="currentPage === 1"
                      class="px-3 py-1 border border-slate-600 rounded bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-50">«</button>
              <span class="px-3 py-1 text-slate-300">Page {{ currentPage }} of {{ totalPages }}</span>
              <button (click)="nextPage()" [disabled]="currentPage >= totalPages"
                      class="px-3 py-1 border border-slate-600 rounded bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-50">»</button>
              <button (click)="goToPage(totalPages)" [disabled]="currentPage >= totalPages"
                      class="px-3 py-1 border border-slate-600 rounded bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-50">»»</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StockHistoryComponent implements OnInit, OnDestroy {
  loading = true;
  connected = false;
  recentUpdate = false;
  userRole = signal('user');

  // Data
  allData: StockHistoryEntry[] = [];
  filteredData: StockHistoryEntry[] = [];
  paginatedData: StockHistoryEntry[] = [];

  // Stats
  totalEntries = 0;
  stockIns = 0;
  stockOuts = 0;
  adjustments = 0;

  // Filters
  searchQuery = '';
  filterAction = '';
  dateRange = 'all';
  pageSize = 25;

  // Pagination
  currentPage = 1;

  // Batch delete
  selectedLogs = new Set<string>();
  allSelected = false;
  totalPages = 1;

  Math = Math;
  private unsubscribe: (() => void) | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.checkUserRole();
    this.subscribeToStockHistory();
  }

  async checkUserRole() {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
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

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  subscribeToStockHistory() {
    this.loading = true;
    const db = FirebaseService.getFirestore();
    if (!db) {
      this.loading = false;
      return;
    }

    // Real-time listener on stockHistory collection
    const q = query(
      collection(db, 'stockHistory'),
      orderBy('timestamp', 'desc'),
      limit(500)
    );

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      this.allData = [];
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        this.allData.push({
          id: doc.id,
          productId: data.productId || '',
          productName: data.productName || 'Unknown Product',
          action: data.action || 'adjustment',
          quantity: data.quantity || 0,
          previousQuantity: data.previousQuantity || 0,
          newQuantity: data.newQuantity || 0,
          userId: data.userId || '',
          userEmail: data.userEmail || '',
          timestamp: data.timestamp || null,
          note: data.note || ''
        });
      });

      this.connected = true;
      this.recentUpdate = true;
      setTimeout(() => { this.recentUpdate = false; }, 3000);

      this.calculateStats();
      this.filterData();
      this.loading = false;
      this.cdr.detectChanges();
    }, (error) => {
      console.error('Real-time subscription error:', error);
      this.connected = false;
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  calculateStats() {
    this.totalEntries = this.allData.length;
    this.stockIns = this.allData.filter(d => d.action === 'stock_in').length;
    this.stockOuts = this.allData.filter(d => d.action === 'stock_out').length;
    this.adjustments = this.allData.filter(d => d.action === 'adjustment').length;
  }

  filterData() {
    let data = [...this.allData];

    // Search filter
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      data = data.filter(d =>
        d.productName.toLowerCase().includes(q) ||
        d.productId.toLowerCase().includes(q)
      );
    }

    // Action filter
    if (this.filterAction) {
      data = data.filter(d => d.action === this.filterAction);
    }

    // Date filter
    if (this.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      data = data.filter(d => {
        if (!d.timestamp) return false;
        const entryDate = d.timestamp.toDate ? d.timestamp.toDate() : new Date(d.timestamp.seconds * 1000);

        switch (this.dateRange) {
          case 'today':
            return entryDate >= today;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return entryDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return entryDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    this.filteredData = data;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.max(1, Math.ceil(this.filteredData.length / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = 1;
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedData = this.filteredData.slice(start, end);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString();
  }

  formatTime(timestamp: any): string {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getActionLabel(action: string): string {
    switch (action) {
      case 'stock_in': return '📥 In';
      case 'stock_out': return '📤 Out';
      case 'adjustment': return '✏️ Adj';
      case 'product_edit': return '📝 Edit';
      case 'product_delete': return '🗑️ Delete';
      default: return action;
    }
  }

  getActionBadge(action: string): string {
    switch (action) {
      case 'stock_in':
        return 'px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'stock_out':
        return 'px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'adjustment':
        return 'px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'product_edit':
        return 'px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'product_delete':
        return 'px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default:
        return 'px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700';
    }
  }

  goBack() {
    window.history.back();
  }

  isAdmin() {
    return this.userRole() === 'admin';
  }

  async confirmDeleteLog(entry: StockHistoryEntry) {
    if (!confirm('Delete this stock history log?')) return;
    if (!confirm('Are you sure? This cannot be undone.')) return;

    try {
      const db = FirebaseService.getFirestore();
      if (!db) {
        console.error('Firestore not initialized');
        return;
      }
      await deleteDoc(doc(db, 'stockHistory', entry.id));
      // Remove from local data
      this.allData = this.allData.filter(d => d.id !== entry.id);
      this.filterData();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  }

  toggleSelectLog(id: string) {
    if (this.selectedLogs.has(id)) {
      this.selectedLogs.delete(id);
    } else {
      this.selectedLogs.add(id);
    }
    this.updateSelectAllState();
    this.cdr.detectChanges();
  }

  toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.paginatedData.forEach(p => this.selectedLogs.add(p.id));
      this.allSelected = true;
    } else {
      this.selectedLogs.clear();
      this.allSelected = false;
    }
    this.cdr.detectChanges();
  }

  updateSelectAllState() {
    this.allSelected = this.paginatedData.length > 0 &&
      this.paginatedData.every(p => this.selectedLogs.has(p.id));
  }

  async confirmBatchDelete() {
    if (this.selectedLogs.size === 0) return;
    if (!confirm(`Delete ${this.selectedLogs.size} selected logs?`)) return;
    if (!confirm('Are you sure? This cannot be undone.')) return;

    try {
      const db = FirebaseService.getFirestore();
      if (!db) {
        console.error('Firestore not initialized');
        return;
      }

      // Delete each selected log
      for (const id of this.selectedLogs) {
        await deleteDoc(doc(db, 'stockHistory', id));
      }

      // Remove from local data
      this.allData = this.allData.filter(d => !this.selectedLogs.has(d.id));
      this.selectedLogs.clear();
      this.allSelected = false;
      this.filterData();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error batch deleting logs:', error);
    }
  }

  async logout() {
    const auth = getAuth();
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
    window.location.href = '/login';
  }
}