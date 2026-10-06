import {Field} from '@angular/forms/signals';

export interface CarriereEntry {
  readonly id: number;
  readonly label: string;
  readonly description: string | null;
  readonly rank: Field<number>;
}
