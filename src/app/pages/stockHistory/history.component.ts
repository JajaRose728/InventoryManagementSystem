/**
 * History/Audit Logs Component
 * Displays system activity history and audit logs
 */

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { ChangeDetectorRef } from '@angular/core';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: any;
  timestamp: any;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen" [class.dark-bg]="darkMode()">
      <nav class="bg-white shadow-md" [class.dark-nav]="darkMode()">
        <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div class="flex items-center gap-4">
            <button (click)="goBack()" class="text-2xl">←</button>
            <h1 class="text-2xl font-bold text-blue-600" [class.text-blue-400]="darkMode()">Activity History</h1>
          </div>
          <div class="flex items-center gap-4">
            <button (click)="toggleDark()" class="text-2xl">{{ darkMode() ? '☀️' : '🌙' }}</button>
            <button (click)="logout()" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Logout</button>
          </div>
        </div>
      </nav>

      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="mb-8">
          <h2 class="text-3xl font-bold" [class.text-white]="darkMode()">Audit Logs</h2>
          <p [class.text-gray-300]="darkMode()">View system activity and changes</p>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8" [class.dark-filter]="darkMode()">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select [(ngModel)]="filterEntityType" (ngModelChange)="loadLogs()" class="px-4 py-2 border rounded-lg dark-input">
              <option value="">All Types</option>
              <option value="product">Products</option>
              <option value="category">Categories</option>
              <option value="user">Users</option>
            </select>
            <select [(ngModel)]="filterAction" (ngModelChange)="loadLogs()" class="px-4 py-2 border rounded-lg dark-input">
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </select>
            <select [(ngModel)]="pageSize" (ngModelChange)="loadLogs()" class="px-4 py-2 border rounded-lg dark-input">
              <option [value]="10">10 items</option>
              <option [value]="25">25 items</option>
              <option [value]="50">50 items</option>
              <option [value]="100">100 items</option>
            </select>
            <button (click)="refresh()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">🔄 Refresh</button>
          </div>
        </div>

        <!-- Loading -->
        <div *ngIf="loading" class="p-12 text-center bg-white rounded-lg shadow-md dark-card">
          <p class="text-gray-500">Loading history...</p>
        </div>

        <!-- No Data -->
        <div *ngIf="!loading && logs.length === 0" class="p-12 text-center bg-white rounded-lg shadow-md dark-card">
          <p class="text-gray-500">No activity logs found.</p>
        </div>

        <!-- Logs Table -->
        <div *ngIf="!loading && logs.length > 0" class="bg-white rounded-lg shadow-md overflow-hidden dark-card">
          <div class="flex items-center justify-between px-6 py-3 bg-gray-100" [class.dark-thead]="darkMode()">
            <span class="text-sm font-semibold dark-th">Total: {{ totalLogs }} entries</span>
            <span class="text-sm dark-th">Page {{ currentPage }} of {{ totalPages }}</span>
          </div>
          <table class="w-full">
            <thead class="bg-gray-200" [class.dark-thead]="darkMode()">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-semibold dark-th">Timestamp</th>
                <th class="px-4 py-3 text-left text-sm font-semibold dark-th">User</th>
                <th class="px-4 py-3 text-left text-sm font-semibold dark-th">Action</th>
                <th class="px-4 py-3 text-left text-sm font-semibold dark-th">Type</th>
                <th class="px-4 py-3 text-left text-sm font-semibold dark-th">Entity ID</th>
                <th class="px-4 py-3 text-left text-sm font-semibold dark-th">Details</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of paginatedLogs" class="border-t dark-row" [class.dark-border]="darkMode()">
                <td class="px-4 py-3 text-sm dark-td" [class.text-gray-300]="darkMode()">
                  {{ formatDate(log.timestamp) }}
                </td>
                <td class="px-4 py-3 text-sm dark-td" [class.text-white]="darkMode()">
                  {{ log.userId | slice:0:8 }}...
                </td>
                <td class="px-4 py-3">
                  <span [class]="getActionClass(log.action)">{{ log.action }}</span>
                </td>
                <td class="px-4 py-3 text-sm dark-td" [class.text-gray-300]="darkMode()">
                  {{ log.entityType }}
                </td>
                <td class="px-4 py-3 text-sm dark-td" [class.text-gray-300]="darkMode()">
                  {{ log.entityId | slice:0:12 }}...
                </td>
                <td class="px-4 py-3 text-sm dark-td" [class.text-gray-300]="darkMode()">
                  <button (click)="viewDetails(log)" class="text-blue-600 hover:underline">View</button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="flex items-center justify-between px-6 py-4 border-t dark-border" [class.dark-border]="darkMode()">
            <button (click)="prevPage()" [disabled]="currentPage === 1"
                    class="px-3 py-1 border rounded dark-input hover:bg-gray-100">← Previous</button>
            <span class="text-sm dark-th">Showing {{ paginatedLogs.length }} of {{ totalLogs }}</span>
            <button (click)="nextPage()" [disabled]="currentPage >= totalPages"
                    class="px-3 py-1 border rounded dark-input hover:bg-gray-100">Next →</button>
          </div>
        </div>
      </div>

      <!-- Details Modal -->
      <div *ngIf="selectedLog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold">Log Details</h3>
            <button (click)="selectedLog = null" class="text-2xl">&times;</button>
          </div>
          <div class="space-y-2">
            <p><strong>Timestamp:</strong> {{ formatDate(selectedLog.timestamp) }}</p>
            <p><strong>User ID:</strong> {{ selectedLog.userId }}</p>
            <p><strong>Action:</strong> {{ selectedLog.action }}</p>
            <p><strong>Entity Type:</strong> {{ selectedLog.entityType }}</p>
            <p><strong>Entity ID:</strong> {{ selectedLog.entityId }}</p>
            <div *ngIf="selectedLog.changes" class="mt-4">
              <strong>Changes:</strong>
              <pre class="bg-gray-100 p-4 rounded mt-2 overflow-x-auto text-sm">{{ selectedLog.changes | json }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dark-bg { background-color: #111827; }
    .dark-nav { background-color: #1f2937; }
    .dark-card { background-color: #1f2937; }
    .dark-filter { background-color: #1f2937; }
    .dark-row { border-color: #374151; }
    .dark-thead { background-color: #374151; }
    .dark-th { color: #f9fafb !important; }
    .dark-td { color: #d1d5db; }
    .dark-input { background-color: #374151; color: white; border-color: #4b5563; }
  `]
})
export class HistoryComponent implements OnInit {
  darkMode = signal(false);
  logs: AuditLog[] = [];
  paginatedLogs: AuditLog[] = [];
  loading = true;
  selectedLog: AuditLog | null = null;
  private db: any;

  // Filters
  filterEntityType = '';
  filterAction = '';
  pageSize = 25;

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalLogs = 0;

  constructor(private cdr: ChangeDetectorRef) {
    if (localStorage.getItem('darkMode') === 'true') this.darkMode.set(true);
  }

  ngOnInit() {
    this.loadLogs();
  }

  toggleDark() {
    this.darkMode.update(v => !v);
    localStorage.setItem('darkMode', String(this.darkMode()));
  }

  async loadLogs() {
    this.loading = true;
    this.cdr.detectChanges();

    try {
      this.db = FirebaseService.getFirestore();
      if (!this.db) return;

      const q = query(
        collection(this.db, 'auditLogs'),
        orderBy('timestamp', 'desc'),
        limit(500)
      );

      const snapshot = await getDocs(q);
      this.logs = [];
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        // Apply filters
        if (this.filterEntityType && data.entityType !== this.filterEntityType) return;
        if (this.filterAction && !data.action?.toLowerCase().includes(this.filterAction.toLowerCase())) return;
        this.logs.push({ id: doc.id, ...data });
      });

      this.totalLogs = this.logs.length;
      this.totalPages = Math.max(1, Math.ceil(this.totalLogs / this.pageSize));
      if (this.currentPage > this.totalPages) this.currentPage = 1;
      this.updatePagination();
    } catch (error) {
      console.error('Error loading logs:', error);
      this.logs = [];
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedLogs = this.logs.slice(start, end);
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

  refresh() {
    this.currentPage = 1;
    this.loadLogs();
  }

  goBack() {
    window.history.back();
  }

  viewDetails(log: AuditLog) {
    this.selectedLog = log;
  }

  formatDate(timestamp: any): string {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleString();
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleString();
    }
    return String(timestamp);
  }

  getActionClass(action: string): string {
    const a = action?.toLowerCase() || '';
    if (a.includes('create')) return 'bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold';
    if (a.includes('update')) return 'bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold';
    if (a.includes('delete')) return 'bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold';
    if (a.includes('batch')) return 'bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-semibold';
    return 'bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-semibold';
  }

  async logout() {
    const auth = getAuth();
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
    window.location.href = '/login';
  }
}