import {Field} from '@angular/forms/signals';

/** Une carrière à afficher dans la liste, avec son rang modifiable (champ de formulaire). */
export interface CarriereEntry {
  readonly id: number;
  readonly label: string;
  readonly description: string | null;
  readonly rank: Field<number>;
}
