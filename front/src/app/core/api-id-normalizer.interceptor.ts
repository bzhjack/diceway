import {HttpInterceptorFn, HttpResponse} from '@angular/common/http';
import {map} from 'rxjs';

// Références vers des entités à id string (UUID) : ne jamais convertir.
const STRING_ID_KEYS = new Set(['user_id', 'heros_id', 'creature_id', 'demon_id']);

function isNumericIdKey(key: string): boolean {
  return (key.endsWith('_id') || key.startsWith('id_')) && !STRING_ID_KEYS.has(key);
}

function normalizeInPlace(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      normalizeInPlace(item);
    }
    return;
  }

  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const item = record[key];
      if (isNumericIdKey(key) && typeof item === 'string' && /^-?\d+$/.test(item)) {
        record[key] = Number(item);
      } else {
        normalizeInPlace(item);
      }
    }
  }
}

/**
 * Garantit l'invariant "les ids numériques (`*_id`, `id_*`) sont des number" quelle que soit
 * la config PDO côté backend (les prepares émulés renvoient les entiers en string).
 * Les modèles et composants peuvent ainsi comparer les ids sans coercition `Number()`.
 */
export const apiIdNormalizerInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    map((event) => {
      if (event instanceof HttpResponse && event.body && typeof event.body === 'object') {
        normalizeInPlace(event.body);
      }

      return event;
    }),
  );
