import {Observable} from 'rxjs';

/** Une page qui peut refuser qu'on la quitte — par exemple avec des modifications non enregistrées. */
export interface HasPendingChanges {
  canLeave(): boolean | Observable<boolean>;
}
