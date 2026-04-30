import { Routes } from '@angular/router';

// Import page components
import { AuthLoginComponent } from './pages/auth/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProductFormComponent } from './pages/product/product-form.component';

/**
 * Application Routes Configuration
 * Includes authentication and main application routes
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: AuthLoginComponent
  },
  {
    path: 'register',
    component: AuthLoginComponent // Reuse component with logic to handle both
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    // canActivate: [AuthGuard] // TODO: Implement auth guard
  },
  {
    path: 'products',
    children: [
      {
        path: 'new',
        component: ProductFormComponent
      },
      {
        path: 'edit/:id',
        component: ProductFormComponent
      }
    ]
  },
  {
    path: 'categories',
    component: DashboardComponent // TODO: Create separate categories component
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
