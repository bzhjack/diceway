import {ChangeDetectionStrategy, Component, effect, ElementRef, inject, viewChild} from '@angular/core';
import {AvatarFallbackDirective} from '../../../../shared/avatar-fallback/avatar-fallback.directive';
import {DwDiceRowComponent} from '../../../../shared/dice-row/dice-row';
import {DwRollSumComponent, DwRollSumEditableDirective} from '../../../../shared/roll-sum/roll-sum';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {NgTemplateOutlet} from '@angular/common';
import {TurnAssistantStore} from './turn-assistant.store';

/** Les dégâts : la fourchette, la case et le dé, la formule, ce que le coup fera à la cible et ce qu'elle peut y opposer, puis « Appliquer » ou la fin du tour. */
@Component({
  selector: 'li[bol-tas-degats]',
  imports: [NgTemplateOutlet, MatButtonModule, MatIconModule, MatTooltipModule, DwDiceRowComponent, AvatarFallbackDirective, DwRollSumComponent, DwRollSumEditableDirective],
  templateUrl: './tas-degats.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasDegatsComponent {
  protected readonly store = inject(TurnAssistantStore);
  private readonly damageInputRef = viewChild<ElementRef<HTMLInputElement>>('damageInput');
  private readonly scratchInputRef = viewChild<ElementRef<HTMLInputElement>>('scratchInput');
  private readonly protectionInputRef = viewChild<ElementRef<HTMLInputElement>>('protectionInput');
  private readonly applyButtonRef = viewChild('applyButton', {read: ElementRef<HTMLButtonElement>});
  private readonly endButtonRef = viewChild('endButton', {read: ElementRef<HTMLButtonElement>});

  constructor() {
    effect(() => this.store.damageInput.set(this.damageInputRef()));
    effect(() => this.store.scratchInput.set(this.scratchInputRef()));
    effect(() => this.store.protectionInput.set(this.protectionInputRef()));
    effect(() => this.store.applyButton.set(this.applyButtonRef()));
    effect(() => this.store.endButton.set(this.endButtonRef()));
  }
}
