import {HttpInterceptorFn, HttpResponse} from '@angular/common/http';
import {map} from 'rxjs';
import {environment} from '../../environments/environment';

const PORTRAITS = '/api/bol/portraits/';

/** Donne le domaine de l'API aux adresses de portraits d'une réponse. */
export function prefixPortraitsInPlace(value: unknown, apiBase: string): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      prefixPortraitsInPlace(item, apiBase);
    }
    return;
  }

  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const item = record[key];
      if (key === 'avatar' && typeof item === 'string' && item.startsWith(PORTRAITS)) {
        record[key] = `${apiBase}${item}`;
      } else {
        prefixPortraitsInPlace(item, apiBase);
      }
    }
  }
}

/**
 * L'API donne l'adresse relative d'un portrait, que la page affiche telle quelle quand elle partage l'origine de l'API (en local, à travers
 * le proxy). En production, l'API a son propre domaine : on le lui ajoute ici, une fois pour toutes les fiches. L'API le retire à l'enregistrement.
 */
export const portraitUrlInterceptor: HttpInterceptorFn = (request, next) => {
  const apiBase = environment.apiBase;
  if (!apiBase) {
    return next(request);
  }

  return next(request).pipe(
    map((event) => {
      if (event instanceof HttpResponse && event.body && typeof event.body === 'object') {
        prefixPortraitsInPlace(event.body, apiBase);
      }

      return event;
    }),
  );
};
