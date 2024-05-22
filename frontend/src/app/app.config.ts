import {ApplicationConfig} from '@angular/core';
import {provideRouter} from '@angular/router';

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {routes} from './app.routes';
import {JwtInterceptor} from './auth/interceptors/jwt-interceptor';
import {UnauthorizedInterceptor} from './auth/interceptors/unauthorized-interceptor';
import {UserService} from './auth/services/user.service';
import {MessageService} from "primeng/api";
import {DialogService} from "primeng/dynamicdialog";

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([JwtInterceptor, UnauthorizedInterceptor]),
    ),
    provideRouter(routes),
    provideAnimationsAsync(),
    UserService,
    MessageService,
    DialogService
  ]
};

