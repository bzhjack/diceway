import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, filter, firstValueFrom, map, Observable, of, take, tap, timeout } from 'rxjs';
import { OAuthService } from 'angular-oauth2-oidc';
import { environment } from '../../../environments/environment';
import {
  ApiMessageResponse,
  AuthSession,
  AuthUser,
  LoginCredentials,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  ResetPasswordPayload,
} from './auth.models';
import { googleAuthConfig } from './auth.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly oauth = inject(OAuthService);
  private readonly storageKey = 'diceway-session';
  private readonly sessionState = signal<AuthSession | null>(this.restoreSession());

  readonly session = computed(() => this.sessionState());
  readonly user = computed(() => this.sessionState()?.user ?? null);
  readonly token = computed(() => this.sessionState()?.token ?? null);
  readonly authenticated = computed(() => Boolean(this.sessionState()?.token));

  constructor() {
    this.configureOAuth();
    if (this.token()) {
      this.refreshProfile().subscribe();
    }
  }

  login(credentials: LoginCredentials): Observable<AuthUser> {
    return this.http.post<LoginResponse>(this.apiUrl('/api/auth/login'), credentials).pipe(
      tap((response) => this.persistSession({ token: response.token, user: response.user })),
      map((response) => response.user),
    );
  }

  loginWithCredentials(credentials: LoginCredentials): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl('/api/auth/login'), credentials).pipe(
      tap((response) => this.persistSession({ token: response.token, user: response.user })),
    );
  }

  register(payload: RegisterPayload): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(this.apiUrl('/api/auth/register'), payload);
  }

  resendVerification(email: string): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(this.apiUrl('/api/auth/email/send'), { email });
  }

  sendMail(email: string): Observable<ApiMessageResponse> {
    return this.resendVerification(email);
  }

  forgotPassword(email: string): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(this.apiUrl('/api/auth/password/forgotten'), {
      email,
    });
  }

  forgottenPassword(email: string): Observable<ApiMessageResponse> {
    return this.forgotPassword(email);
  }

  resetPassword(payload: ResetPasswordPayload): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(this.apiUrl('/api/auth/password/reset'), payload);
  }

  resetPassord(payload: ResetPasswordPayload): Observable<ApiMessageResponse> {
    return this.resetPassword(payload);
  }

  refreshProfile(): Observable<AuthUser | null> {
    const currentSession = this.sessionState();
    if (!currentSession?.token) {
      return of(null);
    }

    return this.http.get<AuthUser>(this.apiUrl('/api/auth/profile')).pipe(
      tap((user) => this.persistSession({ ...currentSession, user })),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
    );
  }

  initProfileFromLocalToken(): Promise<AuthUser | null> {
    return new Promise((resolve) => {
      this.refreshProfile().subscribe((user) => resolve(user));
    });
  }

  loginWithGoogle(): void {
    this.oauth.initLoginFlow();
  }

  async handleCallback(): Promise<void> {
    await this.oauth.loadDiscoveryDocumentAndTryLogin();
    await this.waitForValidIdToken();

    const idToken = this.oauth.getIdToken();
    if (!idToken) {
      throw new Error('Google id_token missing');
    }

    await this.exchangeGoogleToken(idToken);
    await firstValueFrom(this.refreshProfile());
  }

  logout(): void {
    const currentSession = this.sessionState();
    if (currentSession?.user.id) {
      const headers = new HttpHeaders({
        Authorization: `Bearer ${currentSession.token}`,
      });

      this.http
        .post(this.apiUrl('/api/auth/logout'), { id: currentSession.user.id }, { headers })
        .pipe(catchError(() => of(null)))
        .subscribe();
    }

    this.clearSession();
    try {
      this.oauth.logOut();
    } catch {}
    void this.router.navigateByUrl('/login');
  }

  private configureOAuth(): void {
    this.oauth.configure(googleAuthConfig);
    this.oauth.loadDiscoveryDocumentAndTryLogin().catch(() => undefined);
  }

  private apiUrl(path: string): string {
    return environment.apiBase ? `${environment.apiBase}${path}` : path;
  }

  private persistSession(session: AuthSession): void {
    this.sessionState.set(session);
    sessionStorage.setItem(this.storageKey, JSON.stringify(session));
  }

  private clearSession(): void {
    this.sessionState.set(null);
    sessionStorage.removeItem(this.storageKey);
  }

  private restoreSession(): AuthSession | null {
    const rawSession = sessionStorage.getItem(this.storageKey);
    if (!rawSession) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawSession) as AuthSession;
      if (!parsed.token || !parsed.user?.id) {
        sessionStorage.removeItem(this.storageKey);
        return null;
      }

      return parsed;
    } catch {
      sessionStorage.removeItem(this.storageKey);
      return null;
    }
  }

  private async waitForValidIdToken(timeoutMs = 7000): Promise<void> {
    if (this.oauth.hasValidIdToken()) {
      return;
    }

    await firstValueFrom(
      this.oauth.events.pipe(
        filter((event) =>
          event.type === 'token_received' ||
          event.type === 'silently_refreshed',
        ),
        take(1),
        timeout(timeoutMs),
      ),
    ).catch(() => undefined);
  }

  private async exchangeGoogleToken(idToken: string): Promise<void> {
    const url = this.apiUrl('/api/auth/google/id-token');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ id_token: idToken }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const data = (await response.json()) as Partial<{ token: string }>;
    if (!data.token) {
      throw new Error('Backend token missing after Google login');
    }

    const existing = this.sessionState();
    if (existing?.user) {
      this.persistSession({ ...existing, token: data.token });
      return;
    }

    this.persistSession({
      token: data.token,
      user: {
        id: 'pending',
        name: 'Google user',
        email: 'pending@diceway.local',
      },
    });
  }
}
