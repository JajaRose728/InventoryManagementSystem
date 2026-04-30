import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { collection, doc, getDocs, deleteDoc, query } from 'firebase/firestore';
import { ChangeDetectorRef } from '@angular/core';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen" [class.dark-bg]="darkMode()">
      <nav class="bg-white shadow-md" [class.dark-nav]="darkMode()">
        <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 class="text-2xl font-bold text-blue-600" [class.text-blue-400]="darkMode()">Inventory System</h1>
          <div class="flex items-center gap-4">
            <button (click)="toggleDark()" class="text-2xl">{{ darkMode() ? '☀️' : '🌙' }}</button>
            <span [class.text-gray-200]="darkMode()">Role: <strong>{{ userRole() }}</strong></span>
            <button (click)="logout()" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Logout</button>
          </div>
        </div>
      </nav>

      <div class="max-w-7xl mx-auto px-4 py-8">
        <div class="mb-8">
          <h2 class="text-3xl font-bold" [class.text-white]="darkMode()">Product Inventory</h2>
          <p [class.text-gray-300]="darkMode()">Manage your products</p>
        </div>

        <!-- Action Buttons (ALL users can add, only admin can categories) -->
        <div class="flex flex-wrap gap-4 mb-8">
          <button (click)="addNewProduct()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">➕ Add Product</button>
          <button *ngIf="isAdmin()" (click)="manageCategories()" class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">📁 Categories</button>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6 mb-8" [class.dark-filter]="darkMode()">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange()" placeholder="Search products..."
                   class="px-4 py-2 border rounded-lg dark-input" />
            <select [(ngModel)]="selectedCategory" (ngModelChange)="onSearchChange()" class="px-4 py-2 border rounded-lg dark-input">
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Clothing">Clothing</option>
              <option value="Books">Books</option>
              <option value="Other">Other</option>
            </select>
            <select [(ngModel)]="selectedStatus" (ngModelChange)="onSearchChange()" class="px-4 py-2 border rounded-lg dark-input">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>
        </div>

        <div *ngIf="loading" class="p-12 text-center bg-white rounded-lg shadow-md dark-card">
          <p class="text-gray-500">Loading...</p>
        </div>

        <div *ngIf="!loading && filteredProducts.length === 0" class="p-12 text-center bg-white rounded-lg shadow-md dark-card">
          <p class="text-gray-500">No products found.</p>
        </div>

        <div *ngIf="!loading && filteredProducts.length > 0" class="bg-white rounded-lg shadow-md overflow-hidden dark-card">
          <table class="w-full">
            <thead class="bg-gray-200" [class.dark-thead]="darkMode()">
              <tr>
                <th class="px-6 py-3 text-left text-sm font-semibold dark-th">Product Name</th>
                <th class="px-6 py-3 text-left text-sm font-semibold dark-th">SKU</th>
                <th class="px-6 py-3 text-left text-sm font-semibold dark-th">Category</th>
                <th class="px-6 py-3 text-left text-sm font-semibold dark-th">Price</th>
                <th class="px-6 py-3 text-left text-sm font-semibold dark-th">Quantity</th>
                <th class="px-6 py-3 text-left text-sm font-semibold dark-th">Status</th>
                <th class="px-6 py-3 text-left text-sm font-semibold dark-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let product of filteredProducts" class="border-t dark-row" [class.dark-border]="darkMode()">
                <td class="px-6 py-4 dark-td" [class.text-white]="darkMode()">{{ product.name }}</td>
                <td class="px-6 py-4 dark-td" [class.text-gray-300]="darkMode()">{{ product.sku }}</td>
                <td class="px-6 py-4 dark-td" [class.text-gray-300]="darkMode()">{{ product.category }}</td>
                <td class="px-6 py-4 font-semibold dark-td" [class.text-white]="darkMode()">₱{{ product.price }}</td>
                <td class="px-6 py-4 dark-td" [class.text-white]="darkMode()">
                  <span [class.text-red-500]="product.quantity < product.minStock">{{ product.quantity }}</span>
                </td>
                <td class="px-6 py-4">
                  <span [class]="getStatusClass(product.status)">{{ product.status }}</span>
                </td>
                <td class="px-6 py-4 text-sm space-x-2">
                  <button (click)="editProduct(product.id)" class="text-blue-600 hover:underline">Edit</button>
                  <button *ngIf="isAdmin()" (click)="confirmDelete($event, product.id)" class="text-red-600 hover:underline">Delete</button>
                  <span *ngIf="!isAdmin()" class="text-gray-400 text-xs">View Only</span>
                </td>
              </tr>
            </tbody>
          </table>
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

    :host ::ng-deep .dark-bg input::placeholder { color: #9ca3af; }
  `]
})
export class DashboardComponent implements OnInit {
  darkMode = signal(false);
  userRole = signal('user');
  currentUser = 'User';
  searchQuery = '';
  selectedCategory = '';
  selectedStatus = '';
  products: any[] = [];
  filteredProducts: any[] = [];
  loading = true;
  private db: any;

  constructor(private router: Router, private cdr: ChangeDetectorRef) {
    if (localStorage.getItem('darkMode') === 'true') this.darkMode.set(true);
  }

  ngOnInit() {
    this.checkUserRole();
    FirebaseService.initializeFirebase().then(() => this.loadProducts());
  }

  async checkUserRole() {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.currentUser = user.email || 'User';
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
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold';
      case 'inactive': return 'bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold';
      case 'discontinued': return 'bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold';
      default: return '';
    }
  }

  async loadProducts() {
    this.loading = true;
    try {
      this.db = FirebaseService.getFirestore();
      if (!this.db) return;
      const { getDocs, collection } = await import('firebase/firestore');
      const snapshot = await getDocs(query(collection(this.db, 'products')));
      this.products = [];
      snapshot.forEach((doc: any) => this.products.push({ id: doc.id, ...doc.data() }));
      this.applyFilters();
    } catch (error) { console.error('Error:', error); }
    finally { this.loading = false; this.cdr.detectChanges(); }
  }

  applyFilters() {
    this.filteredProducts = this.products.filter(p => {
      const matchesSearch = !this.searchQuery ||
        p.name?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.sku?.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesCategory = !this.selectedCategory || p.category?.toLowerCase() === this.selectedCategory.toLowerCase();
      const matchesStatus = !this.selectedStatus || p.status === this.selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  onSearchChange() { this.applyFilters(); }
  addNewProduct() { this.router.navigate(['/products/new']); }
  editProduct(id: string) { this.router.navigate(['/products/edit', id]); }
  confirmDelete(event: Event, id: string) {
    event.stopPropagation();
    if (confirm('Delete this product?')) this.deleteProduct(id);
  }

  async deleteProduct(id: string) {
    try {
      const docRef = doc(this.db, 'products', id);
      await deleteDoc(docRef);
      this.products = this.products.filter(p => p.id !== id);
      this.applyFilters();
      this.cdr.detectChanges();
    } catch (error) { console.error('Error:', error); }
  }

  manageCategories() { this.router.navigate(['/categories']); }

  async logout() {
    const auth = getAuth();
    await signOut(auth);
    this.router.navigate(['/login']);
  }
}