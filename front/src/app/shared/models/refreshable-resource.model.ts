import {Signal} from '@angular/core';

export interface RefreshableResource<T> {
  readonly data: Signal<T[]>;
  refresh(): void;
}
