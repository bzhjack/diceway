/** Le rang d'une fiche (créature, démon, PNJ) : rival, coriace ou piétaille. */
export type LibraryRang = 'R' | 'C' | 'P';

/** D'où vient une fiche : le catalogue commun (partagé, en lecture seule) ou les fiches du compte. */
export type LibrarySource = 'tout' | 'catalogue' | 'miennes';

/** Une colonne d'une bibliothèque en lignes : sa clé de tri (null : elle ne trie pas), son en-tête, le mot entier d'un en-tête abrégé
 * (`titre`, en bulle), centrée si elle porte un nombre. */
export interface LibraryColonne<TTri extends string> {
  readonly cle: TTri | null;
  readonly label: string;
  readonly titre?: string;
  readonly num?: boolean;
}

/** Une colonne prête à afficher : ce que dit son `aria-sort`, la flèche de la colonne triée. */
export interface LibraryColonneVue<TTri extends string> extends LibraryColonne<TTri> {
  readonly ariaSort: 'ascending' | 'descending' | 'none' | null;
  readonly icone: string | null;
}

export interface LibraryTri<TTri extends string> {
  readonly cle: TTri;
  readonly croissant: boolean;
}

/** Une option d'un filtre : sa valeur, son libellé, le nombre de fiches qu'elle garde. */
export interface LibraryOption<T> {
  readonly cle: T;
  readonly label: string;
  readonly compte: number;
}

/** Un scénario dans le filtre « Scénario » : la teinte de sa saga (`dw-saga--N`, comme sur l'accueil), le nombre de fiches qu'il cite. */
export interface LibraryScenarioOption {
  readonly id: string;
  readonly titre: string;
  readonly teinte: number;
  readonly compte: number;
}

/** Un scénario sur la ligne d'une fiche : son titre et sa teinte. */
export interface LibraryScenarioTag {
  readonly id: string;
  readonly titre: string;
  readonly teinte: number;
}
