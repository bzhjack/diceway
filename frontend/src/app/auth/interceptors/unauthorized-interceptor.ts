import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import {inject} from '@angular/core';
import {Observable, throwError} from 'rxjs';
import {tap} from 'rxjs/operators';
import {UserService} from '../services/user.service';
import {MessageService} from "primeng/api";

/**
 * Redirection vers le login en cas de 401
 * @param req
 * @param next
 * @returns
 */
export const UnauthorizedInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const us = inject(UserService);
  const ms = inject(MessageService);
  const authToken = us.getUserToken();
  return next(req).pipe(tap(
    {
      error: err => {
        if (err instanceof HttpErrorResponse && err.status === 401 && us.isLoggedIn()) {
          us.logout();
          throwError(() => err);
        } else if (err instanceof HttpErrorResponse && err.status !== 401) {
          ms.add({ severity: 'error', summary: 'Error', detail: err.statusText});
        }
      }
    }
  ));;
};
