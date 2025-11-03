import {Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {AuthService} from './services/auth.service';
import {environment} from '../../environments/environment';
import {UserModel} from './services/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (me; as user) {
      <div class="profile">
        <h2>Mon profil</h2>
        <div class="user-info">
          @if (user?.avatar) {
            <img [src]="environment.apiBase + '/api/auth/avatar/' + user.avatar" alt="Avatar" width="96" height="96" style="border-radius:50%" />
          }
          <div class="details">
            <div><strong>{{ user?.name }}</strong></div>
            <div style="font-size: 0.9em; color: #666">{{ user?.email }}</div>
          </div>
        </div>


        @if (me) {
          <div class="server">
            <h3>Données côté serveur</h3>
            <pre>{{ me | json }}</pre>
          </div>
        }
      </div>
    }
    <div class="actions" style="margin-top:16px;">
      <button type="button" (click)="auth.logout()">Se déconnecter</button>
    </div>

  `,
})
export class ProfileComponent implements OnInit {
  auth = inject(AuthService);
  private http = inject(HttpClient);

  me?: UserModel;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  ngOnInit(): void {
    // Fetch from protected backend endpoint to verify Sanctum token works
    const apiBase = environment.apiBase;
    const url = apiBase ? `${apiBase}/api/auth/me` : '/api/auth/me';
    this.http.get(url).subscribe({
      next: (res) => (this.me = res)
    });
  }

  protected readonly environment = environment;
}
