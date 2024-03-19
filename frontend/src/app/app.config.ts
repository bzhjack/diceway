import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { UserService } from './auth/services/user.service';
import { LoggedInGuardService } from './auth/guards/logged-in-guard.service';
import { JwtInterceptorService } from './auth/interceptors/jwt-interceptor.service';
import { UnauthorizedInterceptorService } from './auth/interceptors/unauthorized-interceptor.service';
import { HTTP_INTERCEPTORS, provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideRouter(routes),
    provideAnimationsAsync(),
    UserService,
    LoggedInGuardService,
    JwtInterceptorService,
    UnauthorizedInterceptorService,
    {provide: HTTP_INTERCEPTORS, useExisting: JwtInterceptorService, multi: true},
    {provide: HTTP_INTERCEPTORS, useExisting: UnauthorizedInterceptorService, multi: true},
  ]
};

