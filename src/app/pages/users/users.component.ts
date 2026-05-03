/**
 * User Management Component
 * Admin-only user management and activity logs
 */

import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import { collection, doc, getDocs, query, orderBy, limit, onSnapshot, where, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { ChangeDetectorRef } from '@angular/core';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  createdAt: any;
  lastLogin?: any;
}

interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: any;
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen transition-colors duration-300 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

      <!-- Header -->
      <nav class="backdrop-blur-md sticky top-0 z-50 shadow-lg bg-slate-900/90 border-b border-slate-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center gap-3">
              <button (click)="goBack()" class="text-2xl hover:scale-110 transition-transform">←</button>
              <div>
                <h1 class="text-xl font-bold text-blue-400">User Management</h1>
                <p class="text-xs text-slate-400">Manage users and view activity</p>
              </div>
            </div>
            <div class="flex items-center gap-2 sm:gap-4">
              <button (click)="logout()" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <!-- Tabs -->
        <div class="flex gap-2 mb-6">
          <button (click)="activeTab = 'users'" class="px-4 py-2 rounded-lg font-medium transition-colors text-white"
                  [class]="activeTab === 'users' ? 'bg-blue-600' : 'bg-slate-700'">
            👥 Users
          </button>
          <button (click)="activeTab = 'activity'" class="px-4 py-2 rounded-lg font-medium transition-colors text-white"
                  [class]="activeTab === 'activity' ? 'bg-blue-600' : 'bg-slate-700'">
            📝 Activity Logs
          </button>
        </div>

        <!-- Users Tab -->
        <div *ngIf="activeTab === 'users'" class="space-y-6">
          <div class="bg-slate-800 rounded-2xl shadow-lg p-6">
            <h2 class="text-lg font-semibold mb-4 text-white">All Users</h2>
            <div *ngIf="users.length === 0" class="text-center py-8 text-slate-400">No users found</div>
            <div *ngIf="users.length > 0" class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-slate-700 bg-slate-700/50">
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">User</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">Role</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">Joined</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-700">
                  <tr *ngFor="let user of users" class="hover:bg-slate-700/30 transition-colors">
                    <td class="px-4 py-3">
                      <div class="font-medium text-white">{{ user.email }}</div>
                      <div class="text-xs text-slate-500">{{ user.id.substring(0, 8) }}...</div>
                    </td>
                    <td class="px-4 py-3">
                      <select [value]="user.role" (change)="updateUserRole(user.id, $event)"
                              class="px-3 py-1 rounded-full text-sm font-medium border"
                              [ngClass]="user.role === 'admin' ? 'bg-purple-900/50 text-purple-300 border-purple-700' : 'bg-slate-700 text-slate-300 border-slate-600'">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td class="px-4 py-3 text-sm text-slate-400">
                      {{ formatDate(user.createdAt) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Activity Tab -->
        <div *ngIf="activeTab === 'activity'" class="space-y-6">
          <!-- Filters -->
          <div class="bg-slate-800 rounded-2xl p-4 shadow-lg">
            <div class="flex flex-wrap gap-4">
              <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="filterActivity()"
                     placeholder="Search activity..."
                     class="px-4 py-2 border rounded-lg bg-slate-700 border-slate-600 text-white placeholder-slate-400" />
              <select [(ngModel)]="filterAction" (ngModelChange)="filterActivity()"
                      class="px-4 py-2 border rounded-lg bg-slate-700 border-slate-600 text-white">
                <option value="">All Actions</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="register">Register</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
              </select>
              <select [(ngModel)]="dateRange" (ngModelChange)="filterActivity()"
                      class="px-4 py-2 border rounded-lg bg-slate-700 border-slate-600 text-white">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>

          <!-- Activity List -->
          <div class="bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
            <div class="p-4 border-b border-slate-700">
              <span class="font-semibold text-white">
                {{ filteredLogs.length }} activities
              </span>
            </div>
            <div *ngIf="filteredLogs.length === 0" class="p-8 text-center text-slate-400">
              No activity logs found
            </div>
            <div *ngIf="filteredLogs.length > 0" class="divide-y divide-slate-700">
              <div *ngFor="let log of paginatedLogs" class="p-4 hover:bg-slate-700/30 transition-colors">
                <div class="flex items-start gap-4">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                       [class]="getActionIconBg(log.action)">
                    <span class="text-lg">{{ getActionIcon(log.action) }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="font-semibold truncate text-white">
                        {{ log.userEmail || log.userId.substring(0, 8) }}
                      </span>
                      <span [class]="getActionBadge(log.action)">{{ log.action }}</span>
                    </div>
                    <div class="text-sm mt-1 text-slate-400">
                      {{ log.details }}
                    </div>
                    <div class="text-xs mt-1 text-slate-500">
                      {{ formatDate(log.timestamp) }} {{ formatTime(log.timestamp) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pagination -->
            <div *ngIf="filteredLogs.length > pageSize" class="px-6 py-4 border-t border-slate-700 flex items-center justify-between">
              <div class="text-sm text-slate-400">
                Showing {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredLogs.length) }}
              </div>
              <div class="flex items-center gap-2">
                <button (click)="prevPage()" [disabled]="currentPage === 1"
                        class="px-3 py-1 border border-slate-600 rounded bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-50">«</button>
                <span class="text-slate-300">{{ currentPage }} / {{ totalPages }}</span>
                <button (click)="nextPage()" [disabled]="currentPage >= totalPages"
                        class="px-3 py-1 border border-slate-600 rounded bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-50">»</button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `
})
export class UsersComponent implements OnInit, OnDestroy {
  darkMode = signal(false);
  activeTab = 'users';

  // Users
  users: UserProfile[] = [];

  // Activity
  allLogs: ActivityLog[] = [];
  filteredLogs: ActivityLog[] = [];
  paginatedLogs: ActivityLog[] = [];

  // Filters
  searchQuery = '';
  filterAction = '';
  dateRange = 'all';
  pageSize = 20;

  // Pagination
  currentPage = 1;
  totalPages = 1;

  Math = Math;
  private db: any;
  private unsubscribeUsers: (() => void) | null = null;
  private unsubscribeLogs: (() => void) | null = null;

  constructor(private cdr: ChangeDetectorRef) {
    if (localStorage.getItem('darkMode') === 'true') this.darkMode.set(true);
  }

  ngOnInit() {
    this.loadUsers();
    this.loadActivityLogs();
  }

  ngOnDestroy() {
    if (this.unsubscribeUsers) this.unsubscribeUsers();
    if (this.unsubscribeLogs) this.unsubscribeLogs();
  }

  subscribeToUsers() {
    const db = FirebaseService.getFirestore();
    if (!db) return;
    this.db = db;

    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    this.unsubscribeUsers = onSnapshot(q, (snapshot) => {
      this.users = [];
      snapshot.forEach((doc: any) => {
        this.users.push({ id: doc.id, ...doc.data() });
      });
      this.cdr.detectChanges();
    });
  }

  loadUsers() {
    this.subscribeToUsers();
  }

  async loadActivityLogs() {
    const db = FirebaseService.getFirestore();
    if (!db) return;

    const q = query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc'), limit(500));
    this.unsubscribeLogs = onSnapshot(q, (snapshot) => {
      this.allLogs = [];
      snapshot.forEach((doc: any) => {
        this.allLogs.push({ id: doc.id, ...doc.data() });
      });
      this.filterActivity();
      this.cdr.detectChanges();
    });
  }

  filterActivity() {
    let logs = [...this.allLogs];

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      logs = logs.filter(l =>
        l.userEmail?.toLowerCase().includes(q) ||
        l.details?.toLowerCase().includes(q)
      );
    }

    if (this.filterAction) {
      logs = logs.filter(l => l.action === this.filterAction);
    }

    if (this.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      logs = logs.filter(l => {
        if (!l.timestamp) return false;
        const d = l.timestamp.toDate ? l.timestamp.toDate() : new Date(l.timestamp.seconds * 1000);
        switch (this.dateRange) {
          case 'today': return d >= today;
          case 'week': return d >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          case 'month': return d >= new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          default: return true;
        }
      });
    }

    this.filteredLogs = logs;
    this.totalPages = Math.max(1, Math.ceil(logs.length / this.pageSize));
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    // Ensure current page is within bounds
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedLogs = this.filteredLogs.slice(start, end);
    this.totalPages = Math.max(1, Math.ceil(this.filteredLogs.length / this.pageSize));
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

  async updateUserRole(userId: string, event: Event) {
    const newRole = (event.target as HTMLSelectElement).value;
    try {
      await updateDoc(doc(this.db, 'users', userId), { role: newRole });
      // Log activity
      await addDoc(collection(this.db, 'activityLogs'), {
        userId,
        userEmail: this.users.find(u => u.id === userId)?.email || '',
        action: 'update',
        details: `Changed role to ${newRole}`,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating role:', error);
    }
  }

  toggleDark() {
    this.darkMode.update(v => !v);
    localStorage.setItem('darkMode', String(this.darkMode()));
  }

  getTabClass(tab: string) {
    const base = 'px-4 py-2 rounded-lg font-medium transition-colors';
    if (this.activeTab === tab) {
      return base + ' bg-blue-600 text-white';
    }
    return base + (this.darkMode() ? ' bg-slate-700 text-slate-300' : ' bg-gray-200 text-gray-600');
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'login': return '🔓';
      case 'logout': return '🔒';
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      case 'stock_in': return '📥';
      case 'stock_out': return '📤';
      case 'register': return '👤';
      default: return '📝';
    }
  }

  getActionIconBg(action: string): string {
    // Always dark mode styling for Users screen
    switch (action) {
      case 'login': return 'bg-green-900/50';
      case 'logout': return 'bg-slate-700';
      case 'create': return 'bg-green-900/50';
      case 'update': return 'bg-blue-900/50';
      case 'delete': return 'bg-red-900/50';
      case 'stock_in': return 'bg-green-900/50';
      case 'stock_out': return 'bg-red-900/50';
      case 'register': return 'bg-purple-900/50';
      default: return 'bg-slate-700';
    }
  }

  getActionBadge(action: string): string {
    // Always dark mode styling for Users screen
    switch (action) {
      case 'login': return 'px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-400';
      case 'logout': return 'px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300';
      case 'create': return 'px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-400';
      case 'update': return 'px-2 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-400';
      case 'delete': return 'px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-400';
      case 'stock_in': return 'px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-400';
      case 'stock_out': return 'px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-400';
      case 'register': return 'px-2 py-0.5 rounded-full text-xs font-medium bg-purple-900/50 text-purple-400';
      default: return 'px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300';
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

  goBack() {
    window.history.back();
  }

  async logout() {
    // Log logout
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const db = FirebaseService.getFirestore();
      if (db) {
        await addDoc(collection(db, 'activityLogs'), {
          userId: user.uid,
          userEmail: user.email || '',
          action: 'logout',
          details: 'User logged out',
          timestamp: serverTimestamp()
        });
      }
    }
    await auth.signOut();
    window.location.href = '/login';
  }
}