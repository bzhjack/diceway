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
      <button (click)="loginWithGoogle()">Login with Google</button>
    </div>
  `,
})
export class LoginComponent {
  constructor(private auth: AuthService) {}

  loginWithGoogle() {
    this.auth.login();
  }
}
