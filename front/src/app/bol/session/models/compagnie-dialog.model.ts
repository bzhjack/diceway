import {BolCompagnieModel} from '../../models/bol-compagnie.model';

/** Ce que le dialogue de la compagnie reçoit : la compagnie à modifier ; null pour en créer une. */
export interface CompagnieDialogData {
  readonly compagnie: BolCompagnieModel | null;
}
