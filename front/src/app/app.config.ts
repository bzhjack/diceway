import {ApplicationConfig, provideBrowserGlobalErrorListeners} from '@angular/core';
import {provideHttpClient, withInterceptors, withXhr} from '@angular/common/http';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {provideRouter} from '@angular/router';
import {provideOAuthClient} from 'angular-oauth2-oidc';
import {providePrimeNG} from 'primeng/config';
import {authInterceptor} from './core/auth/auth.interceptor';
import {DwPreset} from './dw-theme-config';
import {routes} from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
    provideOAuthClient(),
    providePrimeNG({
      theme: {
        preset: DwPreset,
        options: {
          darkModeSelector: false,
        },
      },
    }),
    provideRouter(routes),
  ],
};
