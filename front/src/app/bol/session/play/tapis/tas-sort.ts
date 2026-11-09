import {ChangeDetectionStrategy, Component, effect, ElementRef, inject, viewChild} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatTooltipModule} from '@angular/material/tooltip';
import {DwDiceRowComponent} from '../../../../shared/dice-row/dice-row';
import {DwRollSumComponent} from '../../../../shared/roll-sum/roll-sum';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {TurnContextStore} from './turn-context.store';
import {TurnLoadoutStore} from './turn-loadout.store';
import {TurnAttackStore} from './turn-attack.store';
import {TurnFlowStore} from './turn-flow.store';

/** Le sort, à la place de l'attaque (livre p. 148) : ce qu'il faut aux dés et les chances, la case du total et les dés, le dé du MJ, la
 * formule `2d6 + esprit + sorcier ± difficulté` (moins l'esprit de la cible pour un sort sur l'esprit), le verdict et son coût. Le premier
 * jet dépense les points de pouvoir ; un sort qui blesse passe ensuite à la ligne des dégâts. */
@Component({
  selector: 'li[bol-tas-sort]',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule, DwDiceRowComponent, DwRollSumComponent, DwValueStepperComponent],
  templateUrl: './tas-sort.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasSortComponent {
  protected readonly turn = inject(TurnContextStore);
  protected readonly loadout = inject(TurnLoadoutStore);
  protected readonly attack = inject(TurnAttackStore);
  protected readonly flow = inject(TurnFlowStore);
  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('attackInput');

  constructor() {
    effect(() => this.turn.attackInput.set(this.inputRef()));
  }
}
