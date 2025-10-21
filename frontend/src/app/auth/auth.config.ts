import { AuthConfig } from 'angular-oauth2-oidc';

// Google OAuth2 + OIDC with PKCE
// Values are read from environment variables at build-time when possible.
// Replace placeholders with your actual values or wire to your environment.ts.

export const googleAuthConfig: AuthConfig = {
  // Issuer for Google OpenID Connect
  issuer: 'https://accounts.google.com',

  // Your Google OAuth2 Client ID (Web application)
  clientId: (window as any)["env"]?.NG_APP_GOOGLE_CLIENT_ID || '832825418607-n6jj3vcj2e2mr86c0pjdgqhlrq7gcuma.apps.googleusercontent.com',

  // The redirect URI after login. Must be whitelisted in Google Console
  redirectUri: window.location.origin + '/auth/callback',

  // Where to send the user after a successful logout
  postLogoutRedirectUri: window.location.origin,

  // We want an id_token for identity, and optionally access_token for Google APIs
  responseType: 'code', // Authorization Code + PKCE

  // Scopes: openid + profile + email are required for id_token profile claims
  scope: 'openid profile email',

  // Show debug logs in development
  showDebugInformation: false,

  // Strict discovery document validation
  strictDiscoveryDocumentValidation: false,

  // Google uses "accounts.google.com" and "https://accounts.google.com" as issuers interchangeably
  // This setting allows both

  // Require HTTPS for discovery and redirect URIs in production
  // disable at local dev only if using http://localhost
  requireHttps: false,
};
