import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirebaseService } from '../../services/firebase.service';
import {
  collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, where, orderBy, limit
} from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

@Component({
  selector: 'app-firebase-test',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="padding: 20px;">
      <h2>Firebase CRUD Test</h2>

      <!-- Connection Status -->
      <div *ngIf="status" [style.color]="status.includes('Error') ? 'red' : 'green'" style="margin-bottom: 15px;">
        {{ status }}
      </div>

      <!-- Auth Test -->
      <div style="border: 1px solid #ccc; padding: 15px; margin-bottom: 15px;">
        <h3>Authentication</h3>
        <input [(ngModel)]="testEmail" placeholder="Test Email" style="margin-right: 10px; padding: 5px;">
        <input [(ngModel)]="testPassword" type="password" placeholder="Password" style="margin-right: 10px; padding: 5px;">
        <button (click)="testSignUp()" [disabled]="loading" style="margin-right: 5px;">Sign Up</button>
        <button (click)="testSignIn()" [disabled]="loading">Sign In</button>
        <button (click)="testSignOut()" [disabled]="loading">Sign Out</button>
        <p *ngIf="authResult">Result: {{ authResult }}</p>
      </div>

      <!-- CRUD Test -->
      <div style="border: 1px solid #ccc; padding: 15px;">
        <h3>Firestore CRUD</h3>
        <input [(ngModel)]="testName" placeholder="Product Name" style="margin-right: 10px; padding: 5px;">
        <input [(ngModel)]="testPrice" placeholder="Price" style="margin-right: 10px; padding: 5px;">
        <button (click)="testCreate()" [disabled]="loading">Create</button>
        <button (click)="testRead()" [disabled]="loading">Read All</button>
        <button (click)="testUpdate()" [disabled]="loading">Update</button>
        <button (click)="testDelete()" [disabled]="loading">Delete</button>
        <p *ngIf="crudResult">Result: {{ crudResult }}</p>

        <div *ngIf="documents.length > 0" style="margin-top: 10px;">
          <h4>Documents:</h4>
          <ul>
            <li *ngFor="let doc of documents">
              {{ doc.id }}: {{ doc.name }} - {{ doc.price }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  `
})
export class FirebaseTestComponent implements OnInit {
  status = '';
  loading = false;
  testEmail = 'test@example.com';
  testPassword = 'test123456';
  testName = 'Test Product';
  testPrice = '99.99';
  authResult = '';
  crudResult = '';
  documents: any[] = [];
  currentDocId = '';
  private db: any;
  private auth: any;

  ngOnInit() {
    this.testConnection();
  }

  async testConnection() {
    try {
      this.status = 'Initializing Firebase...';
    this.db = FirebaseService.getFirestore();
      this.auth = FirebaseService.getAuth();

      this.status = this.db && this.auth
        ? 'Firebase Connected ✓'
        : 'Partial connection';
    } catch (error: any) {
      this.status = 'Error: ' + error.message;
    }
  }

  // Auth Tests
  async testSignUp() {
    this.loading = true;
    this.authResult = '';
    try {
      const result = await createUserWithEmailAndPassword(this.auth, this.testEmail, this.testPassword);
      this.authResult = 'Signed up: ' + result.user.email;
    } catch (error: any) {
      this.authResult = 'Error: ' + error.message;
    }
    this.loading = false;
  }

  async testSignIn() {
    this.loading = true;
    this.authResult = '';
    try {
      const result = await signInWithEmailAndPassword(this.auth, this.testEmail, this.testPassword);
      this.authResult = 'Signed in: ' + result.user.email;
    } catch (error: any) {
      this.authResult = 'Error: ' + error.message;
    }
    this.loading = false;
  }

  async testSignOut() {
    this.loading = true;
    this.authResult = '';
    try {
      await signOut(this.auth);
      this.authResult = 'Signed out successfully';
    } catch (error: any) {
      this.authResult = 'Error: ' + error.message;
    }
    this.loading = false;
  }

  // Firestore CRUD Tests
  async testCreate() {
    this.loading = true;
    this.crudResult = '';
    try {
      const docRef = await addDoc(collection(this.db, 'products'), {
        name: this.testName,
        price: parseFloat(this.testPrice),
        createdAt: new Date()
      });
      this.currentDocId = docRef.id;
      this.crudResult = 'Created: ' + docRef.id;
    } catch (error: any) {
      this.crudResult = 'Error: ' + error.message;
    }
    this.loading = false;
  }

  async testRead() {
    this.loading = true;
    this.crudResult = '';
    this.documents = [];
    try {
      const querySnapshot = await getDocs(collection(this.db, 'products'));
      querySnapshot.forEach((doc: any) => {
        this.documents.push({ id: doc.id, ...doc.data() });
      });
      this.crudResult = 'Read ' + querySnapshot.size + ' documents';
    } catch (error: any) {
      this.crudResult = 'Error: ' + error.message;
    }
    this.loading = false;
  }

  async testUpdate() {
    if (!this.currentDocId) {
      this.crudResult = 'No document to update. Create one first.';
      return;
    }
    this.loading = true;
    this.crudResult = '';
    try {
      const docRef = doc(this.db, 'products', this.currentDocId);
      await updateDoc(docRef, { price: parseFloat(this.testPrice) + 1 });
      this.crudResult = 'Updated: ' + this.currentDocId;
    } catch (error: any) {
      this.crudResult = 'Error: ' + error.message;
    }
    this.loading = false;
  }

  async testDelete() {
    if (!this.currentDocId) {
      this.crudResult = 'No document to delete. Create one first.';
      return;
    }
    this.loading = true;
    this.crudResult = '';
    try {
      const docRef = doc(this.db, 'products', this.currentDocId);
      await deleteDoc(docRef);
      this.crudResult = 'Deleted: ' + this.currentDocId;
      this.currentDocId = '';
    } catch (error: any) {
      this.crudResult = 'Error: ' + error.message;
    }
    this.loading = false;
  }
}