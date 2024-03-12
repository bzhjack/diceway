import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {UserService} from '../services/user.service';
import {Router} from '@angular/router';
import {Observable, throwError} from 'rxjs';
import {tap} from 'rxjs/operators';


@Injectable()
export class UnauthorizedInterceptor implements HttpInterceptor {

  constructor(private userService: UserService, private router: Router) {
  }

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
   return next.handle(req).pipe(tap(
     {
       error: err => {
         if (err instanceof HttpErrorResponse && err.status === 401 && this.userService.isLoggedIn()) {
           this.userService.logout();
           throwError(() => err);
         }
       }
     }
   ));
  }
}