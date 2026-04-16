import {HttpInterceptorFn} from '@angular/common/http';
import {environment} from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.headers.has('Authorization')) {
    return next(request);
  }

  const rawSession = sessionStorage.getItem('diceway-session');
  let token: string | null = null;

  if (rawSession) {
    try {
      const parsed = JSON.parse(rawSession) as Partial<{ token: string }>;
      token = parsed.token ?? null;
    } catch {
      token = null;
    }
  }

  if (!token) {
    return next(request);
  }

  const isRelativeApiCall = request.url.startsWith('/api/');
  const isAbsoluteApiCall =
    Boolean(environment.apiBase) && request.url.startsWith(`${environment.apiBase}/api/`);

  if (!isRelativeApiCall && !isAbsoluteApiCall) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
