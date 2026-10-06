import {Observable} from 'rxjs';

export interface HasPendingChanges {
  canLeave(): boolean | Observable<boolean>;
}
