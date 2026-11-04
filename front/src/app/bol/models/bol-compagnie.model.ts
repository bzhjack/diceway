/** Un héros d'une compagnie, de quoi le montrer. */
export interface BolCompagnieHeros {
  id: string;
  nom: string;
  avatar: string | null;
}

/** Une compagnie : un nom et des héros du compte. Une partie l'associe à un scénario ; `parties` compte les siennes. */
export interface BolCompagnieModel {
  id: string;
  nom: string;
  heros: BolCompagnieHeros[];
  parties: number;
}
