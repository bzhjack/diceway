import {Signal} from '@angular/core';

/** Une liste de données chargée depuis l'API et qu'on peut recharger. */
export interface RefreshableResource<T> {
  readonly data: Signal<T[]>;
  refresh(): void;
}
