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
