import {computed, Injectable, signal} from '@angular/core';
import {CombatCamp} from '../../../models/bol-fight-session.model';
import {CombatantKind} from '../../../models/combat-selection.model';

/** L'état d'un glisser d'une tuile vers l'autre camp du théâtre, partagé entre la tuile glissée (`bolStageDrag`) et les deux camps,
 * qui dessinent leur zone de dépôt. */
@Injectable({providedIn: 'root'})
export class StageDragService {
  /** Un glisser est en cours : les camps dessinent leurs zones de dépôt. */
  readonly dragging = signal(false);
  /** Types de personnages emportés par le glisser en cours. */
  readonly draggedKinds = signal<ReadonlySet<CombatantKind>>(new Set());
  /** La zone des adversaires reçoit le glisser : pas quand il n'emporte que des héros, qui ne sont jamais adversaires. */
  readonly adversairesDroppable = computed(() => {
    const kinds = this.draggedKinds();
    return kinds.size === 0 || [...kinds].some((kind) => kind !== 'hero');
  });
  /** Camp d'où part la tuile glissée. */
  readonly originCamp = signal<CombatCamp | null>(null);
  /** Camp de la zone sous le pointeur pendant un glisser. */
  readonly hoverCamp = signal<CombatCamp | null>(null);

  /** Camp de la zone de dépôt sous un point de l'écran, ou `null` hors des zones ou si la zone refuse ce glisser (les héros ne vont
   * pas chez les adversaires, et on ne dépose pas dans son propre camp). */
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
}
