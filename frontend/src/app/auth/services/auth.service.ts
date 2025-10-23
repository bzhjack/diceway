import {inject, Injectable} from '@angular/core';
import {AuthConfig, OAuthService} from 'angular-oauth2-oidc';
import {googleAuthConfig} from './auth.config';
import {Router} from '@angular/router';
import {BehaviorSubject, firstValueFrom} from 'rxjs';
import {environment} from '../../../environments/environment';
import {filter, take, timeout as rxTimeout} from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly oauth = inject(OAuthService);
  private readonly router = inject(Router);

  // In-memory user profile derived from id_token or userinfo endpoint
  private readonly userSubject = new BehaviorSubject<{
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  } | null>(null);
  readonly user$ = this.userSubject.asObservable();

  constructor() {
    this.configure(googleAuthConfig);
  }

  private configure(config: AuthConfig) {
    this.oauth.configure(config);
    this.oauth.setupAutomaticSilentRefresh();
    // Try to login from URL on redirect and populate profile
    this.oauth.loadDiscoveryDocumentAndTryLogin().then(async (loggedIn) => {
      if (!loggedIn) {
        // optionally trigger login on app load
        return;
      }
      this.updateUserFromClaims();
      await this.loadUserProfileIfNeeded();
    });
  }

  login(): void {
    // Prevent confusing Google 400 errors by ensuring Client ID and Redirect URI are set correctly
    const clientId = (this.oauth as any).clientId || (googleAuthConfig as any).clientId;
    const redirectUri = (googleAuthConfig as any).redirectUri;

    if (!clientId || typeof clientId !== 'string') {
      console.error('[OAuth] Google Client ID is not configured. Configure environment.googleClientId in environment.ts.');
      alert('Configuration OAuth invalide: Google Client ID manquant. Veuillez configurer environment.googleClientId et recharger.');
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

    // Wait until the ID token is actually available (no arbitrary setTimeout)
    await this.waitForValidIdToken(7000);

    // Populate user profile from id_token and attempt to enrich from userinfo
    this.updateUserFromClaims();
    await this.loadUserProfileIfNeeded();
    // After processing, send the id_token to backend to create local session
    const idToken = this.getIdToken();
    if (idToken) {
      await this.exchangeWithBackend(idToken);
    }
  }

  logout(): void {
    this.oauth.logOut();
    sessionStorage.removeItem('local_token');
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
    return sessionStorage.getItem('local_token');
  }

  // Populate user profile from ID token claims
  private updateUserFromClaims(): void {
    const claims: any = this.oauth.getIdentityClaims();
    if (!claims || typeof claims !== 'object') {
      this.userSubject.next(null);
      return;
    }

    const profile = {
      sub: claims['sub'],
      email: claims['email'],
      email_verified: claims['email_verified'],
      name: claims['name'],
      given_name: claims['given_name'],
      family_name: claims['family_name'],
      picture: claims['picture'],
    } as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
      given_name?: string;
      family_name?: string;
      picture?: string;
    };

    this.userSubject.next(profile);
  }

  // Enrich the profile by calling the userinfo endpoint when needed
  private async loadUserProfileIfNeeded(): Promise<void> {
    const current = this.userSubject.getValue() || {};
    // If we already have basic fields, we can skip calling userinfo
    const needsMore = !current.email || !current.name || !current.picture;
    if (!needsMore) return;

    try {
      const info: any = await this.oauth.loadUserProfile();
      if (info && typeof info === 'object') {
        const enriched = {
          ...current,
          sub: info['sub'] ?? current['sub'],
          email: info['email'] ?? current['email'],
          email_verified: info['email_verified'] ?? current['email_verified'],
          name: info['name'] ?? current['name'],
          given_name: info['given_name'] ?? current['given_name'],
          family_name: info['family_name'] ?? current['family_name'],
          picture: info['picture'] ?? current['picture'],
        };
        this.userSubject.next(enriched);
      }
    } catch {
      // Ignore userinfo errors; we still have id_token claims
    }
  }

  private async waitForValidIdToken(timeoutMs = 7000): Promise<void> {
    // If token already valid, nothing to wait for
    if (this.oauth.hasValidIdToken()) return;

    try {
      await firstValueFrom(
        this.oauth.events.pipe(
          filter((e: any) =>
            e?.type === 'token_received' ||
            e?.type === 'silently_refreshed' ||
            e?.type === 'token_refresh_success'
          ),
          take(1),
          rxTimeout(timeoutMs)
        )
      );
    } catch (err) {
      // If timeout occurs, proceed; getIdToken may still be available shortly after
    }
  }

  async exchangeWithBackend(idToken: string): Promise<void> {
    // Build API URL from environment; use relative path in dev for proxy
    const apiBase = environment.apiBase || '';
    const url = apiBase ? `${apiBase}/api/auth/google/id-token` : `/api/auth/google/id-token`;

    const res = await fetch(url, {
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
    // Save Sanctum token from backend
    if (data?.token) {
      sessionStorage.setItem('local_token', data.token);
    }
  }
}
