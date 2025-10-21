# Intégration Google OAuth2 (PKCE) — Angular (frontend) + Laravel (backend)

Ce guide fournit la configuration complète pour authentifier un utilisateur via Google sur le frontend Angular (PKCE) puis transmettre le token au backend Laravel pour vérification et création d'une session locale (token Sanctum).

Contexte local utilisé dans les exemples:
- Frontend Angular: http://localhost:4200
- Backend Laravel API: http://localhost:8000/api
- Flux: OAuth2 + OIDC avec PKCE côté frontend; le frontend envoie l'id_token Google au backend qui le vérifie et émet un token local Sanctum.


===========================
Fichiers — Frontend Angular
===========================

1) Dépendance
- Fichier: frontend/package.json
- Ajout:
  "dependencies": {
    ...,
    "angular-oauth2-oidc": "^17.0.2"
  }

2) Configuration OAuth — Google (PKCE)
- Fichier: frontend/src/app/auth/auth.config.ts
- Imports nécessaires:
  import { AuthConfig } from 'angular-oauth2-oidc';

- Contenu principal:
  export const googleAuthConfig: AuthConfig = {
    issuer: 'https://accounts.google.com',
    clientId: (window as any)["env"]?.NG_APP_GOOGLE_CLIENT_ID || 'GOOGLE_CLIENT_ID_PLACEHOLDER',
    redirectUri: window.location.origin + '/auth/callback',
    postLogoutRedirectUri: window.location.origin,
    responseType: 'code',
    scope: 'openid profile email',
    usePkce: true,
    showDebugInformation: false,
    strictDiscoveryDocumentValidation: false,
    strictDiscoveryDocumentValidationForUrls: false,
    requireHttps: false, // ok pour localhost uniquement
  };

3) AuthService — gestion login/logout/token
- Fichier: frontend/src/app/auth/auth.service.ts
- Imports nécessaires:
  import { OAuthService, AuthConfig, OAuthEvent } from 'angular-oauth2-oidc';
  import { Router } from '@angular/router';

- Fonctions clés exposées:
  - login(): lance le flow PKCE vers Google
  - handleCallback(): à appeler sur la page de callback pour attendre le token puis l'envoyer au backend
  - logout(): déconnexion
  - getIdToken(), getAccessToken(), isAuthenticated(), getIdentityClaims()
  - exchangeWithBackend(idToken): envoi de l'id_token à http://localhost:8000/api/auth/google

4) Guard — protection de routes
- Fichier: frontend/src/app/auth/auth.guard.ts
- Import nécessaire: import { CanActivateFn } from '@angular/router';
- Utilisation: ajouter canActivate: [authGuard] sur les routes protégées.

5) Composant de connexion — exemple
- Fichier: frontend/src/app/auth/login.component.ts
- Bouton « Login with Google » qui appelle this.auth.login().

6) Exemple d'intégration des routes/app config (snippets)
- app.routes.ts (exemple):
  import { Routes } from '@angular/router';
  import { LoginComponent } from './auth/login.component';
  import { authGuard } from './auth/auth.guard';

  export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'auth/callback', loadComponent: () => import('./auth/login.component').then(m => m.LoginComponent) },
    { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) },
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  ];

- Sur la route /auth/callback, appelez AuthService.handleCallback() (par exemple dans un petit composant CallbackComponent) ou dans LoginComponent si vous le chargez aussi pour ce path.

7) Intercepteur HTTP (optionnel)
- Si vous souhaitez envoyer automatiquement le token local Sanctum, vous pouvez stocker le token dans localStorage ('local_token') et créer un HttpInterceptor qui ajoute Authorization: Bearer <token> pour les requêtes vers http://localhost:8000/api.


==========================
Fichiers — Backend Laravel
==========================

1) Dépendances Laravel
- Déjà présentes dans backend/composer.json: guzzlehttp/guzzle, laravel/sanctum, laravel/socialite (utilisé ailleurs, pas obligatoire pour ce flow).

2) Route d'authentification Google (réception du token)
- Fichier: backend/routes/api.php
- Ajout import: use App\Http\Controllers\Auth\GoogleAuthController;
- Ajout route publique:
  Route::post('/auth/google', [GoogleAuthController::class, 'verify']);

