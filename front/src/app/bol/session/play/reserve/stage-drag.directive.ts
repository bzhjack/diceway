import {CdkDrag} from '@angular/cdk/drag-drop';
import {Directive, inject, input, output} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {CombatCamp} from '../../../models/bol-fight-session.model';
import {CombatantKind} from '../../../models/combat-selection.model';
import {ReservePlacementService} from '../../reserve-placement.service';

/** Ce qui se glisse vers la scène : sa sorte, et le camp d'où il vient (`null` depuis la réserve). */
interface StageDragSource {
  readonly kind: CombatantKind;
  readonly camp: CombatCamp | null;
}

/** Un `cdkDrag` qui se dépose sur la scène : il allume la zone visée pendant le glisser et, au dépôt, annonce le camp sous le pointeur (`null` : à côté). */
@Directive({selector: '[bolStageDrag]'})
export class StageDragDirective {
  private readonly drag = inject(CdkDrag);
  private readonly placement = inject(ReservePlacementService);

  readonly bolStageDrag = input.required<StageDragSource>();
  readonly stageDropped = output<CombatCamp | null>();

  constructor() {
    this.drag.started.pipe(takeUntilDestroyed()).subscribe(() => {
      const source = this.bolStageDrag();
      this.placement.startDrag([source.kind], source.camp);
    });
    this.drag.moved.pipe(takeUntilDestroyed()).subscribe(({pointerPosition}) => {
      this.placement.hoverCamp.set(this.placement.campAt(pointerPosition.x, pointerPosition.y));
    });
    this.drag.ended.pipe(takeUntilDestroyed()).subscribe(({dropPoint, source}) => {
      const camp = this.placement.campAt(dropPoint.x, dropPoint.y);
      this.placement.endDrag();
      source.reset();
      this.stageDropped.emit(camp);
    });
  }
}
