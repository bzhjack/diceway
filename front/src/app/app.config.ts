import {ApplicationConfig, provideBrowserGlobalErrorListeners} from '@angular/core';
import {provideHttpClient, withInterceptors, withXhr} from '@angular/common/http';
import {provideRouter} from '@angular/router';
import {provideOAuthClient} from 'angular-oauth2-oidc';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS} from '@angular/material/form-field';
import {apiIdNormalizerInterceptor} from './core/api-id-normalizer.interceptor';
import {authInterceptor} from './core/auth/auth.interceptor';
import {portraitUrlInterceptor} from './core/portrait-url.interceptor';
import {routes} from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withXhr(), withInterceptors([authInterceptor, apiIdNormalizerInterceptor, portraitUrlInterceptor])),
    provideOAuthClient(),
    provideRouter(routes),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline', floatLabel: 'always' },
    },
  ],
};
