import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

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
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="books">Books</option>
                <option value="other">Other</option>
              </select>
            </div>

            <!-- Price -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Price (\$)</label>
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

          <!-- Image Upload -->
          <div class="mt-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
            <div
              class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
            >
              <input
                #fileInput
                type="file"
                multiple
                accept="image/*"
                (change)="onFileSelected($event)"
                class="hidden"
              />
              <button
                type="button"
                (click)="fileInput.click()"
                class="text-blue-600 hover:underline font-semibold"
              >
                Click to upload
              </button>
              <p class="text-gray-500 text-sm mt-2">PNG, JPG, GIF up to 5MB</p>
            </div>

            <!-- Image Preview -->
            <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div *ngFor="let img of previewImages" class="relative">
                <img [src]="img" alt="Preview" class="w-full h-32 object-cover rounded-lg" />
                <button
                  type="button"
                  (click)="removeImage(img)"
                  class="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                >
                  ×
                </button>
              </div>
            </div>
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
    // Check if editing existing product
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.isEditMode = true;
      // Load product data from Firestore
      // this.productService.getProduct(productId).subscribe(...)
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

  onSubmit() {
    if (this.productForm.valid) {
      const formData = this.productForm.value;
      console.log('Submit product:', formData, 'Images:', this.previewImages);
      // TODO: Upload to Firebase Storage and save product to Firestore
      this.router.navigate(['/dashboard']);
    }
  }
}
