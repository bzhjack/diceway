import {CanDeactivateFn} from '@angular/router';
import {HasPendingChanges} from './models/pending-changes-guard.model';

export const pendingChangesGuard: CanDeactivateFn<HasPendingChanges> = (component) => component.canLeave();
