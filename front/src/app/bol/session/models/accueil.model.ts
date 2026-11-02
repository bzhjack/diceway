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

/** Une saga résumée pour l'accueil : son avancement et le chapitre à jouer ensuite (null : saga achevée). `teinte` choisit sa couleur et
 * son image, de 1 à 4 dans l'ordre alphabétique des sagas ; 0 hors saga. `anneau` est le `stroke-dasharray` de son anneau d'avancement. */
export interface AccueilSagaResume {
  nom: string | null;
  joues: number;
  total: number;
  suite: AccueilChapitre | null;
  resume: string;
  teinte: number;
  anneau: string;
}

/** La table ouverte, pour le bandeau : la saga de son scénario (null hors saga, ou sans scénario) et son titre. */
export interface AccueilTableOuverte {
  id: string;
  saga: string | null;
  titre: string;
}
