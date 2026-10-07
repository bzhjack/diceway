import {computed, inject, Injectable, signal} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {catchError, concatMap, EMPTY, from, last, map, Observable, of, tap} from 'rxjs';
import {extractApiErrorMessage} from '../../core/api-error.utils';
import {BolFightSessionModel, CombatCamp} from '../models/bol-fight-session.model';
import {CombatCatalogEntry, CombatantKind} from '../models/combat-selection.model';
import {BolFightSessionService} from '../services/bol-fight-session.service';
import {resolveAddCombatantCamp} from './play/add-combatant-dialog/add-combatant-dialog';
import {ReservePlacedRow} from './models/reserve.model';

const CAMP_LABEL: Record<CombatCamp, string> = {
  adversaires: 'dans la scène',
  heros: 'chez les héros et alliés',
};

/** Camp d'un personnage posé sans viser de zone (double-clic, Entrée, bouton) : les héros chez les héros,
 * tous les autres comme présents dans la scène. */
export function defaultCamp(kind: CombatantKind): CombatCamp {
  return resolveAddCombatantCamp(kind, 'adversaires');
}

/** Le plus grand id de liaison d'un type dans la session renvoyée : la ligne qu'on vient de créer. */
function newestPivotId(session: BolFightSessionModel, kind: CombatantKind): number | null {
  const rows =
    kind === 'hero'
      ? session.heros
      : kind === 'pnj'
        ? session.pnjs
        : kind === 'creature'
          ? session.creatures
          : session.demons;
  const ids = (rows ?? []).map((row) => row.id);
  return ids.length ? Math.max(...ids) : null;
}

/** La pose d'un personnage de la réserve sur la table, et l'état du glisser partagé entre la réserve et le
 * tapis (zones de dépôt). Chaque pose affiche un message
 * avec « Annuler », qui retire ce que la pose vient d'ajouter. */
@Injectable({providedIn: 'root'})
export class ReservePlacementService {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly snackBar = inject(MatSnackBar);

  /** Un glisser depuis la réserve est en cours : le tapis dessine ses zones de dépôt. */
  readonly dragging = signal(false);
  /** Types de personnages emportés par le glisser en cours. */
  readonly draggedKinds = signal<ReadonlySet<CombatantKind>>(new Set());
  /** La zone des adversaires reçoit le glisser : pas quand il n'emporte que des héros, qui ne sont jamais adversaires. */
  readonly adversairesDroppable = computed(() => {
    const kinds = this.draggedKinds();
    return kinds.size === 0 || [...kinds].some((kind) => kind !== 'hero');
  });
  /** Camp d'origine quand le glisser emporte une carte déjà sur le tapis (changement de camp) ; `null` depuis la réserve. */
  readonly originCamp = signal<CombatCamp | null>(null);
  /** Camp de la zone sous le pointeur pendant un glisser. */
  readonly hoverCamp = signal<CombatCamp | null>(null);
  /** Compteur incrémenté quand une pose vient d'être annulée : la page recharge alors la session. */
  readonly undone = signal(0);

  /** Camp de la zone de dépôt du tapis sous un point de l'écran, ou `null` hors des zones ou si la zone refuse
   * ce glisser (les héros ne vont pas chez les adversaires, et on ne dépose pas dans son propre camp). */
  campAt(x: number, y: number): CombatCamp | null {
    const zone = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop-camp]');
    const camp = (zone?.dataset['dropCamp'] as CombatCamp | undefined) ?? null;
    if (camp === null || camp === this.originCamp() || (camp === 'adversaires' && !this.adversairesDroppable())) {
      return null;
    }
    return camp;
  }

  /** Début d'un glisser : ce qu'il emporte, et d'où il part. */
  startDrag(kinds: Iterable<CombatantKind>, origin: CombatCamp | null): void {
    this.draggedKinds.set(new Set(kinds));
    this.originCamp.set(origin);
    this.dragging.set(true);
  }

  /** Fin d'un glisser, déposé ou non. */
  endDrag(): void {
    this.dragging.set(false);
    this.hoverCamp.set(null);
    this.draggedKinds.set(new Set());
    this.originCamp.set(null);
  }

  /** Pose les personnages l'un après l'autre. Émet une fois, à la fin, `true` si au moins un a été posé :
   * l'appelant recharge alors la session. */
  place(sessionId: string, entries: readonly CombatCatalogEntry[], camp: CombatCamp | 'auto'): Observable<boolean> {
    const placed: ReservePlacedRow[] = [];
    const names: string[] = [];
    const campsUsed = new Set<CombatCamp>();

    return from(entries).pipe(
      concatMap((entry) => {
        const target = camp === 'auto' ? defaultCamp(entry.kind) : resolveAddCombatantCamp(entry.kind, camp);
        return this.fightSessionService
          .addCombatant(sessionId, {
            kind: entry.kind,
            sourceId: entry.sourceId,
            camp: target,
          })
          .pipe(
            tap((session) => {
              const pivotId = newestPivotId(session, entry.kind);
              if (pivotId !== null) {
                placed.push({kind: entry.kind, pivotId});
              }
              names.push(entry.nom);
              campsUsed.add(target);
            }),
            catchError((error: unknown) => {
              this.snackBar.open(extractApiErrorMessage(error, `Impossible de poser ${entry.nom}.`), 'Fermer', {
                duration: 5000,
              });
              return EMPTY;
            }),
          );
      }),
      last(undefined, null),
      map(() => {
        if (!names.length) {
          return false;
        }
        this.announce(sessionId, names, campsUsed, placed);
        return true;
      }),
    );
  }

  private announce(sessionId: string, names: string[], camps: ReadonlySet<CombatCamp>, placed: ReservePlacedRow[]): void {
    const what = names.length === 1 ? names[0] : `${names.length} personnages`;
    const where = camps.size === 1 ? ` ${CAMP_LABEL[[...camps][0]]}` : '';
    const ref = this.snackBar.open(`${what} posé${names.length > 1 ? 's' : ''}${where}.`, placed.length ? 'Annuler' : undefined, {
      duration: 6000,
    });
    ref.onAction().subscribe(() => this.undo(sessionId, placed));
  }

  /** Retire les lignes créées par la dernière pose. */
  private undo(sessionId: string, placed: readonly ReservePlacedRow[]): void {
    from(placed)
      .pipe(
        concatMap((row) => this.fightSessionService.removeCombatant(sessionId, row.kind, row.pivotId).pipe(catchError(() => of(null)))),
        last(undefined, null),
      )
      .subscribe(() => this.undone.update((n) => n + 1));
  }
}
