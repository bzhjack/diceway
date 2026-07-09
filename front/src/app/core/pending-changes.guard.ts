import {CanDeactivateFn} from '@angular/router';
import {Observable} from 'rxjs';

export interface HasPendingChanges {
  canLeave(): boolean | Observable<boolean>;
}

export const pendingChangesGuard: CanDeactivateFn<HasPendingChanges> = (component) => component.canLeave();