3) Contrôleur de vérification Google
- Fichier: backend/app/Http/Controllers/Auth/GoogleAuthController.php
- Imports nécessaires:
  use App\Models\User;
  use GuzzleHttp\Client;
  use Illuminate\Http\Request;
  use Illuminate\Support\Facades\Validator;

- Logique:
  - Valide la présence de id_token
  - Appelle https://oauth2.googleapis.com/tokeninfo?id_token=... pour valider
  - Vérifie aud === GOOGLE_CLIENT_ID
  - Récupère email, name
  - Crée ou récupère un User local
  - Marque email_verified_at si email_verified = true
  - Génère un token Sanctum: $user->createToken('google')->plainTextToken
  - Répond JSON: { token, token_type: 'Bearer', user: { ... } }

4) Modèle User
- Fichier: backend/app/Models/User.php
- Doit utiliser HasApiTokens (déjà présent): use Laravel\Sanctum\HasApiTokens;

5) CORS
- Assurez-vous que les CORS autorisent http://localhost:4200 sur Laravel (config/cors.php). Pour un test rapide, vous pouvez utiliser 'paths' => ['api/*', 'sanctum/csrf-cookie'] et origines autorisées ['http://localhost:4200'].


===========================
Variables d'environnement
===========================

Frontend (Angular)
- NG_APP_GOOGLE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
- NG_APP_API_BASE_URL=http://localhost:8000/api  (optionnel si vous centralisez l'URL API)

Backend (Laravel)
- GOOGLE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
- APP_URL=http://localhost:8000
- SANCTUM_STATEFUL_DOMAINS=localhost:4200
- SESSION_DOMAIN=localhost
- SESSION_DRIVER=cookie
- FRONTEND_URL=http://localhost:4200 (optionnel si vous faites des redirections)

Note: Vous pouvez également configurer services.google dans config/services.php:
  'google' => [
      'client_id' => env('GOOGLE_CLIENT_ID'),
  ],


===========================
Étapes pour tester en local
===========================

Prérequis Google Cloud Console
1. Créez un identifiant OAuth 2.0 (type Application Web) avec:
   - URI de redirection autorisé: http://localhost:4200/auth/callback
   - Origines JavaScript autorisées: http://localhost:4200
2. Récupérez le Client ID et placez-le dans NG_APP_GOOGLE_CLIENT_ID (frontend) et GOOGLE_CLIENT_ID (backend).

Backend Laravel
1. cd backend
2. cp .env.example .env (si nécessaire), éditez les variables ci-dessus
3. php artisan key:generate
4. php artisan migrate
5. php artisan serve --host=127.0.0.1 --port=8000

Frontend Angular
1. cd frontend
2. npm install
3. npm start (démarre sur http://localhost:4200)

Parcours de test
1. Ouvrez http://localhost:4200, naviguez vers /login
2. Cliquez « Login with Google »
3. Après la connexion Google, vous revenez sur /auth/callback
4. Le frontend récupère id_token et l'envoie en POST à http://localhost:8000/api/auth/google
5. Le backend vérifie le token auprès de Google, créé/récupère l'utilisateur, émet un token Sanctum
6. Le frontend stocke le token local (localStorage: local_token)
7. Vos requêtes protégées peuvent utiliser Authorization: Bearer <local_token>


===========================
Imports récapitulés
===========================

Angular
- import { AuthConfig, OAuthService, OAuthEvent } from 'angular-oauth2-oidc';
- import { CanActivateFn } from '@angular/router';
- import { CommonModule } from '@angular/common';

Laravel
- use GuzzleHttp\Client;
- use Illuminate\Support\Facades\Validator;
- use App\Models\User;
- use Laravel\Sanctum\HasApiTokens; (dans le modèle User)


===========================
Notes & Sécurité
===========================
- En production, laissez requireHttps=true et utilisez HTTPS pour frontend et backend.
- Validez également l'issuer (iss) et l'expiration (exp) de l'id_token si vous ne passez pas par tokeninfo.
- Limitez le CORS et les origines autorisées.
- Préférez les cookies httpOnly/SameSite pour la session si vous choisissez de vous appuyer sur Sanctum côté cookie. Ici on renvoie un token Bearer pour simplicité.
