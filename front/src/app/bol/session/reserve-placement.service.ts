import {computed, inject, Injectable, signal} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {catchError, concatMap, EMPTY, from, last, map, Observable, of, tap} from 'rxjs';
import {extractApiErrorMessage} from '../../core/api-error.utils';
import {BolFightSessionModel, CombatCamp} from '../models/bol-fight-session.model';
import {CombatantKind} from '../models/combat-selection.model';
import {BolFightSessionService} from '../services/bol-fight-session.service';
import {resolveAddCombatantCamp} from './play/add-combatant-dialog/add-combatant-dialog';
import {ReserveItem, ReservePlacedRow} from './models/reserve.model';

/** Quantité maximale posée d'un coup pour une créature ou un démon. */
export const RESERVE_MAX_QTY = 9;

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

/** La pose d'un ou plusieurs personnages de la réserve sur la table, et l'état partagé entre la réserve
 * (sélection, quantités, glisser en cours) et le tapis (zones de dépôt). Chaque pose affiche un message
 * avec « Annuler », qui retire ce que la pose vient d'ajouter. */
@Injectable({providedIn: 'root'})
export class ReservePlacementService {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly snackBar = inject(MatSnackBar);

  /** Identifiants de catalogue cochés dans la réserve. */
  readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  /** Quantité choisie par entrée (1 par défaut). */
  readonly quantities = signal<ReadonlyMap<string, number>>(new Map());
  /** Un glisser depuis la réserve est en cours : le tapis dessine ses zones de dépôt. */
  readonly dragging = signal(false);
  /** Types de personnages emportés par le glisser en cours. */
  readonly draggedKinds = signal<ReadonlySet<CombatantKind>>(new Set());
  /** La zone des adversaires reçoit le glisser : pas quand il n'emporte que des héros, qui ne sont jamais adversaires. */
  readonly adversairesDroppable = computed(() => {
    const kinds = this.draggedKinds();
    return kinds.size === 0 || [...kinds].some((kind) => kind !== 'hero');
  });
  /** Camp de la zone sous le pointeur pendant un glisser. */
  readonly hoverCamp = signal<CombatCamp | null>(null);
  /** Compteur incrémenté quand une pose vient d'être annulée : la page recharge alors la session. */
  readonly undone = signal(0);

  /** Pose les personnages l'un après l'autre. Émet une fois, à la fin, `true` si au moins un a été posé :
   * l'appelant recharge alors la session. */
  place(sessionId: string, items: readonly ReserveItem[], camp: CombatCamp | 'auto'): Observable<boolean> {
    const placed: ReservePlacedRow[] = [];
    const names: string[] = [];
    const campsUsed = new Set<CombatCamp>();

    return from(items).pipe(
      concatMap((item) => {
        const target = camp === 'auto' ? defaultCamp(item.entry.kind) : resolveAddCombatantCamp(item.entry.kind, camp);
        return this.fightSessionService
          .addCombatant(sessionId, {
            kind: item.entry.kind,
            sourceId: item.entry.sourceId,
            camp: target,
            qty: item.entry.kind === 'creature' || item.entry.kind === 'demon' ? item.qty : undefined,
          })
          .pipe(
            tap((session) => {
              const pivotId = newestPivotId(session, item.entry.kind);
              if (pivotId !== null) {
                placed.push({kind: item.entry.kind, pivotId});
              }
              names.push(item.qty > 1 ? `${item.entry.nom} ×${item.qty}` : item.entry.nom);
              campsUsed.add(target);
              this.deselect(item.entry.catalogId);
            }),
            catchError((error: unknown) => {
              this.snackBar.open(extractApiErrorMessage(error, `Impossible de poser ${item.entry.nom}.`), 'Fermer', {
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

  select(catalogId: string, selected: boolean): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      if (selected) {
        next.add(catalogId);
      } else {
        next.delete(catalogId);
      }
      return next;
    });
  }

  deselect(catalogId: string): void {
    this.select(catalogId, false);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  quantityOf(catalogId: string): number {
    return this.quantities().get(catalogId) ?? 1;
  }

  setQuantity(catalogId: string, qty: number): void {
    const clamped = Math.max(1, Math.min(RESERVE_MAX_QTY, qty));
    this.quantities.update((map) => new Map(map).set(catalogId, clamped));
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
