import { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../../environments/environment';

// Google OAuth2 + OIDC with PKCE
// Values are read from environment variables at build-time when possible.
// Replace placeholders with your actual values or wire to your environment.ts.

export const googleAuthConfig: AuthConfig = {
  // Issuer for Google OpenID Connect
  issuer: 'https://accounts.google.com',

  // Your Google OAuth2 Client ID (Web application)
  clientId: environment.googleClientId,
  dummyClientSecret: environment.googleClientSecret,
  // The redirect URI after login. Must be whitelisted in Google Console
  redirectUri: window.location.origin + '/auth/callback',

  // Where to send the user after a successful logout
  postLogoutRedirectUri: window.location.origin,

  // We want an id_token for identity, and optionally access_token for Google APIs
  responseType: 'code', // Authorization Code + PKCE
  // Ensure we do OIDC and request access token
  oidc: true,
  requestAccessToken: true,

  // Explicitly use PKCE and do NOT send a client_secret from the browser
  disablePKCE: false,
  useHttpBasicAuth: false,
  // Do not set dummyClientSecret here; Google does not require client_secret for SPA PKCE

  // Scopes: openid + profile + email are required for id_token profile claims
  scope: 'openid profile email',

  // Show debug logs in development
  showDebugInformation: false,

  // Strict discovery document validation
  strictDiscoveryDocumentValidation: false,
  skipIssuerCheck: true,

  // Require HTTPS for discovery and redirect URIs in production
  // disable at local dev only if using http://localhost
  requireHttps: false,
};
