import {ChangeDetectionStrategy, Component, effect, ElementRef, inject, viewChild} from '@angular/core';
import {DwDiceRowComponent} from '../../../../shared/dice-row/dice-row';
import {DwRollSumComponent} from '../../../../shared/roll-sum/roll-sum';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TurnContextStore} from './turn-context.store';
import {TurnLoadoutStore} from './turn-loadout.store';
import {TurnAttackStore} from './turn-attack.store';
import {TurnFlowStore} from './turn-flow.store';

/** L'attaque : ce qu'il faut et les chances, la case du total et les dés, la formule, le verdict, et ce que l'attaquant peut payer de ses points. */
@Component({
  selector: 'li[bol-tas-attaque]',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, DwDiceRowComponent, DwRollSumComponent, DwValueStepperComponent],
  templateUrl: './tas-attaque.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasAttaqueComponent {
  protected readonly turn = inject(TurnContextStore);
  protected readonly loadout = inject(TurnLoadoutStore);
  protected readonly attack = inject(TurnAttackStore);
  protected readonly flow = inject(TurnFlowStore);
  private readonly attackInputRef = viewChild<ElementRef<HTMLInputElement>>('attackInput');

  constructor() {
    effect(() => this.turn.attackInput.set(this.attackInputRef()));
  }
}
