import {inject, Injectable} from '@angular/core';
import {AuthConfig, OAuthService} from 'angular-oauth2-oidc';
import {googleAuthConfig} from './auth.config';
import {Router} from '@angular/router';
import {BehaviorSubject, firstValueFrom, Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {filter, take, timeout as rxTimeout} from 'rxjs/operators';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {UserModel} from './user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly oauth = inject(OAuthService);
  private readonly router = inject(Router);

  // In-memory user profile derived from id_token or userinfo endpoint
  private readonly userSubject = new BehaviorSubject<UserModel | null>(null);
  readonly user$ = this.userSubject.asObservable();

  constructor() {
    this.configure(googleAuthConfig);
  }

  private configure(config: AuthConfig) {
    this.oauth.configure(config);
    this.oauth.setupAutomaticSilentRefresh();

    // ✅ On ne vide plus le user en cas de refresh tant qu’on n’a pas essayé de le restaurer
    this.oauth.loadDiscoveryDocumentAndTryLogin().then(async (loggedIn) => {
      if (loggedIn && this.oauth.hasValidIdToken()) {
        // Si on est connecté via OAuth → on restaure le profil Google
        this.updateUserFromClaims();
        await this.loadUserProfileIfNeeded();
        return;
      }

      // ✅ Sinon, on tente de restaurer le profil depuis le token local
      const localToken = this.getLocalApiToken();
      if (localToken) {
        await this.initProfileFromLocalToken();
        return;
      }

      // Si rien de valide → on reste déconnecté
      this.userSubject.next(null);
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

  private readonly http = inject(HttpClient);

  logout(): void {
    try {
      const current = this.userSubject.getValue();
      if (current && current.id) {
        // Best-effort server-side token invalidation
        this.http.post(`${environment.apiBase}/api/auth/logout`, { id: current.id }).subscribe({
          next: () => console.log('[Auth] Server tokens cleared'),
          error: () => console.warn('[Auth] Could not clear server tokens'),
        });
      }
    } catch {}

    // Clear local app token and in-memory user
    sessionStorage.removeItem('local_token');
    this.userSubject.next(null);

    // OAuth logout if applicable
    try { this.oauth.logOut(); } catch {}

    // Navigate to login for a clear UX
    this.router.navigate(['/login']);
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

  // ======= Credentials-based backend auth (migrated from UserService) =======
  loginWithCredentials(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${environment.apiBase}/api/auth/login`, {
      email: credentials.email,
      password: credentials.password,
    });
  }

  profile(token: string): Observable<any> {
    return this.http.get(`${environment.apiBase}/api/auth/profile`, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`),
    });
  }

  register(credentials: { name: string; email: string; password: string; password_confirmation: string }): Observable<any> {
    return this.http.post(`${environment.apiBase}/api/auth/register`, {
      name: credentials.name,
      email: credentials.email,
      password: credentials.password,
      password_confirmation: credentials.password_confirmation,
    });
  }

  sendMail(email: string): Observable<any> {
    return this.http.post(`${environment.apiBase}/api/auth/email/send`, { email });
  }

  forgottenPassword(email: string): Observable<any> {
    return this.http.post(`${environment.apiBase}/api/auth/password/forgotten`, { email });
  }

  resetPassord(credentials: { token: string; email: string; password: string; password_confirmation: string }): Observable<any> { // keep existing name for compatibility
    return this.http.post(`${environment.apiBase}/api/auth/password/reset`, {
      token: credentials.token,
      email: credentials.email,
      password: credentials.password,
      password_confirmation: credentials.password_confirmation,
    });
  }

  // Initialize in-memory user profile when using local (credentials-based) login
  async initProfileFromLocalToken(): Promise<void> {
    const token = this.getLocalApiToken();
    if (!token) {
      this.userSubject.next(null);
      return;
    }
    try {
      const data: any = await firstValueFrom(this.profile(token));
      const profile: UserModel = {
        id: data?.id,
        name: data?.name,
        email: data?.email,
        avatar: data?.avatar,
        email_verified_at: data?.email_verified_at ?? null,
        created_at: data?.created_at ?? null,
        updated_at: data?.updated_at ?? null,
      };
      this.userSubject.next(profile);
    } catch (err) {
      console.warn('[Auth] Failed to load profile from local token', err);
      sessionStorage.removeItem('local_token');
      this.userSubject.next(null);
    }
  }

  // Populate user profile from ID token claims
  private updateUserFromClaims(): void {
    const claims: any = this.oauth.getIdentityClaims();
    if (!claims || typeof claims !== 'object') {
      this.userSubject.next(null);
      return;
    }

    const profile = {
      name: claims['name'],
      email: claims['email'],
      avatar: claims['picture'],
    } as UserModel;

    this.userSubject.next(profile);
  }

  // Enrich the profile by calling the userinfo endpoint when needed
  private async loadUserProfileIfNeeded(): Promise<void> {
    const current = this.userSubject.getValue() || {};
    // If we already have basic fields, we can skip calling userinfo
    const needsMore = !current.email || !current.name || !current.avatar;
    if (!needsMore) return;

    try {
      const info: any = await this.oauth.loadUserProfile();
      if (info && typeof info === 'object') {
        const enriched = {
          ...current,
          name: info['name'] ?? current['name'],
          email: info['email'] ?? current['email'],
          avatar: info['picture'] ?? current['avatar'],
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
