import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="login">
      <h2>Login</h2>

      <ng-container *ngIf="auth.isAuthenticated(); else loggedOut">
        <div class="user-info" *ngIf="(auth.user$ | async) as user">
          <img *ngIf="user?.picture" [src]="user.picture" alt="Avatar" width="64" height="64" style="border-radius:50%" />
          <div class="details">
            <div>{{ user?.name || (user?.given_name + ' ' + user?.family_name) }}</div>
            <div style="font-size: 0.9em; color: #666">{{ user?.email }}</div>
          </div>
        </div>
        <button (click)="logout()">Logout</button>
      </ng-container>

      <ng-template #loggedOut>
        <button (click)="loginWithGoogle()">Login with Google</button>
      </ng-template>
    </div>
  `,
})
export class LoginComponent {
  constructor(public auth: AuthService) {}

  loginWithGoogle() {
    this.auth.login();
  }

  logout() {
    this.auth.logout();
  }
}
