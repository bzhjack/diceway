import {isDevMode} from '@angular/core';
import {AuthConfig} from 'angular-oauth2-oidc';
import {environment} from '../../../environments/environment';

export const googleAuthConfig: AuthConfig = {
  issuer: 'https://accounts.google.com',
  clientId: environment.googleClientId,
  dummyClientSecret: environment.googleClientSecret,
  redirectUri: `${window.location.origin}/auth/callback`,
  postLogoutRedirectUri: window.location.origin,
  responseType: 'code',
  oidc: true,
  requestAccessToken: true,
  scope: 'openid profile email',
  showDebugInformation: false,
  strictDiscoveryDocumentValidation: false,
  skipIssuerCheck: true,
  requireHttps: !isDevMode(),
  clockSkewInSec: 300,
};
