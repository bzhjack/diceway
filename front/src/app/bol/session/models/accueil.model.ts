/** Où en est un chapitre pour ce compte : joué, en cours sur la table ouverte, le prochain à jouer, ou pas encore joué. */
export type ChapitreEtat = 'joue' | 'en-cours' | 'prochain' | 'a-jouer';

/** Un chapitre d'une saga : `titre` est le titre complet du scénario, `libelle` la partie après « — » (le titre entier hors saga). */
export interface AccueilChapitre {
  id: string;
  titre: string;
  libelle: string;
  etat: ChapitreEtat;
}

/** Une saga et ses chapitres dans l'ordre de lecture ; `nom` est null pour « Hors saga ». */
export interface AccueilSaga {
  nom: string | null;
  chapitres: AccueilChapitre[];
}
