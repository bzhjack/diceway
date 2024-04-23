import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {UserModel, UserStorageModel} from './user.model';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Router} from '@angular/router';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUser: any = null;
  private sessionStorageKeyName = 'diceway-session';
  private userEvents = new BehaviorSubject<UserModel | undefined>(undefined);
  public user$ = this.userEvents.asObservable();
  private userToken: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    console.log('UserService');
    this.retrieveUser();
  }

  /**
   * Fonction de vérification de la validité de l'authentification
   */
  retrieveUser() {
    const value = window.sessionStorage.getItem(this.sessionStorageKeyName);
    if (value) {
      const userStorage = JSON.parse(value) as UserStorageModel;
      this.setUserToken(userStorage);
    }
  }

  /**
   * Mise à jour du localStorage avec les infos sur l'utilisateur connecté
   * @param userStorage
   */
  storeLoggedInUser(userStorage: UserStorageModel) {
    window.sessionStorage.setItem(this.sessionStorageKeyName, JSON.stringify(userStorage));
    this.setUserToken(userStorage);
  }

  /**
   * Mise à jour du token dans l'interceptor et broadcast du profile utilisateur
   * @param userStorage
   */
  private setUserToken(userStorage: UserStorageModel) {
    this.userToken = userStorage.token;
    this.currentUser = userStorage.profile;
    this.userEvents.next(userStorage.profile);
  }
  /**
   *
   * @returns Récupération du token utilisateur
   */
  public getUserToken() {
    return this.userToken;
  }
  /**
   * Suppression du token et "logout" de l'application.
   */
  logout() {
    this.clearTokens();
    this.clearToken();
    this.router.navigate(['/login']);
  }
  /**
   * Suppression du localStorage et du token dans l'interceptor
   * Suppression du profile utilisateur par broadcast.
   */
  clearToken() {
    this.userToken = null;
    this.currentUser = null;
    this.userEvents.next(undefined);
    window.sessionStorage.removeItem(this.sessionStorageKeyName);
  }

  /**
   * Test si l'état de la connexion
   * @returns
   */
  isLoggedIn(): boolean {
    return !!window.sessionStorage.getItem(this.sessionStorageKeyName);
  }

  /**
   * Récupère le profile utilisteur.
   * @param token
   * @returns
   */
  public profile(token: string): Observable<any> {
    return this.http.get('api/auth/profile', {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    });
  }

  /**
   * Création d'un compte
   * @param credentials
   */
  public register(credentials: any) {
    return this.http.post('/api/auth/register', {
      name: credentials.name,
      email: credentials.email,
      password: credentials.password,
      password_confirmation: credentials.password_confirmation
    });
  }

  /**
   * Envoi de l'émail de verification du compte
   * @param email
   * @returns
   */
  public sendMail(email: string) {
    return this.http.post('/api/auth/email/send', {
      email: email
    });
  }

  /**
   * Authentification
   * @param credentials
   * @returns
   */
  public login(credentials: any) {
    return this.http.post('/api/auth/login', {
      email: credentials.email,
      password: credentials.password
    })
  }

  public clearTokens() {
    if (this.currentUser !== null) {
      this.http.post('/api/auth/logout', {id: this.currentUser.id}).subscribe(() => {
        console.log('Tokens cleared :-)');
      });
    }
  }

  /**
   * Mot de passe oublié
   * @returns
   * @param email
   */
  public forgottenPassword(email: string) {
    return this.http.post('/api/auth/password/forgotten', {
      email: email
    })
  }

  /**
   * Nouveau mot de passe
   * @param credentials
   * @returns
   */
  public resetPassord(credentials: any) {
    return this.http.post('/api/auth/password/reset', {
      token: credentials.token,
      email: credentials.email,
      password: credentials.password,
      password_confirmation: credentials.password_confirmation
    });
  }
}
