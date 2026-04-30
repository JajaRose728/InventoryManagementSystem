import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';

/**
 * Application Configuration
 * Providers for router, forms, HTTP client, etc.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    // TODO: Add Firebase initialization here
    // TODO: Add HTTP interceptors for API calls
    // TODO: Add error handling providers
  ]
};
