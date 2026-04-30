import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-auth-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4" [class.dark-bg]="darkMode()">
      <div class="bg-white rounded-lg shadow-2xl max-w-md w-full p-8" [class.dark-card]="darkMode()">

        <button (click)="toggleDark()" class="absolute top-4 right-4 text-2xl">
          {{ darkMode() ? '☀️' : '🌙' }}
        </button>

        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold" [class.text-white]="darkMode()">Inventory</h1>
          <p [class.text-gray-300]="darkMode()">Management System</p>
        </div>

        <div class="flex mb-6 bg-gray-200 rounded-lg p-1" [class.bg-gray-700]="darkMode()">
          <button (click)="setMode('login')" [class.bg-white]="loginMode()" class="flex-1 py-2 rounded-md text-blue-600">Login</button>
          <button (click)="setMode('register')" [class.bg-white]="!loginMode()" class="flex-1 py-2 rounded-md text-blue-600">Register</button>
        </div>

        <div *ngIf="error()" class="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{{ error() }}</div>
        <div *ngIf="successMsg()" class="bg-green-100 text-green-700 px-4 py-2 rounded mb-4">{{ successMsg() }}</div>

        <form (ngSubmit)="onSubmit()" class="space-y-5">
          <div>
            <label class="block text-sm font-medium mb-2" [class.text-gray-200]="darkMode()">Email</label>
            <input type="email" [(ngModel)]="email" name="email" required class="w-full px-4 py-2 border rounded-lg"
                   [class.bg-gray-700]="darkMode()" [class.text-white]="darkMode()" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2" [class.text-gray-200]="darkMode()">Password</label>
            <input type="password" [(ngModel)]="password" name="password" required minlength="6" class="w-full px-4 py-2 border rounded-lg"
                   [class.bg-gray-700]="darkMode()" [class.text-white]="darkMode()" />
          </div>

          <!-- Role selection (Register only) -->
          <div *ngIf="!loginMode()">
            <label class="block text-sm font-medium mb-2" [class.text-gray-200]="darkMode()">Select Role</label>
            <select [(ngModel)]="role" name="role" class="w-full px-4 py-2 border rounded-lg"
                    [class.bg-gray-700]="darkMode()" [class.text-white]="darkMode()">
              <option value="user">User (Search & View Only)</option>
              <option value="admin">Admin (Full CRUD)</option>
            </select>
          </div>

          <button type="submit" [disabled]="submitting()" class="w-full bg-blue-600 text-white py-2 rounded-lg">
            {{ submitting() ? 'Loading...' : (loginMode() ? 'Sign In' : 'Create Account') }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .dark-bg { background: linear-gradient(to bottom right, #1a1a2e, #16213e); }
    .dark-card { background-color: #1f2937; color: white; }
  `]
})
export class AuthLoginComponent {
  loginMode = signal(true);
  darkMode = signal(false);
  submitting = signal(false);
  error = signal('');
  successMsg = signal('');
  email = '';
  password = '';
  role = 'user';

  constructor(private router: Router) {
    if (localStorage.getItem('darkMode') === 'true') this.darkMode.set(true);
  }

  setMode(mode: 'login' | 'register') {
    this.loginMode.set(mode === 'login');
    this.error.set('');
    this.successMsg.set('');
  }

  toggleDark() {
    this.darkMode.update(v => !v);
    localStorage.setItem('darkMode', String(this.darkMode()));
  }

  async onSubmit() {
    if (!this.email || !this.password || this.password.length < 6) {
      this.error.set('Password must be at least 6 characters');
      return;
    }

    this.submitting.set(true);
    this.error.set('');
    this.successMsg.set('');

    try {
      const fb = await import('firebase/auth');
      const auth = FirebaseService.getAuth();
      if (!auth) { this.error.set('Auth not ready'); this.submitting.set(false); return; }

      if (this.loginMode()) {
        // Login
        const { signInWithEmailAndPassword } = fb;
        await signInWithEmailAndPassword(auth, this.email, this.password);
        this.router.navigate(['/dashboard']);
      } else {
        // Register + save role
        const { createUserWithEmailAndPassword } = fb;
        const userCred = await createUserWithEmailAndPassword(auth, this.email, this.password);

        // Save role to Firestore
        const { doc, setDoc } = await import('firebase/firestore');
        const db = FirebaseService.getFirestore();
        if (db) {
          await setDoc(doc(db, 'users', userCred.user.uid), {
            uid: userCred.user.uid,
            email: this.email,
            role: this.role,
            createdAt: new Date()
          });
        }

        this.successMsg.set('Account created! Please login.');
        this.email = ''; this.password = '';
        this.setMode('login');
      }
    } catch (e: any) { this.error.set(e.message || 'Failed'); }

    this.submitting.set(false);
  }
}