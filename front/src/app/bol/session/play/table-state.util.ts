/** Où se retient l'issue déjà annoncée pour une table : la page se recrée à chaque arrivée, et « Continuer » doit tenir au retour. */
export const ISSUE_ANNONCEE = 'dw-issue-annoncee:';

/** `localStorage`, ou `null` s'il est inaccessible (navigation privée, stockage bloqué). */
export function browserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
