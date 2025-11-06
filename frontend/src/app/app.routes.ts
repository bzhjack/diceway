import {Routes} from '@angular/router';
import {LoginComponent} from './auth/public/login/login.component';
import {ForgottenComponent} from './auth/public/forgotten/forgotten.component';
import {CallbackComponent} from './auth/public/callback/callback.component';
import {ResetComponent} from './auth/public/reset/reset.component';
import {RegisterComponent} from './auth/public/register/register.component';
import {WelcomeComponent} from './auth/public/welcome/welcome.component';
import {ResendComponent} from './auth/public/resend/resend.component';
import {NoticeComponent} from './auth/public/notice/notice.component';
import {NotfoundComponent} from './auth/public/notfound/notfound.component';
import {authGuard} from './auth/auth.guard';
import {Home} from './home/home';

export const routes: Routes = [
  // Public route
  {path: 'login', component: LoginComponent}, // Connexion à l'application
  {path: 'forgotten', component: ForgottenComponent}, // Mot de passe oublié
  {path: 'register', component: RegisterComponent}, // Création d'un compte
  {path: 'welcome', component: WelcomeComponent}, // Création d'un compte
  {path: 'welcome/:success', component: WelcomeComponent}, // Création d'un compte
  {path: 'resend', component: ResendComponent}, // Renvoi d'un mail de confirmation
  {path: 'resend/:forbidden', component: ResendComponent}, // Renvoi d'un email de confirmation suite à login
  {path: 'notice', component: NoticeComponent}, // Confirmation de création de compte
  {path: 'notice/:reset', component: NoticeComponent}, // Confirmation de reset du mot de passe
  {path: 'reset/:token', component: ResetComponent}, // Lien sur le mail de reset
  {path: 'auth/callback', component: CallbackComponent}, // Url de callback après authentification
  {path: 'notfound', component: NotfoundComponent}, // Echec à la verification du mail ou 404 standard
  {
    path: 'bol',
    loadComponent: () => import('./bol/bol-playground/bol-playground').then(m => m.BolPlayground),
    canActivate: [authGuard]
  },


  {path: '', component: Home, canActivate: [authGuard]},
  {path: '**', redirectTo: '/'}
];
