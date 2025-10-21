import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

// Minimal interceptor to attach Laravel Sanctum API token from localStorage
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('local_token');
  if (!token) {
    return next(req);
  }

  // Determine if the request targets our API
  const apiBase = environment.apiBase || '';
  const isAbsolute = /^https?:\/\//i.test(req.url);
  let isApi = false;

  if (apiBase) {
    // If apiBase is defined, require URL to start with it
    isApi = isAbsolute ? req.url.startsWith(apiBase) : true; // relative URLs go to same origin (frontend may proxy)
  } else {
    // Dev: attach for localhost:8000 backend calls and for relative URLs
    if (!isAbsolute) {
      isApi = true; // relative request to same origin or proxy
    } else {
      try {
        const u = new URL(req.url);
        isApi = (u.host === 'localhost:8000' || u.hostname.endsWith('diceway.com'));
      } catch {
        isApi = false;
      }
    }
  }

  if (!isApi) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
  return next(authReq);
};
