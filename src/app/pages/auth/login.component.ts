import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-auth-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Background: full screen with centered card -->
    <div class="min-h-screen flex items-center justify-center p-4 sm:p-6"
         [class]="darkMode() ? 'bg-slate-900' : 'bg-gray-100'">

      <!-- Card Container - centered -->
      <div class="w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-2xl"
           [class]="darkMode() ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'">

        <!-- Dark Mode Toggle -->
        <button (click)="toggleDark()"
                class="absolute top-4 right-4 text-2xl p-2 rounded-full transition-colors"
                [class]="darkMode() ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'">
          {{ darkMode() ? '☀️' : '🌙' }}
        </button>

        <!-- Title -->
        <div class="text-center mb-8 mt-2">
          <h1 class="text-3xl font-bold" [class]="darkMode() ? 'text-white' : 'text-gray-900'">Inventory</h1>
          <p [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">Management System</p>
        </div>

        <!-- Login/Register Toggle -->
        <div class="flex mb-6 rounded-lg p-1" [class]="darkMode() ? 'bg-slate-700' : 'bg-gray-100'">
          <button (click)="setMode('login')" class="flex-1 py-2 rounded-md transition-colors"
                  [class]="loginMode() ? (darkMode() ? 'bg-slate-600 text-white shadow' : 'bg-white text-blue-600 shadow') : (darkMode() ? 'text-slate-300' : 'text-gray-500')">Login</button>
          <button (click)="setMode('register')" class="flex-1 py-2 rounded-md transition-colors"
                  [class]="!loginMode() ? (darkMode() ? 'bg-slate-600 text-white shadow' : 'bg-white text-blue-600 shadow') : (darkMode() ? 'text-slate-300' : 'text-gray-500')">Register</button>
        </div>

        <!-- Messages -->
        <div *ngIf="error()" class="mb-4 px-4 py-3 rounded-lg text-sm"
             [class]="darkMode() ? 'bg-red-900/50 text-red-300 border border-red-700' : 'bg-red-50 text-red-600 border border-red-200'">{{ error() }}</div>
        <div *ngIf="successMsg()" class="mb-4 px-4 py-3 rounded-lg text-sm"
             [class]="darkMode() ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-green-50 text-green-600 border border-green-200'">{{ successMsg() }}</div>

        <!-- Form -->
        <form (ngSubmit)="onSubmit()" class="space-y-5">
          <!-- Email -->
          <div>
            <label class="block text-sm font-medium mb-2" [class]="darkMode() ? 'text-slate-300' : 'text-gray-700'">Email</label>
            <input type="email" [(ngModel)]="email" name="email" required autocomplete="email"
                   class="w-full px-4 py-3 rounded-lg border transition-colors text-base"
                   [ngClass]="darkMode() ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500'"
                   placeholder="your@email.com" />
          </div>

          <!-- Password -->
          <div class="relative">
            <label class="block text-sm font-medium mb-2" [class]="darkMode() ? 'text-slate-300' : 'text-gray-700'">Password</label>
            <input [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" name="password" required minlength="6" autocomplete="current-password"
                   class="w-full px-4 py-3 rounded-lg border transition-colors text-base pr-12"
                   [ngClass]="darkMode() ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500'"
                   placeholder="••••••••" />
            <button type="button" (click)="showPassword.update(v => !v)"
                    class="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
              {{ showPassword() ? '🙈' : '👁️' }}
            </button>
          </div>

          <!-- Role -->
          <div *ngIf="!loginMode()">
            <label class="block text-sm font-medium mb-2" [class]="darkMode() ? 'text-slate-300' : 'text-gray-700'">Select Role</label>
            <select [(ngModel)]="role" name="role"
                    class="w-full px-4 py-3 rounded-lg border transition-colors text-base"
                    [ngClass]="darkMode() ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'">
              <option value="user">Add & Search Only</option>
              <option value="admin">Admin (Full CRUD)</option>
            </select>
          </div>

          <!-- Submit -->
          <button type="submit" [disabled]="submitting()"
                  class="w-full py-3 rounded-lg font-medium transition-colors text-base touch-manipulation cursor-pointer"
                  [ngClass]="{'bg-blue-600 hover:bg-blue-700 text-white': true, 'opacity-50 cursor-not-allowed': submitting()}">
            {{ submitting() ? 'Loading...' : (loginMode() ? 'Sign In' : 'Create Account') }}
          </button>
        </form>

        <!-- Forgot Password -->
        <div *ngIf="loginMode()" class="text-center mt-5 pt-4" [class]="darkMode() ? 'border-t border-slate-600' : 'border-t border-gray-200'">
          <button type="button" (click)="showForgotPassword.set(true)"
                  [class]="darkMode() ? 'text-blue-400 hover:text-blue-300 text-sm' : 'text-blue-600 hover:text-blue-800 text-sm'">Forgot Password?</button>
        </div>

        <!-- Modal -->
        <div *ngIf="showForgotPassword()" class="fixed inset-0 flex items-center justify-center p-4 z-50" style="background: rgba(0,0,0,0.6)">
          <div class="w-full max-w-md p-6 rounded-2xl shadow-2xl"
               [class]="darkMode() ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'">
            <h3 class="text-xl font-bold mb-2" [class]="darkMode() ? 'text-white' : 'text-gray-900'">Reset Password</h3>
            <p class="mb-4" [class]="darkMode() ? 'text-slate-400' : 'text-gray-500'">Enter your email to receive a password reset link.</p>
            <input type="email" [(ngModel)]="forgotEmail" placeholder="your@email.com"
                   class="w-full px-4 py-3 rounded-lg border mb-3 transition-colors"
                   [class]="darkMode() ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'" />
            <div *ngIf="forgotError()" class="mb-3 px-3 py-2 rounded-lg text-sm"
                 [class]="darkMode() ? 'bg-red-900/50 text-red-300' : 'bg-red-50 text-red-600'">{{ forgotError() }}</div>
            <div *ngIf="forgotSuccess()" class="mb-3 px-3 py-2 rounded-lg text-sm"
                 [class]="darkMode() ? 'bg-green-900/50 text-green-300' : 'bg-green-50 text-green-600'">{{ forgotSuccess() }}</div>
            <div class="flex gap-2">
              <button (click)="sendResetLink()" [disabled]="forgotLoading()" class="flex-1 py-3 rounded-lg font-medium transition-colors"
                      [class]="darkMode() ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'">{{ forgotLoading() ? 'Sending...' : 'Send Reset Link' }}</button>
              <button (click)="closeForgotModal()" class="px-4 py-3 rounded-lg transition-colors"
                      [class]="darkMode() ? 'bg-slate-600 text-slate-200 border border-slate-500 hover:bg-slate-500' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AuthLoginComponent {
  loginMode = signal(true);
  darkMode = signal(false);
  submitting = signal(false);
  showPassword = signal(false);
  error = signal('');
  successMsg = signal('');
  email = '';
  password = '';
  role = 'user';

  showForgotPassword = signal(false);
  forgotEmail = '';
  forgotLoading = signal(false);
  forgotError = signal('');
  forgotSuccess = signal('');

  constructor(private router: Router) {
    if (localStorage.getItem('darkMode') === 'true') this.darkMode.set(true);
  }

  private authService = inject(AuthService);

  private validateInput(input: string): boolean {
    if (!input || input.trim().length === 0) return false;
    return true;
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  private validatePassword(password: string): { valid: boolean; message: string } {
    if (!password) return { valid: false, message: 'Password is required' };
    if (password.length < 6) return { valid: false, message: 'Password must be at least 6 characters' };
    if (password.length > 128) return { valid: false, message: 'Password is too long (max 128 characters)' };
    return { valid: true, message: '' };
  }

  private sanitize(input: string): string {
    return input.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;');
  }

  setMode(mode: 'login' | 'register') {
    this.loginMode.set(mode === 'login');
    this.error.set('');
    this.successMsg.set('');
    this.email = '';
    this.password = '';
  }

  toggleDark() {
    this.darkMode.update(v => !v);
    localStorage.setItem('darkMode', String(this.darkMode()));
  }

  closeForgotModal() {
    this.showForgotPassword.set(false);
    this.forgotEmail = '';
    this.forgotError.set('');
    this.forgotSuccess.set('');
  }

  async onSubmit() {
    if (!this.validateInput(this.email)) { this.error.set('Email is required'); return; }
    if (!this.validateInput(this.password)) { this.error.set('Password is required'); return; }

    const sanitizedEmail = this.sanitize(this.email.trim());
    const passwordValidation = this.validatePassword(this.password);
    if (!passwordValidation.valid) { this.error.set(passwordValidation.message); return; }
    if (!this.validateEmail(sanitizedEmail)) { this.error.set('Please enter a valid email address'); return; }

    this.submitting.set(true);
    this.error.set('');
    this.successMsg.set('');

    const fb = await import('firebase/auth');
    const auth = FirebaseService.getAuth();
    if (!auth) {
      this.error.set('Authentication service not ready. Please refresh the page.');
      this.submitting.set(false);
      return;
    }

    try {
      const fb = await import('firebase/auth');
      const auth = FirebaseService.getAuth();
      if (!auth) { this.error.set('Authentication service not ready. Please refresh the page.'); this.submitting.set(false); return; }

      if (this.loginMode()) {
        const result = await this.authService.login(sanitizedEmail, this.password);
        if (result.success) {
          try {
            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
            const auth = FirebaseService.getAuth();
            const db = FirebaseService.getFirestore();
            if (db && auth?.currentUser?.uid) {
              await addDoc(collection(db, 'activityLogs'), {
                userId: auth.currentUser.uid,
                userEmail: sanitizedEmail,
                action: 'login',
                details: 'User logged in',
                timestamp: serverTimestamp()
              });
            }
          } catch (logError) { console.warn('Failed to log activity:', logError); }
          
          await this.waitForAuthState();
          this.router.navigate(['/dashboard']);
        } else {
          this.error.set(result.message || 'Login failed');
        }
      } else {
        const { createUserWithEmailAndPassword } = fb;
        const userCred = await createUserWithEmailAndPassword(auth, sanitizedEmail, this.password);
        try {
          const { doc, setDoc, serverTimestamp, collection, addDoc } = await import('firebase/firestore');
          const db = FirebaseService.getFirestore();
          if (db) {
            await setDoc(doc(db, 'users', userCred.user.uid), { uid: userCred.user.uid, email: sanitizedEmail, role: this.role, createdAt: new Date() });
            await addDoc(collection(db, 'activityLogs'), { userId: userCred.user.uid, userEmail: sanitizedEmail, action: 'register', details: 'New user registered', timestamp: serverTimestamp() });
          }
        } catch (saveError) { console.warn('Failed to save user profile:', saveError); }
        this.successMsg.set('Account created! Please login.');
        this.email = ''; this.password = ''; this.setMode('login');
      }
    } catch (e: any) {
      this.error.set(e.message || 'An error occurred');
    } finally {
      this.submitting.set(false);
    }
  }

  private async waitForAuthState(maxWait = 2000): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkAuth = () => {
        if (this.authService.isLoggedIn()) {
          resolve();
          return;
        }
        if (Date.now() - startTime > maxWait) {
          reject(new Error('Auth state timeout'));
          return;
        }
        setTimeout(checkAuth, 100);
      };
      checkAuth();
    });
  }

  async sendResetLink() {
    if (!this.forgotEmail) { this.forgotError.set('Please enter your email'); return; }
    const sanitizedEmail = this.sanitize(this.forgotEmail.trim());
    if (!this.validateEmail(sanitizedEmail)) { this.forgotError.set('Please enter a valid email address'); return; }

    this.forgotLoading.set(true);
    this.forgotError.set('');
    this.forgotSuccess.set('');

    try {
      const fb = await import('firebase/auth');
      const auth = FirebaseService.getAuth();
      if (!auth) { this.forgotError.set('Authentication service not ready'); this.forgotLoading.set(false); return; }
      const { sendPasswordResetEmail } = fb;
      await sendPasswordResetEmail(auth, sanitizedEmail);
      this.forgotSuccess.set('Password reset link sent! Check your email.');
      setTimeout(() => { this.closeForgotModal(); }, 3000);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        this.forgotSuccess.set('If that email exists, a reset link will be sent.');
        setTimeout(() => { this.closeForgotModal(); }, 3000);
      } else if (e.code === 'auth/invalid-email') {
        this.forgotError.set('Invalid email address');
      } else if (e.code === 'auth/network-request-failed') {
        this.forgotError.set('Network error. Check your connection');
      } else {
        this.forgotError.set('Failed to send reset link. Please try again');
      }
    }
    this.forgotLoading.set(false);
  }
}
