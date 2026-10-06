/** Dictionnaire des libellés de la création avancée (clé → texte). */
export type AdvancedTranslations = Record<string, string>;

/** Un paragraphe de description d'un trait : un titre et un texte. */
export interface TraitDescriptionLine {
  readonly title: string;
  readonly description: string | null;
}
