/** Réponse `{message: ...}` renvoyée par les endpoints de suppression d'entités. */
export interface BolApiMessage {
  message: string;
}

/** Réponse `{success: ...}` renvoyée par les endpoints de sous-ressources (armes, langues, carrières…). */
export interface BolApiSuccess<T = boolean> {
  success: T;
}
