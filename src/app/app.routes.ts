import { Routes } from '@angular/router';
import { AuthLoginComponent } from './pages/auth/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProductFormComponent } from './pages/product/product-form.component';
import { FirebaseTestComponent } from './pages/firebase-test/firebase-test.component';
import { StockHistoryComponent } from './pages/stockHistory/stockHistory.component';
import { UsersComponent } from './pages/users/users.component';
import { authGuard, adminGuard, managerGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: AuthLoginComponent },
  { path: 'register', component: AuthLoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'products/new', component: ProductFormComponent, canActivate: [authGuard] },  // All logged-in users can add
  { path: 'products/edit/:id', component: ProductFormComponent, canActivate: [managerGuard] },  // Only manager/admin can edit
  { path: 'firebase-test', component: FirebaseTestComponent },
  { path: 'categories', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'stockHistory', component: StockHistoryComponent, canActivate: [adminGuard] },  // Only admin can view stock history
  { path: 'users', component: UsersComponent, canActivate: [adminGuard] },
  { path: '**', redirectTo: '/login' }
];