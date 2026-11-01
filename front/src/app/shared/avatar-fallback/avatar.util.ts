/** Le portrait par défaut : une image claire, qu'on remplace souvent par l'initiale du personnage. */
export const EMPTY_AVATAR = '/assets/bol/empty-avatar.jpg';

/** Un vrai portrait à montrer, ou `null` si la fiche n'en a pas. */
export function usableAvatar(avatar: string | null | undefined): string | null {
  return avatar && avatar !== EMPTY_AVATAR ? avatar : null;
}
