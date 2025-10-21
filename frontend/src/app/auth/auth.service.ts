import { Injectable, inject } from '@angular/core';
import { OAuthService, AuthConfig, OAuthEvent } from 'angular-oauth2-oidc';
import { googleAuthConfig } from './auth.config';
import { Router } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly oauth = inject(OAuthService);
  private readonly router = inject(Router);

  constructor() {
    this.configure(googleAuthConfig);
  }

  private configure(config: AuthConfig) {
    this.oauth.configure(config);
    this.oauth.setupAutomaticSilentRefresh();
    // Try to login from hash on redirect
    this.oauth.loadDiscoveryDocumentAndTryLogin().then(async (loggedIn) => {
      if (!loggedIn) {
        // optionally trigger login on app load
        return;
      }
    });
  }

  login(): void {
    // Prevent confusing Google 400 errors by ensuring Client ID and Redirect URI are set correctly
    const clientId = (this.oauth as any).clientId || (googleAuthConfig as any).clientId;
    const redirectUri = (googleAuthConfig as any).redirectUri;

    if (!clientId || typeof clientId !== 'string' || clientId.includes('GOOGLE_CLIENT_ID_PLACEHOLDER')) {
      console.error('[OAuth] Google Client ID is not configured. Set NG_APP_GOOGLE_CLIENT_ID to your real client id.');
      alert('Configuration OAuth invalide: Google Client ID manquant. Veuillez définir NG_APP_GOOGLE_CLIENT_ID et recharger.');
      return;
    }

    if (!redirectUri || typeof redirectUri !== 'string') {
      console.error('[OAuth] Redirect URI is not configured.');
      alert('Configuration OAuth invalide: Redirect URI manquant.');
      return;
    }

    this.oauth.initLoginFlow();
  }

  async handleCallback(): Promise<void> {
    // Ensure the library processes the authorization code on the callback route
    await this.oauth.loadDiscoveryDocumentAndTryLogin();

    // After processing, send the id_token to backend to create local session
    const idToken = this.getIdToken();
    if (idToken) {
      await this.exchangeWithBackend(idToken);
    }
  }

  logout(): void {
    this.oauth.logOut();
    localStorage.removeItem('local_token');
  }

  getIdToken(): string | null {
    return this.oauth.getIdToken();
  }

  getAccessToken(): string | null {
    return this.oauth.getAccessToken();
  }

  isAuthenticated(): boolean {
    return this.oauth.hasValidIdToken();
  }

  getIdentityClaims(): any {
    return this.oauth.getIdentityClaims();
  }

  getLocalApiToken(): string | null {
    return localStorage.getItem('local_token');
  }

  async exchangeWithBackend(idToken: string): Promise<void> {
    const res = await fetch('http://localhost:8000/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ id_token: idToken }),
      credentials: 'include',
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`Backend auth failed: ${msg}`);
    }

    const data = await res.json();
    // Save Sanctum/Passport token from backend
    if (data?.token) {
      localStorage.setItem('local_token', data.token);
    }
  }
}
