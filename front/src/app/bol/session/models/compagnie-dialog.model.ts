import {BolCompagnieModel} from '../../models/bol-compagnie.model';

/** Ce que le dialogue de la compagnie reçoit : la compagnie à modifier ; null pour en créer une. */
export interface CompagnieDialogData {
  readonly compagnie: BolCompagnieModel | null;
  /** Au retour de « Créer un héros » : les héros choisis avant d'y aller sont repris ; sinon, une nouvelle compagnie part de zéro. */
  readonly reprendreLaSelection?: boolean;
}
