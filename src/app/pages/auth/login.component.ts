import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Inventory</h1>
          <p class="text-gray-600 mt-2">Management System</p>
        </div>

        <!-- Login Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="space-y-5">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
            />
            <span
              *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
              class="text-red-500 text-xs mt-1 block"
            >
              Valid email required
            </span>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              formControlName="password"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
            <span
              *ngIf="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
              class="text-red-500 text-xs mt-1 block"
            >
              Password required (min 6 characters)
            </span>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="loginForm.invalid"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition duration-200"
          >
            Sign In
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>

        <!-- Demo Login -->
        <div class="space-y-2 text-sm text-gray-600">
          <p class="font-semibold">Demo Credentials:</p>
          <p><strong>Admin:</strong> admin@demo.com / admin123</p>
          <p><strong>User:</strong> user@demo.com / user123</p>
        </div>

        <!-- Sign Up Link -->
        <p class="text-center mt-6 text-gray-600">
          Don't have an account?
          <a href="/register" class="text-blue-600 font-semibold hover:underline">Sign Up</a>
        </p>
      </div>
    </div>
  `,
  styles: []
})
export class AuthLoginComponent {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onLogin() {
    if (this.loginForm.valid) {
      console.log('Login:', this.loginForm.value);
      // TODO: Call AuthService to login
      // Redirect to dashboard on success
      this.router.navigate(['/dashboard']);
    }
  }
}
