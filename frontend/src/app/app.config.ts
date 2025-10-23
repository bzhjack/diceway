import {ApplicationConfig} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {provideOAuthClient} from 'angular-oauth2-oidc';

import {routes} from './app.routes';
import {authTokenInterceptor} from './auth/auth.interceptor';
import {providePrimeNG} from 'primeng/config';
import Lara from '@primeuix/themes/lara'
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authTokenInterceptor])),
    provideOAuthClient(),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Lara
      }
    })
  ]
};
