/** Le rang d'une fiche (créature, démon, PNJ) : rival, coriace ou piétaille. */
export type LibraryRang = 'R' | 'C' | 'P';

/** D'où vient une fiche : le catalogue commun (partagé, en lecture seule) ou les fiches du compte. */
export type LibrarySource = 'tout' | 'catalogue' | 'miennes';

/** Une option de la liste « Trier par » d'une bibliothèque : sa clé de tri, son libellé. */
export interface LibraryTriOption<TTri extends string> {
  readonly cle: TTri;
  readonly label: string;
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
