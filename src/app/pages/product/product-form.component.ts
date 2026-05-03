/**
 * Product Management Component - Add/Edit product with image upload
 * With dark/light mode support and stock logging
 */

import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import { UploadService } from '../../services/upload.service';
import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, setDoc
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { serverTimestamp } from 'firebase/firestore';

/**
 * Product Management Component - Add/Edit product with image upload
 */
@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen transition-colors duration-300"
         [class]="darkMode() ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gray-50'">

      <!-- Navigation -->
      <nav class="backdrop-blur-md sticky top-0 z-50 shadow-lg"
           [class]="darkMode() ? 'bg-slate-900/90 border-b border-slate-700' : 'bg-white/90'">
        <div class="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <button type="button" (click)="goBack()" class="flex items-center gap-2 font-medium transition-colors"
             [class]="darkMode() ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'">
            <span>←</span> Back to Dashboard
          </button>
          <div class="flex items-center gap-3">
            <button (click)="toggleDark()" class="p-2 rounded-lg transition-colors"
                    [class]="darkMode() ? 'hover:bg-slate-700' : 'hover:bg-gray-200'">
              {{ darkMode() ? '☀️' : '🌙' }}
            </button>
          </div>
        </div>
      </nav>

      <div class="max-w-4xl mx-auto px-4 py-8">
        <h2 class="text-3xl font-bold mb-8"
            [class]="darkMode() ? 'text-white' : 'text-gray-900'">
          {{ isEditMode ? 'Edit Product' : 'Add New Product' }}
        </h2>

        <form [formGroup]="productForm" (ngSubmit)="onSubmit()"
              class="rounded-2xl shadow-lg p-8"
              [class]="darkMode() ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Product Name -->
            <div>
              <label class="block text-sm font-medium mb-2"
                     [class]="darkMode() ? 'text-slate-300' : 'text-gray-700'">Product Name</label>
              <input type="text" formControlName="name"
                     [class]="getInputClass()" placeholder="e.g., Laptop Pro 15" />
            </div>

            <!-- SKU -->
            <div>
              <label class="block text-sm font-medium mb-2"
                     [class]="darkMode() ? 'text-slate-300' : 'text-gray-700'">SKU (Unique Code)</label>
              <input type="text" formControlName="sku"
                     [class]="getInputClass()" placeholder="e.g., LP-001" />
            </div>

            <!-- Category -->
            <div>
              <label class="block text-sm font-medium mb-2"
                     [class]="darkMode() ? 'text-slate-300' : 'text-gray-700'">Category</label>
              <select formControlName="category" [class]="getSelectClass()">
                <option value="">Select Category</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Books">Books</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <!-- Supplier -->
            <div>
              <label class="block text-sm font-medium mb-2"
                     [class]="darkMode() ? 'text-slate-300' : 'text-gray-700'">Supplier</label>
              <input type="text" formControlName="supplier"
                     [class]="getInputClass()" placeholder="Supplier name" />
            </div>

            <!-- Price -->
            <div>
              <label class="block text-sm font-medium mb-2"
                     [class]="darkMode() ? 'text-slate-300' : 'text-gray-700'">Price (₱)</label>
              <input type="number" step="1" formControlName="price"
                     [class]="getInputClass()" placeholder="0" />
            </div>

            <!-- Quantity -->
            <div>
              <label class="block text-sm font-medium mb-2"
                     [class]="darkMode() ? 'text-slate-300' : 'text-gray-700'">Quantity</label>
              <input type="number" formControlName="quantity"
                     [class]="getInputClass()" placeholder="0" />
            </div>

            <!-- Min Stock Level -->
            <div>
              <label class="block text-sm font-medium mb-2"
                     [class]="darkMode() ? 'text-slate-300' : 'text-gray-700'">Min Stock Level</label>
              <input type="number" formControlName="minStock"
                     [class]="getInputClass()" placeholder="10" />
            </div>

            <!-- Status -->
            <div>
              <label class="block text-sm font-medium mb-2"
                     [class]="darkMode() ? 'text-slate-300' : 'text-gray-700'">Status</label>
              <select formControlName="status" [class]="getSelectClass()">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
          </div>

          <!-- Description -->
          <div class="mt-6">
            <label class="block text-sm font-medium mb-2"
                   [class]="darkMode() ? 'text-slate-300' : 'text-gray-700'">Description</label>
            <textarea formControlName="description" rows="4"
                    [class]="getInputClass()" placeholder="Product description..."></textarea>
          </div>

          <!-- Image Upload -->
          <div class="mt-6">
            <label class="block text-sm font-medium mb-2"
                   [class]="darkMode() ? 'text-slate-300' : 'text-gray-700'">Product Image (Max 2MB)</label>
            <input type="file" accept="image/*" (change)="onFileSelected($event)"
                   [class]="getInputClass()" />
          </div>

          <!-- Image Preview -->
          <div *ngIf="previewImages.length > 0" class="mt-4 grid grid-cols-3 gap-3">
            <div *ngFor="let image of previewImages; let i = index" class="relative">
              <img [src]="image" class="w-full h-24 object-cover rounded-xl border" [class]="darkMode() ? 'border-slate-600' : 'border-gray-200'" />
              <button type="button" (click)="removeImage(image)"
                      class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600">
                ×
              </button>
            </div>
          </div>

          <!-- Stock Change Info -->
          <div *ngIf="isEditMode && originalQuantity > 0" class="mt-6 p-4 rounded-xl"
               [class]="darkMode() ? 'bg-slate-700' : 'bg-blue-50'">
            <p class="text-sm" [class]="darkMode() ? 'text-slate-300' : 'text-blue-700'">
              Current stock: <strong>{{ originalQuantity }}</strong>
            </p>
          </div>

          <!-- Buttons -->
          <div class="mt-8 flex gap-4">
            <button type="submit" [disabled]="productForm.invalid"
                    class="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors"
                    [class]="darkMode() ?
                      'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-800' :
                      'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400'">
              {{ isEditMode ? 'Update Product' : 'Add Product' }}
            </button>
            <button type="button" (click)="goBack()" class="px-6 py-3 rounded-lg transition-colors"
              [class]="darkMode() ?
                'bg-slate-700 hover:bg-slate-600 text-slate-300' :
                'bg-gray-200 hover:bg-gray-300 text-gray-700'">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  isEditMode = false;
  previewImages: string[] = [];
  loading = false;
  currentProductId = '';
  private db: any = null;
  private currentUserId = '';
  private currentUserEmail = '';
  originalQuantity = 0;
  darkMode = signal(false);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private uploadService: UploadService
  ) {
    if (localStorage.getItem('darkMode') === 'true') this.darkMode.set(true);

    this.productForm = this.fb.group({
      name: ['', Validators.required],
      sku: ['', Validators.required],
      category: ['', Validators.required],
      price: [0, Validators.required],
      quantity: [0, Validators.required],
      minStock: [10, Validators.required],
      supplier: ['', Validators.required],
      status: ['active', Validators.required],
      description: ['']
    });
  }

  // Helper methods for conditional classes
  getInputClass(): string {
    const base = 'w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 transition-colors';
    return this.darkMode()
      ? `${base} bg-slate-700 border-slate-600 text-white placeholder-slate-400`
      : `${base} bg-white border-gray-300 text-gray-900 placeholder-gray-400`;
  }

  getSelectClass(): string {
    const base = 'w-full px-4 py-2.5 rounded-xl border transition-colors';
    return this.darkMode()
      ? `${base} bg-slate-700 border-slate-600 text-white`
      : `${base} bg-white border-gray-300 text-gray-900`;
  }

  ngOnInit() {
    FirebaseService.initializeFirebase();
    this.db = FirebaseService.getFirestore();

    // Get current user
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUserId = user.uid;
        this.currentUserEmail = user.email || '';
      }
    });

    // Check if editing existing product
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.isEditMode = true;
      this.currentProductId = productId;
      this.loadProduct(productId);
    }
  }

  toggleDark() {
    this.darkMode.update(v => !v);
    localStorage.setItem('darkMode', String(this.darkMode()));
  }

  async loadProduct(productId: string) {
    try {
      const docRef = doc(this.db, 'products', productId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        this.originalQuantity = data['quantity'] || 0;
        this.productForm.patchValue({
          name: data['name'] || '',
          sku: data['sku'] || '',
          category: data['category'] || '',
          price: data['price'] || 0,
          quantity: data['quantity'] || 0,
          minStock: data['minStock'] || 10,
          supplier: data['supplier'] || '',
          status: data['status'] || 'active',
          description: data['description'] || ''
        });
        this.previewImages = data['imageUrls'] || [];
      }
    } catch (error) {
      console.error('Error loading product:', error);
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > 2 * 1024 * 1024) {
        alert('File too large. Max 2MB allowed.');
        continue;
      }

      this.uploadService.uploadFile(file).then((result) => {
        if (result.success && result.url) {
          this.previewImages.push(result.url);
        } else if (result.error) {
          alert(result.error);
        }
      });
    }
  }

  removeImage(image: string) {
    this.previewImages = this.previewImages.filter(img => img !== image);
  }

  async onSubmit() {
    if (this.productForm.valid) {
      this.loading = true;
      const formData = this.productForm.value;

      try {
        if (!this.db) {
          this.db = FirebaseService.getFirestore();
        }

        const productData: any = {
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          supplier: formData.supplier,
          price: parseFloat(formData.price) || 0,
          quantity: parseInt(formData.quantity) || 0,
          minStock: parseInt(formData.minStock) || 10,
          status: formData.status,
          description: formData.description || '',
          imageUrls: this.previewImages,
          updatedAt: new Date()
        };

        if (this.isEditMode && this.currentProductId) {
          // Update existing product
          const docRef = doc(this.db, 'products', this.currentProductId);
          await updateDoc(docRef, productData);

          // Log stock movement if quantity changed
          const newQuantity = parseInt(formData.quantity) || 0;
          if (newQuantity !== this.originalQuantity) {
            await this.logStockMovement(
              this.currentProductId,
              formData.name,
              newQuantity > this.originalQuantity ? 'stock_in' : 'stock_out',
              Math.abs(newQuantity - this.originalQuantity),
              this.originalQuantity,
              newQuantity,
              newQuantity > this.originalQuantity
                ? 'Stock added via product edit'
                : 'Stock removed via product edit'
            );
          }

          // Log product edit (always log this when product is updated)
          await this.logStockMovement(
            this.currentProductId,
            formData.name,
            'product_edit',
            0,
            this.originalQuantity,
            newQuantity,
            'Product details updated'
          );

          console.log('Product updated:', this.currentProductId);
        } else {
          // Add new product
          productData.createdAt = new Date();
          const docRef = await addDoc(collection(this.db, 'products'), productData);

          // Log initial stock
          const initialQty = parseInt(formData.quantity) || 0;
          if (initialQty > 0) {
            await this.logStockMovement(
              docRef.id,
              formData.name,
              'stock_in',
              initialQty,
              0,
              initialQty,
              'Initial stock on product creation'
            );
          }

          console.log('Product created:', docRef.id);
        }

        this.router.navigate(['/dashboard']);
      } catch (error) {
        console.error('Error saving product:', error);
        alert('Error saving product. Please try again.');
      } finally {
        this.loading = false;
      }
    }
  }

  async logStockMovement(
    productId: string,
    productName: string,
    action: string,
    quantity: number,
    previousQuantity: number,
    newQuantity: number,
    note: string
  ) {
    try {
      if (!this.db) {
        this.db = FirebaseService.getFirestore();
      }

      await addDoc(collection(this.db, 'stockHistory'), {
        productId,
        productName,
        action,
        quantity,
        previousQuantity,
        newQuantity,
        userId: this.currentUserId || 'system',
        userEmail: this.currentUserEmail || '',
        timestamp: serverTimestamp(),
        note
      });

      console.log('Stock movement logged:', action, quantity);
    } catch (error) {
      console.error('Error logging stock movement:', error);
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}