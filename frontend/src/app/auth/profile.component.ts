import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile" *ngIf="(auth.user$ | async) as user">
      <h2>Mon profil</h2>
      <div class="user-info">
        <img *ngIf="user?.picture" [src]="user.picture" alt="Avatar" width="96" height="96" style="border-radius:50%" />
        <div class="details">
          <div><strong>{{ user?.name || (user?.given_name + ' ' + user?.family_name) }}</strong></div>
          <div style="font-size: 0.9em; color: #666">{{ user?.email }}</div>
        </div>
      </div>

      <div class="server" *ngIf="me">
        <h3>Données côté serveur</h3>
        <pre>{{ me | json }}</pre>
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  me: any;
  constructor(public auth: AuthService, private http: HttpClient) {}

  ngOnInit(): void {
    // Fetch from protected backend endpoint to verify Sanctum token works
    this.http.get('http://localhost:8000/api/me').subscribe({
      next: (res) => (this.me = res),
      error: () => (this.me = { error: 'Unable to load /api/me' }),
    });
  }
}
