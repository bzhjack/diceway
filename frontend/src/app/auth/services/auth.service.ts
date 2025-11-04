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
  private readonly http = inject(HttpClient);

  // ✅ on restaure le user depuis sessionStorage au démarrage
  private readonly userSubject = new BehaviorSubject<UserModel | null>(
    this.restoreUserFromStorage()
  );
  readonly user$ = this.userSubject.asObservable();

  constructor() {
    this.configure(googleAuthConfig);
  }

  private configure(config: AuthConfig) {
    this.oauth.configure(config);
    this.oauth.setupAutomaticSilentRefresh();

    this.oauth.loadDiscoveryDocumentAndTryLogin().then(async (loggedIn) => {
      if (loggedIn && this.oauth.hasValidIdToken()) {
        this.updateUserFromClaims();
        await this.loadUserProfileIfNeeded();
        return;
      }

      const localToken = this.getLocalApiToken();
      if (localToken) {
        await this.initProfileFromLocalToken();
        return;
      }

      this.userSubject.next(null);
      sessionStorage.removeItem('user_profile'); // ✅ on nettoie le cache
    });
  }

  login(): void {
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
    try {
      const current = this.userSubject.getValue();
      if (current && current.id) {
        this.http.post(`${environment.apiBase}/api/auth/logout`, { id: current.id }).subscribe();
      }
    } catch {}

    sessionStorage.removeItem('local_token');
    sessionStorage.removeItem('user_profile'); // ✅ on efface le cache du profil
    this.userSubject.next(null);
    try { this.oauth.logOut(); } catch {}
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

  loginWithCredentials(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${environment.apiBase}/api/auth/login`, credentials);
  }

  profile(token: string): Observable<any> {
    return this.http.get(`${environment.apiBase}/api/auth/profile`, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`),
    });
  }

  me(): Observable<any> {
    return this.http.get(`${environment.apiBase}/api/auth/me`);
  }

  register(credentials: { name: string; email: string; password: string; password_confirmation: string }): Observable<any> {
    return this.http.post(`${environment.apiBase}/api/auth/register`, credentials);
  }

  sendMail(email: string): Observable<any> {
    return this.http.post(`${environment.apiBase}/api/auth/email/send`, { email });
  }

  forgottenPassword(email: string): Observable<any> {
    return this.http.post(`${environment.apiBase}/api/auth/password/forgotten`, { email });
  }

  resetPassord(credentials: { token: string; email: string; password: string; password_confirmation: string }): Observable<any> {
    return this.http.post(`${environment.apiBase}/api/auth/password/reset`, credentials);
  }

  async initProfileFromLocalToken(): Promise<void> {
    const token = this.getLocalApiToken();
    if (!token) {
      this.userSubject.next(null);
      sessionStorage.removeItem('user_profile');
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
      this.setUser(profile); // ✅ on passe par setUser
    } catch (err) {
      console.warn('[Auth] Failed to load profile from local token', err);
      sessionStorage.removeItem('local_token');
      sessionStorage.removeItem('user_profile');
      this.userSubject.next(null);
    }
  }

  private updateUserFromClaims(): void {
    const claims: any = this.oauth.getIdentityClaims();
    if (!claims || typeof claims !== 'object') {
      this.userSubject.next(null);
      sessionStorage.removeItem('user_profile');
      return;
    }

    const profile = {
      name: claims['name'],
      email: claims['email'],
      avatar: claims['picture'],
    } as UserModel;

    this.setUser(profile); // ✅ au lieu de next direct
  }

  private async loadUserProfileIfNeeded(): Promise<void> {
    const current = this.userSubject.getValue() || {};
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
        this.setUser(enriched); // ✅
      }
    } catch {}
  }

  private async waitForValidIdToken(timeoutMs = 7000): Promise<void> {
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
    } catch {}
  }

  async exchangeWithBackend(idToken: string): Promise<void> {
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

    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    if (data?.token) {
      sessionStorage.setItem('local_token', data.token);
    }
  }

  // ✅ fonctions utilitaires de persistance du user
  private setUser(user: UserModel | null): void {
    this.userSubject.next(user);
    if (user) {
      sessionStorage.setItem('user_profile', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('user_profile');
    }
  }

  private restoreUserFromStorage(): UserModel | null {
    try {
      const raw = sessionStorage.getItem('user_profile');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
