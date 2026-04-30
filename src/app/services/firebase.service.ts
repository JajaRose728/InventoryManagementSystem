import { Injectable } from '@angular/core';
import { initializeApp, getApps, FirebaseApp as FirebaseAppType } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { environment } from '../../environments/environment';

/**
 * Firebase Service - Centralized Firebase configuration and initialization
 * This service provides access to Firebase SDK across the application
 */
@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private static app: FirebaseAppType | null = null;
  private static auth: Auth | null = null;
  private static db: Firestore | null = null;
  private static storage: FirebaseStorage | null = null;

  static getFirebaseConfig() {
    return environment.firebase;
  }

  /**
   * Initialize Firebase - Synchronous for APP_INITIALIZER
   */
  static initializeFirebase(): Promise<FirebaseAppType> {
    return new Promise((resolve) => {
      const apps = getApps();
      if (apps.length > 0) {
        this.app = apps[0];
      } else {
        this.app = initializeApp(environment.firebase);
      }

      if (environment.useEmulators) {
        this.connectToEmulators();
      }

      console.log('Firebase initialized:', environment.firebase.projectId);
      resolve(this.app);
    });
  }

  /**
   * Synchronous initialize (for backward compatibility)
   */
  static initializeFirebaseSync(): FirebaseAppType {
    const apps = getApps();
    if (apps.length > 0) {
      this.app = apps[0];
    } else {
      this.app = initializeApp(environment.firebase);
    }
    if (environment.useEmulators) {
      this.connectToEmulators();
    }
    return this.app;
  }

  /**
   * Connect to Firebase emulators for local development
   */
  private static connectToEmulators() {
    // Import dynamically to avoid issues in production
    import('firebase/firestore').then(({ connectFirestoreEmulator }) => {
      if (this.getFirestore()) {
        connectFirestoreEmulator(this.getFirestore()!, 'localhost', 8080);
        console.log('Connected to Firestore emulator at localhost:8080');
      }
    });

    import('firebase/auth').then(({ connectAuthEmulator }) => {
      if (this.getAuth()) {
        connectAuthEmulator(this.getAuth()!, 'http://localhost:9099', { disableWarnings: true });
        console.log('Connected to Auth emulator at localhost:9099');
      }
    });
  }

  /**
   * Get Firestore instance
   */
  static getFirestore(): Firestore | null {
    if (!this.db && this.app) {
      this.db = getFirestore(this.app);
    }
    return this.db;
  }

  /**
   * Get Auth instance
   */
  static getAuth(): Auth | null {
    if (!this.auth && this.app) {
      this.auth = getAuth(this.app);
    }
    return this.auth;
  }

  /**
   * Get Storage instance
   */
  static getStorage(): FirebaseStorage | null {
    if (!this.storage && this.app) {
      this.storage = getStorage(this.app);
    }
    return this.storage;
  }
}
