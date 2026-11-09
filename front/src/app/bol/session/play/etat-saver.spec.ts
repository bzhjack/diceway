import {of, Subject, throwError} from 'rxjs';
import {describe, expect, it} from 'vitest';
import {EtatCombat} from '../models/combat-turn.model';
import {EtatSaver} from './etat-saver';

const base: EtatCombat = {round: 1, joues: [], effets: [], exclus: [], depart: {}, fuis: [], melee: null};
const jouer = (key: string) => (etat: EtatCombat): EtatCombat => ({...etat, joues: [...etat.joues, key]});

function setup() {
  let courant = base;
  const saved: EtatCombat[] = [];
  const pending: Subject<void>[] = [];
  const errors: unknown[] = [];
  const saver = new EtatSaver(
    () => courant,
    (etat) => {
      saved.push(etat);
      const done = new Subject<void>();
      pending.push(done);
      return done;
    },
    (error) => errors.push(error),
  );
  // Fin d'un enregistrement : la session rechargée devient l'état courant.
  const finish = (index = pending.length - 1): void => {
    courant = saved[index];
    pending[index].next();
    pending[index].complete();
  };
  return {saver, saved, finish, errors, pending, set: (etat: EtatCombat) => (courant = etat)};
}

describe('EtatSaver', () => {
  it('saves the result of an update', () => {
    const {saver, saved} = setup();
    saver.apply(jouer('hero-1'));
    expect(saved).toEqual([{...base, joues: ['hero-1']}]);
  });

  it('says whether an update was taken into account', () => {
    const {saver} = setup();
    expect(saver.apply(jouer('hero-1'), {ignoreIfBusy: true})).toBe(true);
    expect(saver.apply(jouer('hero-1'), {ignoreIfBusy: true})).toBe(false);
  });

  it('does not save when the update changes nothing', () => {
    const {saver, saved} = setup();
    saver.apply((etat) => etat);
    expect(saved).toEqual([]);
  });

  it('applies queued updates in order, on top of the state that was just saved', () => {
    const {saver, saved, finish} = setup();
    saver.apply(jouer('hero-1'));
    saver.apply(jouer('pnj-7'));
    expect(saved).toHaveLength(1);
    finish();
    expect(saved).toHaveLength(2);
    expect(saved[1].joues).toEqual(['hero-1', 'pnj-7']);
  });

  it('drops an update flagged ignoreIfBusy while a save is running (double click on "Fin du tour")', () => {
    const {saver, saved, finish} = setup();
    saver.apply(jouer('hero-1'), {ignoreIfBusy: true});
    saver.apply(jouer('hero-1'), {ignoreIfBusy: true});
    finish();
    expect(saved).toHaveLength(1);
  });

  it('forgets the queue and reports the error when a save fails, then accepts new updates', () => {
    const {saver, saved, pending, errors} = setup();
    saver.apply(jouer('hero-1'));
    saver.apply(jouer('pnj-7'));
    pending[0].error(new Error('réseau'));
    expect(errors).toHaveLength(1);
    expect(saved).toHaveLength(1);
    saver.apply(jouer('hero-2'));
    expect(saved).toHaveLength(2);
  });
});

describe('EtatSaver : un enregistrement en erreur', () => {
  /** Chaque appel à `persist` rend la réponse suivante de `reponses` : `ok`, ou une erreur. `serveur` : l'état relu par `recover`. */
  function monter(reponses: ('ok' | 'erreur')[], passe: boolean[]) {
    let courant = base;
    const saved: EtatCombat[] = [];
    const errors: unknown[] = [];
    const relus: EtatCombat[] = [];
    const saver = new EtatSaver(
      () => courant,
      (etat) => {
        saved.push(etat);
        if (reponses.shift() === 'erreur') {
          return throwError(() => new Error('réseau'));
        }
        courant = etat;
        return of(undefined);
      },
      (error) => errors.push(error),
      (voulu) => {
        relus.push(voulu);
        const ok = passe.shift() ?? false;
        if (ok) {
          courant = voulu;
        }
        return of(ok);
      },
    );
    return {saver, saved, errors, relus, courant: () => courant};
  }

  it('la réponse s’est perdue mais le serveur l’a enregistré : rien n’est rejoué, aucune erreur', () => {
    const {saver, saved, errors, courant} = monter(['erreur'], [true]);

    saver.apply(jouer('hero-1'));

    expect(saved).toHaveLength(1);
    expect(errors).toEqual([]);
    expect(courant().joues).toEqual(['hero-1']);
  });

  it('pas passé : les mises à jour sont rejouées une fois, sur l’état relu', () => {
    const {saver, saved, errors, courant} = monter(['erreur', 'ok'], [false]);

    saver.apply(jouer('hero-1'));

    expect(saved).toHaveLength(2);
    expect(errors).toEqual([]);
    expect(courant().joues).toEqual(['hero-1']);
  });

  it('rejouées sans succès : l’erreur est dite, une seule fois', () => {
    const {saver, saved, errors} = monter(['erreur', 'erreur'], [false, false]);

    saver.apply(jouer('hero-1'));

    expect(saved).toHaveLength(2);
    expect(errors).toHaveLength(1);
  });
});
