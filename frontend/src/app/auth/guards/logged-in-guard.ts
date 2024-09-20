import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {UserService} from '../services/user.service';

export const loggedInGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot
): boolean | UrlTree => {
  const us = inject(UserService);
  const router = inject(Router);
  const loggedIn = us.isLoggedIn();
  if (!loggedIn) {
    us.logout();
  }
  return loggedIn;
};
