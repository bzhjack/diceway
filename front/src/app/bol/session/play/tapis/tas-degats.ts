import {ChangeDetectionStrategy, Component, effect, ElementRef, inject, viewChild} from '@angular/core';
import {AvatarFallbackDirective} from '../../../../shared/avatar-fallback/avatar-fallback.directive';
import {DwDiceRowComponent} from '../../../../shared/dice-row/dice-row';
import {DwRollSumComponent, DwRollSumEditableDirective} from '../../../../shared/roll-sum/roll-sum';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {NgTemplateOutlet} from '@angular/common';
import {TurnContextStore} from './turn-context.store';
import {TurnLoadoutStore} from './turn-loadout.store';
import {TurnAttackStore} from './turn-attack.store';
import {TurnDamageStore} from './turn-damage.store';
import {TurnCibleStore} from './turn-cible.store';
import {TurnFlowStore} from './turn-flow.store';

/** Les dégâts, une fois le jet d'attaque fait : la case et le dé, la formule, ce que le coup fera à la cible et ce qu'elle peut y opposer, puis « Appliquer » ou la fin du tour. */
@Component({
  selector: 'li[bol-tas-degats]',
  imports: [NgTemplateOutlet, MatButtonModule, MatIconModule, MatTooltipModule, DwDiceRowComponent, AvatarFallbackDirective, DwRollSumComponent, DwRollSumEditableDirective],
  templateUrl: './tas-degats.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasDegatsComponent {
  protected readonly turn = inject(TurnContextStore);
  protected readonly loadout = inject(TurnLoadoutStore);
  protected readonly attack = inject(TurnAttackStore);
  protected readonly damage = inject(TurnDamageStore);
  protected readonly cible = inject(TurnCibleStore);
  protected readonly flow = inject(TurnFlowStore);
  private readonly damageInputRef = viewChild<ElementRef<HTMLInputElement>>('damageInput');
  private readonly scratchInputRef = viewChild<ElementRef<HTMLInputElement>>('scratchInput');
  private readonly protectionInputRef = viewChild<ElementRef<HTMLInputElement>>('protectionInput');
  private readonly applyButtonRef = viewChild('applyButton', {read: ElementRef<HTMLButtonElement>});
  private readonly endButtonRef = viewChild('endButton', {read: ElementRef<HTMLButtonElement>});

  constructor() {
    effect(() => this.turn.damageInput.set(this.damageInputRef()));
    effect(() => this.turn.scratchInput.set(this.scratchInputRef()));
    effect(() => this.turn.protectionInput.set(this.protectionInputRef()));
    effect(() => this.turn.applyButton.set(this.applyButtonRef()));
    effect(() => this.turn.endButton.set(this.endButtonRef()));
  }
}
