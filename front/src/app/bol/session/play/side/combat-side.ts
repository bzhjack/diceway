import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {TapisCard} from '../../models/tapis.model';

/** Colonne de droite en combat : la vitalité des héros et le journal des coups portés. */
@Component({
  selector: 'bol-combat-side',
  templateUrl: './combat-side.html',
  styleUrl: './combat-side.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombatSideComponent {
  readonly heroes = input<readonly TapisCard[]>([]);
  readonly log = input<readonly string[]>([]);

  protected percent(card: TapisCard): number {
    return card.vitaliteMax ? Math.max(0, Math.min(100, (100 * (card.vitaliteCourante ?? 0)) / card.vitaliteMax)) : 100;
  }

  protected low(card: TapisCard): boolean {
    return (card.vitaliteCourante ?? 0) <= (card.vitaliteMax ?? 0) / 2;
  }
}
