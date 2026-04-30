import { Injectable, signal, computed } from '@angular/core';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { FirebaseService } from './firebase.service';

export type UserRole = 'admin' | 'manager' | 'user';

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<AppUser | null>(null);
  private loading = signal(true);

  user = computed(() => this.currentUser());
  isLoggedIn = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'admin');
  isLoading = computed(() => this.loading());

  constructor() {
    this.initAuth();
  }

  private initAuth() {
    const auth = FirebaseService.getAuth();
    if (!auth) {
      this.loading.set(false);
      return;
    }

    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await this.getUserData(firebaseUser.uid);
        this.currentUser.set(userData);
      } else {
        this.currentUser.set(null);
      }
      this.loading.set(false);
    });
  }

  private async getUserData(uid: string): Promise<AppUser | null> {
    try {
      const db = FirebaseService.getFirestore();
      if (!db) return null;

      const docRef = doc(db as Firestore, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as AppUser;
      } else {
        return {
          uid,
          email: '',
          role: 'user',
          displayName: 'User'
        };
      }
    } catch {
      return null;
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      this.loading.set(true);
      const auth = FirebaseService.getAuth();
      if (!auth) return { success: false, message: 'Auth not initialized' };

      const result = await signInWithEmailAndPassword(auth, email, password);
      const userData = await this.getUserData(result.user.uid);
      this.currentUser.set(userData);
      return { success: true, message: 'Login successful' };
    } catch (error: any) {
      return { success: false, message: this.getErrorMessage(error.code) };
    } finally {
      this.loading.set(false);
    }
  }

  async register(email: string, password: string, role: UserRole = 'user'): Promise<{ success: boolean; message: string }> {
    try {
      this.loading.set(true);
      const auth = FirebaseService.getAuth();
      if (!auth) return { success: false, message: 'Auth not initialized' };

      const result = await createUserWithEmailAndPassword(auth, email, password);
      await this.createUserProfile(result.user, role);
      const userData = await this.getUserData(result.user.uid);
      this.currentUser.set(userData);
      return { success: true, message: 'Registration successful' };
    } catch (error: any) {
      return { success: false, message: this.getErrorMessage(error.code) };
    } finally {
      this.loading.set(false);
    }
  }

  private async createUserProfile(user: User, role: UserRole) {
    const db = FirebaseService.getFirestore();
    if (!db) return;

    const userDoc = doc(db as Firestore, 'users', user.uid);
    await setDoc(userDoc, {
      uid: user.uid,
      email: user.email,
      role,
      displayName: user.email?.split('@')[0] || 'User',
      createdAt: new Date()
    });
  }

  async logout() {
    const auth = FirebaseService.getAuth();
    if (auth) {
      await signOut(auth);
    }
    this.currentUser.set(null);
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/invalid-email': return 'Invalid email address';
      case 'auth/user-not-found': return 'User not found';
      case 'auth/wrong-password': return 'Incorrect password';
      case 'auth/email-already-in-use': return 'Email already in use';
      case 'auth/weak-password': return 'Password must be at least 6 characters';
      case 'auth/invalid-credential': return 'Invalid email or password';
      default: return 'An error occurred';
    }
  }

  // Sanitize input to prevent XSS
  sanitize(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate password strength
  validatePassword(password: string): { valid: boolean; message: string } {
    if (password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters' };
    }
    return { valid: true, message: '' };
  }
}