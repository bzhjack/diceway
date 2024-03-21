import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserModel, UserStorageModel } from './user.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private sessionStorageKeyName = 'diceway-session';
  private userEvents = new BehaviorSubject<UserModel | undefined>(undefined);
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
      const accessToken = userStorage.token;
      this.setUserToken(userStorage);
    }
  }

  /**
   * Mise à jour du localStorage avec les infos sur l'utilisateur connecté
   * @param user 
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
    const token = userStorage.token;
    this.userToken = token;
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
    this.clearToken();
    this.router.navigate(['/login']);
  }
  /**
   * Suppression du localStorage et du token dans l'interceptor
   * Suppression du profile utilisateur par broadcast. 
   */
  clearToken() {
    this.userToken = null;
    this.userEvents.next(undefined);
    window.sessionStorage.removeItem(this.sessionStorageKeyName);
  }

  /**
   * Décodage des informations sur le token
   * @param token
   * @returns 
   */
  public parseJwt(token: string) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  }

  /**
   * Test si le token est expiré
   * @param exp 
   * @returns 
   */
  public isExpired(exp: number = 0): boolean {
    return (Date.now() >= exp * 1000);
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
  
  public getHello() {
    return this.http.get('api/hello');
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

  /**
   * Mot de passe oublié
   * @param credentials 
   * @returns 
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
