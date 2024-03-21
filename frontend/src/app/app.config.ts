import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { LoggedInGuardService } from './auth/guards/logged-in-guard.service';
import { JwtInterceptor } from './auth/interceptors/jwt-interceptor';
import { UnauthorizedInterceptorService } from './auth/interceptors/unauthorized-interceptor.service';
import { UserService } from './auth/services/user.service';
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([JwtInterceptor]),
      withInterceptorsFromDi()
    ),
    provideRouter(routes),
    provideAnimationsAsync(),
    UserService,
    LoggedInGuardService,
    UnauthorizedInterceptorService,
    { provide: HTTP_INTERCEPTORS, useExisting: UnauthorizedInterceptorService, multi: true },
  ]
};

