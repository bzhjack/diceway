import {Routes} from '@angular/router';
import {LoginComponent} from './auth/public/login/login.component';
import {ForgottenComponent} from './auth/public/forgotten/forgotten.component';
import {CallbackComponent} from './auth/public/callback/callback.component';
import {ResetComponent} from './auth/public/reset/reset.component';

export const routes: Routes = [
  // Public route
  {path: 'login', component: LoginComponent}, // Connexion à l'application
  {path: 'forgotten', component: ForgottenComponent}, // Mot de passe oublié
  {path: 'auth/callback', component: CallbackComponent}, // Url de callback après authentification
  {path: 'reset/:token/:email', component: ResetComponent}, // Lien sur le mail de reset
  {
    path: 'profile',
    loadComponent: () => import('./auth/profile.component').then(m => m.ProfileComponent),
  },
  {path: '', redirectTo: 'login', pathMatch: 'full'},
  {path: '**', redirectTo: 'login'},
];
