import {Routes} from '@angular/router';
import {authGuard} from './core/auth/auth.guard';
import {publicOnlyGuard} from './core/auth/public-only.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./bol/workspace/workspace-page').then((module) => module.WorkspacePageComponent),
    canActivate: [authGuard],
  },
  {
    path: 'session/live',
    loadComponent: () =>
      import('./bol/session-live/session-live-page').then((module) => module.SessionLivePageComponent),
    canActivate: [authGuard],
  },
  {
    path: 'create/creature',
    loadComponent: () =>
      import('./bol/creature-create/creature-create-page').then(
        (module) => module.CreatureCreatePageComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'create/creature/:id',
    loadComponent: () =>
      import('./bol/creature-create/creature-create-page').then(
        (module) => module.CreatureCreatePageComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'library/creatures',
    loadComponent: () =>
      import('./bol/creature-library/creature-library-page').then(
        (module) => module.CreatureLibraryPageComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'create/:entity',
    loadComponent: () =>
      import('./bol/creation-placeholder/creation-placeholder-page').then(
        (module) => module.CreationPlaceholderPageComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/pages/login-page/login-page').then((module) => module.LoginPageComponent),
    canActivate: [publicOnlyGuard],
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./auth/pages/callback-page/callback-page').then(
        (module) => module.CallbackPageComponent,
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/pages/register-page/register-page').then(
        (module) => module.RegisterPageComponent,
      ),
    canActivate: [publicOnlyGuard],
  },
  {
    path: 'forgotten',
    loadComponent: () =>
      import('./auth/pages/forgotten-page/forgotten-page').then(
        (module) => module.ForgottenPageComponent,
      ),
    canActivate: [publicOnlyGuard],
  },
  {
    path: 'reset/:token',
    loadComponent: () =>
      import('./auth/pages/reset-page/reset-page').then((module) => module.ResetPageComponent),
    canActivate: [publicOnlyGuard],
  },
  {
    path: 'reset/:token/:email',
    loadComponent: () =>
      import('./auth/pages/reset-page/reset-page').then((module) => module.ResetPageComponent),
    canActivate: [publicOnlyGuard],
  },
  {
    path: 'notice',
    loadComponent: () =>
      import('./auth/pages/notice-page/notice-page').then((module) => module.NoticePageComponent),
    canActivate: [publicOnlyGuard],
  },
  {
    path: 'notice/:mode',
    loadComponent: () =>
      import('./auth/pages/notice-page/notice-page').then((module) => module.NoticePageComponent),
    canActivate: [publicOnlyGuard],
  },
  {
    path: 'resend',
    loadComponent: () =>
      import('./auth/pages/resend-page/resend-page').then((module) => module.ResendPageComponent),
    canActivate: [publicOnlyGuard],
  },
  {
    path: 'resend/:state',
    loadComponent: () =>
      import('./auth/pages/resend-page/resend-page').then((module) => module.ResendPageComponent),
    canActivate: [publicOnlyGuard],
  },
  {
    path: 'welcome',
    loadComponent: () =>
      import('./auth/pages/welcome-page/welcome-page').then(
        (module) => module.WelcomePageComponent,
      ),
    canActivate: [publicOnlyGuard],
  },
  {
    path: 'welcome/:state',
    loadComponent: () =>
      import('./auth/pages/welcome-page/welcome-page').then(
        (module) => module.WelcomePageComponent,
      ),
    canActivate: [publicOnlyGuard],
  },
  {
    path: 'notfound',
    loadComponent: () =>
      import('./auth/pages/notfound-page/notfound-page').then(
        (module) => module.NotfoundPageComponent,
      ),
    canActivate: [publicOnlyGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
