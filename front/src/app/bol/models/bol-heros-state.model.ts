/** Avertissement affiché pendant la création d'un héros : l'étape concernée et le message. */
export interface HeroCreationWarning {
  step: string;
  warn: string;
}

/** Bonus ou malus appliqué à un attribut pendant la création : l'attribut et la valeur ajoutée. */
export interface AttributModifier {
  attr: string;
  value: number;
}
