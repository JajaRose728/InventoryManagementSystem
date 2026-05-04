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
static ensureAppInitialized(): FirebaseAppType {
  if (!this.app) {
    const apps = getApps();
    if (apps.length === 0) {
      this.app = initializeApp(environment.firebase);
      console.log('Firebase initialized:', environment.firebase.projectId);
    } else {
      this.app = apps[0];
    }
    
    if (environment.useEmulators) {
      this.connectToEmulators();
    }
  }
  return this.app;
}

/** Lazy init - call ensureAppInitialized() first */
static getApp(): FirebaseAppType {
  if (!this.app) {
    this.ensureAppInitialized();
  }
  return this.app!;
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
static getFirestore(): Firestore {
  this.ensureAppInitialized();
  if (!this.db) {
    this.db = getFirestore(this.getApp());
  }
  return this.db!;
}

  /**
   * Get Auth instance
   */
static getAuth(): Auth {
  this.ensureAppInitialized();
  if (!this.auth) {
    this.auth = getAuth(this.getApp());
  }
  return this.auth!;
}

  /**
   * Get Storage instance
   */
static getStorage(): FirebaseStorage {
  this.ensureAppInitialized();
  if (!this.storage) {
    this.storage = getStorage(this.getApp());
  }
  return this.storage!;
}
}
