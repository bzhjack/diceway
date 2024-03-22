import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserService } from '../services/user.service';
import { inject } from '@angular/core';

/**
 * Injection du token dans la requête
 * @param req
 * @param next 
 * @returns 
 */
export const JwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authToken = inject(UserService).getUserToken();
  if (authToken !== null) {
    const clone = req.clone({setHeaders: {Authorization: `Bearer ${authToken}`}});
    return next(clone);
  }
  return next(req);
};
