/**
 * Auth Guard - Protects routes that require authentication
 */
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Redirect to login with return URL
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

/**
 * Admin Guard - Protects routes that require admin role
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    if (authService.isAdmin()) {
      return true;
    }
    // Logged in but not admin - redirect to dashboard
    router.navigate(['/dashboard']);
    return false;
  }

  // Not logged in - redirect to login
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

/**
 * Manager Guard - Protects routes that require manager or admin role
 * Regular users cannot access these routes
 */
export const managerGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (authService.isAdmin()) {
    return true;
  }

  if (authService.isManager()) {
    return true;
  }

  // Regular user - redirect to dashboard (restricted view)
  router.navigate(['/dashboard']);
  return false;
};

/**
 * Guest Guard - Protects routes for unauthenticated users (login, register)
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  }

  // Already logged in - redirect to dashboard
  router.navigate(['/dashboard']);
  return false;
};