import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {DiceRowDie} from '../models/dice-row.model';
import {DwDieFaceComponent} from '../die-face/die-face';

/** Une ligne de petits dés au-dessus d'une case de jet, de hauteur fixe pour que rien ne saute : les faces quand on les connaît (lancés à
 * l'écran), sinon le total tapé à table sur un seul dé, sinon des places vides, une par dé à lancer. Décorative : le total est dans la
 * case. La taille suit `--dw-die-size` ; `offset` (une longueur CSS) la décale vers la gauche pour la centrer sur une case suivie d'un
 * bouton : la largeur du bouton et de son écart. */
@Component({
  selector: 'dw-dice-row',
  imports: [DwDieFaceComponent],
  template: `
    @if (dice()?.length) {
      @for (die of dice(); track $index) {
        <dw-die-face [value]="die.value" [dropped]="!!die.dropped" />
      }
    } @else if (total() !== null) {
      <span class="dr-total">{{ total() }}</span>
    } @else {
      @for (slot of slotList(); track slot) {
        <span class="dr-slot"></span>
      }
    }
  `,
  styleUrl: './dice-row.scss',
  host: {'aria-hidden': 'true', '[style.padding-right]': 'offset()'},
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwDiceRowComponent {
  readonly dice = input<readonly DiceRowDie[] | null>(null);
  readonly total = input<number | null>(null);
  readonly slots = input(2);
  readonly offset = input('0');

  protected readonly slotList = computed(() => Array.from({length: this.slots()}, (_, index) => index));
}
