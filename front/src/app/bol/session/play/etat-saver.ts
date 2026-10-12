import {Observable} from 'rxjs';
import {EtatCombat} from '../models/combat-turn.model';

type EtatUpdate = (etat: EtatCombat) => EtatCombat;

/** Enregistre l'état du combat en série. Les actions de l'utilisateur (`ignoreIfBusy`) sont ignorées pendant un enregistrement : un double clic
 * ne termine pas deux tours. Les mises à jour automatiques (jet fait…) sont mises en file et appliquées dans l'ordre, chacune sur l'état
 * rechargé, pour qu'aucune ne parte d'un état périmé ni ne se perde. */
export class EtatSaver {
  private readonly queue: EtatUpdate[] = [];
  private busy = false;

  constructor(
    private readonly read: () => EtatCombat,
    /** Enregistre puis recharge la session ; complète quand l'état lu par `read` est à jour. */
    private readonly persist: (etat: EtatCombat) => Observable<unknown>,
    private readonly onError: (error: unknown) => void,
  ) {}

  /** Rend `false` si la mise à jour est ignorée (action de l'utilisateur pendant un enregistrement), `true` sinon. */
  apply(update: EtatUpdate, options: {readonly ignoreIfBusy?: boolean} = {}): boolean {
    if (this.busy && options.ignoreIfBusy) {
      return false;
    }
    this.queue.push(update);
    this.flush();
    return true;
  }

  private flush(): void {
    if (this.busy || this.queue.length === 0) {
      return;
    }
    const current = this.read();
    const next = this.queue.splice(0).reduce((etat, update) => update(etat), current);
    if (next === current) {
      return;
    }

    this.busy = true;
    this.persist(next).subscribe({
      error: (error: unknown) => {
        this.busy = false;
        this.queue.length = 0;
        this.onError(error);
      },
      complete: () => {
        this.busy = false;
        this.flush();
      },
    });
  }
}
