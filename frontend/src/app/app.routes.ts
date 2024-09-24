import {Routes} from '@angular/router';
import {loggedInGuard} from './auth/guards/logged-in-guard';
import {CallbackComponent} from './auth/public/callback/callback.component';
import {ForgottenComponent} from './auth/public/forgotten/forgotten.component';
import {LoginComponent} from './auth/public/login/login.component';
import {NotfoundComponent} from './auth/public/notfound/notfound.component';
import {NoticeComponent} from './auth/public/notice/notice.component';
import {RegisterComponent} from './auth/public/register/register.component';
import {ResendComponent} from './auth/public/resend/resend.component';
import {ResetComponent} from './auth/public/reset/reset.component';
import {WelcomeComponent} from './auth/public/welcome/welcome.component';
import {HomeComponent} from './home/home.component';

export const routes: Routes = [
  // Accès public
  {path: 'login', component: LoginComponent}, // Connexion à l'application
  {path: 'forgotten', component: ForgottenComponent}, // Mot de passe oublié
  {path: 'register', component: RegisterComponent}, // Création d'un compte
  {path: 'welcome', component: WelcomeComponent}, // Création d'un compte
  {path: 'welcome/:success', component: WelcomeComponent}, // Création d'un compte
  {path: 'resend', component: ResendComponent}, // Renvoi d'un mail de confirmation
  {path: 'resend/:forbidden', component: ResendComponent}, // Renvoi d'un email de confirmation suite à login
  {path: 'notice', component: NoticeComponent}, // Confirmation de création de compte
  {path: 'notice/:reset', component: NoticeComponent}, // Confirmation de reset du mot de passe
  {path: 'reset/:token/:email', component: ResetComponent}, // Lien sur le mail de reset
  {path: 'callback/:token', component: CallbackComponent}, // Url de callback après authentification
  {path: 'notfound', component: NotfoundComponent}, // Echec à la verification du mail ou 404 standard

  {path: '', component: HomeComponent, canActivate: [loggedInGuard]},
  {
    path: 'bol',
    loadComponent: () => import('./bol/home/home.component').then(m => m.BolHomeComponent),
    canActivate: [loggedInGuard]
  },
  {
    path: 'play',
    loadComponent: () => import('./playground/playground.component').then(m => m.PlaygroundComponent),
    canActivate: [loggedInGuard]
  },
  {
    path: 'bol/heros',
    loadComponent: () => import('./bol/heros/home/home.component').then(m => m.BolHeroHomeComponent),
    canActivate: [loggedInGuard]
  },
  {
    path: 'bol/heros/create/:id',
    loadComponent: () => import('./bol/heros/create/create.component').then(m => m.BolHerosCreateComponent),
    canActivate: [loggedInGuard]
  },
  {
    path: 'bol/creature',
    loadComponent: () => import('./bol/creatures/home/home.component').then(m => m.BolCreatureHomeComponent),
    canActivate: [loggedInGuard]
  },
  {
    path: 'bol/pnj',
    loadComponent: () => import('./bol/pnj/home/home.component').then(m => m.BolPnjHomeComponent),
    canActivate: [loggedInGuard]
  },
  {
    path: 'bol/demon',
    loadComponent: () => import('./bol/demons/home/home.component').then(m => m.BolDemonHomeComponent),
    canActivate: [loggedInGuard]
  },

  {path: '**', redirectTo: '/'},
];
