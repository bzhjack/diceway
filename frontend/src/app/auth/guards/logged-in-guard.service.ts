import { Injectable } from '@angular/core';
import { UserService } from '../services/user.service';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class LoggedInGuardService {

  constructor(private userService: UserService, private router: Router) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const loggedIn = this.userService.isLoggedIn();
    if (!loggedIn) {
      this.userService.logout();
    }
    return loggedIn;
  }
}
