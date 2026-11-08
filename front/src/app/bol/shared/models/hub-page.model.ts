/** Une bibliothèque sur une page d'accueil de bibliothèques (l'Intendance, le Bestiaire) : son nom, son surtitre, ce qu'elle contient, où
 * elle mène, son icône (`sword` : l'épée maison, sinon une ligature Material), ses compteurs, et de quoi y créer une fiche. */
export interface HubEntry {
  readonly title: string;
  readonly kicker: string;
  readonly description: string;
  readonly route: string;
  readonly buttonLabel: string;
  readonly icon: string;
  readonly stats: readonly string[];
  readonly creer?: {readonly route: string; readonly label: string};
}
