import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { FirebaseService } from './services/firebase.service';

/**
 * Initialize Firebase before app starts
 */
export function initializeFirebase() {
  return () => FirebaseService.initializeFirebase();
}

/**
 * Application Configuration
 * Providers for router, forms, HTTP client, etc.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    // Initialize Firebase before app starts
    {
      provide: APP_INITIALIZER,
      useFactory: initializeFirebase,
      multi: true
    }
  ]
};
