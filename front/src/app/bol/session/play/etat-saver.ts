import {Observable} from 'rxjs';
import {EtatCombat} from '../models/combat-turn.model';

type EtatUpdate = (etat: EtatCombat) => EtatCombat;

/** Enregistre l'état du combat en série. Les actions de l'utilisateur (`ignoreIfBusy`) sont ignorées pendant un enregistrement : un double clic
 * ne termine pas deux tours. Les mises à jour automatiques (jet fait…) sont mises en file et appliquées dans l'ordre, chacune sur l'état
 * à jour, pour qu'aucune ne parte d'un état périmé ni ne se perde.
 *
 * Un enregistrement en erreur n'est pas forcément perdu : `recover` relit l'état du serveur (et met la session à jour) et dit s'il y est
 * passé, la réponse seule s'étant perdue — alors tout continue comme s'il avait réussi. Sinon ses mises à jour sont rejouées une fois, sur
 * l'état relu ; l'erreur n'est dite qu'ensuite. */
export class EtatSaver {
  private readonly queue: EtatUpdate[] = [];
  private busy = false;

  constructor(
    private readonly read: () => EtatCombat,
    /** Enregistre et met la session à jour ; complète quand l'état lu par `read` est à jour. */
    private readonly persist: (etat: EtatCombat) => Observable<unknown>,
    private readonly onError: (error: unknown) => void,
    /** Relit l'état du serveur et dit si `voulu`, enregistré depuis `avant`, y est passé. */
    private readonly recover?: (voulu: EtatCombat, avant: EtatCombat) => Observable<boolean>,
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

  private flush(rejoue = false): void {
    if (this.busy || this.queue.length === 0) {
      return;
    }
    const current = this.read();
    const updates = this.queue.splice(0);
    const next = updates.reduce((etat, update) => update(etat), current);
    if (next === current) {
      return;
    }

    this.busy = true;
    this.persist(next).subscribe({
      error: (error: unknown) => this.recuperer(error, next, current, updates, rejoue),
      complete: () => {
        this.busy = false;
        this.flush();
      },
    });
  }

  /** L'enregistrement de `voulu` a échoué : passé quand même (réponse perdue), on continue ; sinon ses mises à jour repartent une fois. */
  private recuperer(error: unknown, voulu: EtatCombat, avant: EtatCombat, updates: readonly EtatUpdate[], rejoue: boolean): void {
    const echec = () => {
      this.busy = false;
      this.queue.length = 0;
      this.onError(error);
    };
    if (!this.recover) {
      echec();
      return;
    }
    this.recover(voulu, avant).subscribe({
      next: (passe) => {
        if (passe) {
          this.busy = false;
          this.flush();
        } else if (!rejoue) {
          this.busy = false;
          this.queue.unshift(...updates);
          this.flush(true);
        } else {
          echec();
        }
      },
      error: echec,
    });
  }
}
