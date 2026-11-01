import {ChangeDetectionStrategy, Component, effect, ElementRef, inject, viewChild} from '@angular/core';
import {DwDiceRowComponent} from '../../../../shared/dice-row/dice-row';
import {DwRollSumComponent} from '../../../../shared/roll-sum/roll-sum';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TurnAssistantStore} from './turn-assistant.store';

/** L'attaque : ce qu'il faut et les chances, la case du total et les dés, la formule, le verdict, et ce que l'attaquant peut payer de ses points. */
@Component({
  selector: 'li[bol-tas-attaque]',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, DwDiceRowComponent, DwRollSumComponent],
  templateUrl: './tas-attaque.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasAttaqueComponent {
  protected readonly store = inject(TurnAssistantStore);
  private readonly attackInputRef = viewChild<ElementRef<HTMLInputElement>>('attackInput');

  constructor() {
    effect(() => this.store.attackInput.set(this.attackInputRef()));
  }
}
