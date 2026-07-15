import {environment} from '../../environments/environment';

/** URL complète d'un endpoint API : apiUrl('bol/heros') → `${apiBase}/api/bol/heros`. */
export function apiUrl(path: string): string {
  return `${environment.apiBase}/api/${path}`;
}
