import {BolFightSessionModel} from '../../models/bol-fight-session.model';

/** Ce qu'un réglage de la table vient d'enregistrer : la session à jour que l'API a renvoyée, ou les points d'héroïsme d'un
 * héros (l'API ne renvoie alors que sa fiche). */
export type TableChange =
  | {readonly session: BolFightSessionModel}
  | {readonly herosId: string; readonly heroisme: number};
