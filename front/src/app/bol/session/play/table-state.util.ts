import {PlayToken} from '../combat-play.util';

export const RESERVE_PANEL_KEY = 'diceway-table-reserve-open';

/** `localStorage`, ou `null` s'il est inaccessible (navigation privée, stockage bloqué). */
export function browserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** État ouvert/replié d'un panneau de la table, mémorisé entre deux visites. Toute valeur absente,
 * illisible ou inattendue retombe sur `fallback`. */
export function readPanelOpen(storage: Storage | null, key: string, fallback: boolean): boolean {
  try {
    const raw = storage?.getItem(key);
    if (raw === '1') {
      return true;
    }
    if (raw === '0') {
      return false;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function writePanelOpen(storage: Storage | null, key: string, open: boolean): void {
  try {
    storage?.setItem(key, open ? '1' : '0');
  } catch {
    // Préférence d'affichage : la perdre n'empêche pas de jouer.
  }
}

/** Jeton affiché dans la fiche : celui dont la clé est sélectionnée, en mode libre uniquement. `null`
 * dès qu'il n'est plus sur la table (retiré) ou que la session passe en combat. */
export function findSelectedToken(
  tokens: readonly PlayToken[],
  key: string | null,
  mode: 'libre' | 'combat',
): PlayToken | null {
  if (mode !== 'libre' || !key) {
    return null;
  }
  return tokens.find((token) => token.key === key) ?? null;
}
