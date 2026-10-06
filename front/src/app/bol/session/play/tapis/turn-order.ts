import {CdkDragDrop, DragDropModule, moveItemInArray} from '@angular/cdk/drag-drop';
import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TurnStatus} from './combat-turn.util';
import {DwScrollerComponent} from '../../../../shared/dw-scroller/dw-scroller';
import {TurnOrderEntry} from '../../models/turn-order.model';

const STATUS_LABELS: Record<TurnStatus, string> = {
  active: 'à elle de jouer',
  played: 'a joué',
  skipped: 'ne joue pas ce round',
  upcoming: 'à venir',
};

/** Bande d'ordre du combat : le round, puis les cartes dans l'ordre de jeu de BoL. Réordonnable par
 * glisser-déposer (persisté par la page) ; une carte qui a joué peut reprendre la main. */
@Component({
  selector: 'bol-turn-order',
  imports: [DragDropModule, MatButtonModule, MatIconModule, MatTooltipModule, DwScrollerComponent],
  templateUrl: './turn-order.html',
  styleUrl: './turn-order.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnOrderComponent {
  readonly entries = input.required<readonly TurnOrderEntry[]>();
  readonly round = input.required<number>();
  /** Texte annoncé aux lecteurs d'écran à chaque changement de tour ou de round. */
  readonly announcement = input('');

  readonly reordered = output<readonly string[]>();
  readonly gaveBack = output<string>();
  readonly addRequested = output<void>();

  protected statusLabel(status: TurnStatus): string {
    return STATUS_LABELS[status];
  }

  protected onDrop(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    const keys = this.entries().map((entry) => entry.key);
    moveItemInArray(keys, event.previousIndex, event.currentIndex);
    this.reordered.emit(keys);
  }
}
