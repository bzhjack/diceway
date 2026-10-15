import {ActionRollCarriere} from './action-roll.model';
import {InitiativeKind} from './initiative.model';

/** Un héros qui peut soigner : sa meilleure carrière de soins. */
export interface MedicalCareHealer {
  readonly nom: string;
  readonly carriere: ActionRollCarriere;
}

/** Un blessé du camp des héros, avec sa vitalité une fois la récupération d'après combat faite. */
interface MedicalCarePatient {
  readonly kind: InitiativeKind;
  readonly pivotId: number;
  readonly nom: string;
  readonly vitalite: number;
  readonly vitaliteMax: number;
}

/** Données du dialogue « Soins médicaux », proposé en fin de combat. */
export interface MedicalCareDialogData {
  readonly healers: readonly MedicalCareHealer[];
  readonly patients: readonly MedicalCarePatient[];
}

/** Ce que le soigneur rend à un blessé : le dialogue en renvoie un par blessé soigné. */
export interface MedicalCare {
  readonly kind: InitiativeKind;
  readonly pivotId: number;
  readonly nom: string;
  readonly amount: number;
}
