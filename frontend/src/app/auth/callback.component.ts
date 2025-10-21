import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="auth-callback">
      <p>Processing sign-in...</p>
    </div>
  `,
})
export class CallbackComponent implements OnInit {
  constructor(private auth: AuthService, private router: Router) {}

  async ngOnInit(): Promise<void> {
    try {
      await this.auth.handleCallback();
    } catch (e) {
      // Optionally log the error; keep UX simple
      // console.error('Auth callback failed', e);
    } finally {
      // Navigate to a default route after processing
      this.router.navigate(['/login']);
    }
  }
}
