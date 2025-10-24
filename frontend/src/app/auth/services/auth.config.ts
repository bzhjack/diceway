import {AuthConfig} from 'angular-oauth2-oidc';
import {environment} from '../../../environments/environment';
import {isDevMode} from '@angular/core';

// Google OAuth2 + OIDC with PKCE
// Values are read from environment variables at build-time when possible.
// Replace placeholders with your actual values or wire to your environment.ts.

export const googleAuthConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  clientId: environment.googleClientId,
  dummyClientSecret: environment.googleClientSecret,
  redirectUri: window.location.origin + '/auth/callback',
  postLogoutRedirectUri: window.location.origin,
  responseType: 'code', // Flux PKCE
  oidc: true,
  requestAccessToken: true,
  scope: 'openid profile email',
  showDebugInformation: true, // Active les logs
  strictDiscoveryDocumentValidation: false,
  skipIssuerCheck: true,
  disableAtHashCheck: false, // Désactive la validation du at_hash
  silentRefreshRedirectUri: window.location.origin + '/silent-refresh.html',
  silentRefreshTimeout: 5000,
  requireHttps: !isDevMode(),
  clockSkewInSec: 300,
};

