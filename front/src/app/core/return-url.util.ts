/** Lit le `returnUrl` transmis en navigation state (`router.navigate(url, {state: {returnUrl}})`) —
 * partagé par les pages de formulaire (`BolEntityFormPageBase`) et les pages bibliothèque, pour
 * revenir au point de départ (ex. une session de combat) plutôt qu'au dashboard par défaut. */
export function readReturnUrl(): string | null {
  if (typeof history === 'undefined') {
    return null;
  }

  const state = history.state as Record<string, unknown> | null;
  return typeof state?.['returnUrl'] === 'string' ? state['returnUrl'] : null;
}
