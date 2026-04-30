import { Routes } from '@angular/router';
import { AuthLoginComponent } from './pages/auth/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProductFormComponent } from './pages/product/product-form.component';
import { FirebaseTestComponent } from './pages/firebase-test/firebase-test.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: AuthLoginComponent },
  { path: 'register', component: AuthLoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'products/new', component: ProductFormComponent },
  { path: 'products/edit/:id', component: ProductFormComponent },
  { path: 'firebase-test', component: FirebaseTestComponent },
  { path: 'categories', component: DashboardComponent },
  { path: '**', redirectTo: '/login' }
];