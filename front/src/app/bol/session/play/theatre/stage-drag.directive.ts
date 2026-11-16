import {CdkDrag} from '@angular/cdk/drag-drop';
import {Directive, inject, input, output} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {CombatCamp} from '../../../models/bol-fight-session.model';
import {CombatantKind} from '../../../models/combat-selection.model';
import {StageDragService} from './stage-drag.service';

/** Ce qui se glisse d'un camp à l'autre : sa sorte, et le camp d'où il vient. */
interface StageDragSource {
  readonly kind: CombatantKind;
  readonly camp: CombatCamp | null;
}

/** Un `cdkDrag` qui se dépose dans l'autre camp : il allume la zone visée pendant le glisser et, au dépôt, annonce le camp sous le pointeur (`null` : à côté). */
@Directive({selector: '[bolStageDrag]'})
export class StageDragDirective {
  private readonly drag = inject(CdkDrag);
  private readonly etat = inject(StageDragService);

  readonly bolStageDrag = input.required<StageDragSource>();
  readonly stageDropped = output<CombatCamp | null>();

  constructor() {
    this.drag.started.pipe(takeUntilDestroyed()).subscribe(() => {
      const source = this.bolStageDrag();
      this.etat.startDrag([source.kind], source.camp);
    });
    this.drag.moved.pipe(takeUntilDestroyed()).subscribe(({pointerPosition}) => {
      this.etat.hoverCamp.set(this.etat.campAt(pointerPosition.x, pointerPosition.y));
    });
    this.drag.ended.pipe(takeUntilDestroyed()).subscribe(({dropPoint, source}) => {
      const camp = this.etat.campAt(dropPoint.x, dropPoint.y);
      this.etat.endDrag();
      source.reset();
      this.stageDropped.emit(camp);
    });
  }
}
