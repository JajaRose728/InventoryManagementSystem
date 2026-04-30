import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';
import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, setDoc
} from 'firebase/firestore';

/**
 * Product Management Component - Add/Edit product with image upload
 */
@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navigation -->
      <nav class="bg-white shadow-md mb-8">
        <div class="max-w-4xl mx-auto px-4 py-4">
          <a href="/dashboard" class="text-blue-600 hover:underline">← Back to Dashboard</a>
        </div>
      </nav>

      <div class="max-w-4xl mx-auto px-4 py-8">
        <h2 class="text-3xl font-bold text-gray-900 mb-8">{{ isEditMode ? 'Edit Product' : 'Add New Product' }}</h2>

        <form [formGroup]="productForm" (ngSubmit)="onSubmit()" class="bg-white rounded-lg shadow-md p-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Product Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
              <input
                type="text"
                formControlName="name"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Laptop Pro 15"
              />
            </div>

            <!-- SKU -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">SKU (Unique Code)</label>
              <input
                type="text"
                formControlName="sku"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., LP-001"
              />
            </div>

            <!-- Category -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                formControlName="category"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Category</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Books">Books</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <!-- Price -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Price (₱)</label>
              <input
                type="number"
                step="0.01"
                formControlName="price"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <!-- Quantity -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <input
                type="number"
                formControlName="quantity"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <!-- Min Stock Level -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Min Stock Level</label>
              <input
                type="number"
                formControlName="minStock"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <!-- Supplier -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
              <input
                type="text"
                formControlName="supplier"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Supplier name"
              />
            </div>

            <!-- Status -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                formControlName="status"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
          </div>

          <!-- Description (Full Width) -->
          <div class="mt-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              formControlName="description"
              rows="4"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Product description..."
            ></textarea>
          </div>

          <!-- Submit Buttons -->
          <div class="mt-8 flex gap-4">
            <button
              type="submit"
              [disabled]="productForm.invalid"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold"
            >
              {{ isEditMode ? 'Update Product' : 'Add Product' }}
            </button>
            <a
              href="/dashboard"
              class="px-6 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-semibold"
            >
              Cancel
            </a>
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
  private db: any;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      sku: ['', Validators.required],
      category: ['', Validators.required],
      price: [0, Validators.required],
      quantity: [0, Validators.required],
      minStock: [0, Validators.required],
      supplier: ['', Validators.required],
      status: ['active', Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    // Initialize Firebase
    FirebaseService.initializeFirebase();
    this.db = FirebaseService.getFirestore();

    // Check if editing existing product
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.isEditMode = true;
      this.currentProductId = productId;
      this.loadProduct(productId);
    }
  }

  async loadProduct(productId: string) {
    try {
      const docRef = doc(this.db, 'products', productId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        this.productForm.patchValue({
          name: data['name'] || '',
          sku: data['sku'] || '',
          category: data['category'] || '',
          price: data['price'] || 0,
          quantity: data['quantity'] || 0,
          minStock: data['minStock'] || 0,
          supplier: data['supplier'] || '',
          status: data['status'] || 'active',
          description: data['description'] || ''
        });
      }
    } catch (error) {
      console.error('Error loading product:', error);
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    for (let file of files) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImages.push(e.target.result);
      };
      reader.readAsDataURL(file);
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
        const productData = {
          ...formData,
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity),
          minStock: parseInt(formData.minStock),
          updatedAt: new Date()
        };

        if (this.isEditMode && this.currentProductId) {
          // Update existing product
          const docRef = doc(this.db, 'products', this.currentProductId);
          await updateDoc(docRef, productData);
          console.log('Product updated:', this.currentProductId);
        } else {
          // Add new product
          productData.createdAt = new Date();
          const docRef = await addDoc(collection(this.db, 'products'), productData);
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
}
