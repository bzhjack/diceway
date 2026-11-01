import {ChangeDetectionStrategy, Component, effect, ElementRef, inject, viewChild} from '@angular/core';
import {ActeurComponent} from '../theatre/acteur';
import {CombattantCarteComponent} from './combattant-carte';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {PointsStepperComponent} from './points-stepper';
import {TurnAssistantStore} from './turn-assistant.store';

/** La cible : avant de viser, une carte par cible sur une ligne ; choisie, il ne reste que sa carte, avec ses chiffres, sa vie réglable et ses effets. */
@Component({
  selector: 'section[bol-tas-cible]',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, DwValueStepperComponent, ActeurComponent, CombattantCarteComponent, PointsStepperComponent],
  templateUrl: './tas-cible.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasCibleComponent {
  protected readonly store = inject(TurnAssistantStore);
  private readonly picksRef = viewChild<ElementRef<HTMLElement>>('picks');

  constructor() {
    effect(() => this.store.picksList.set(this.picksRef()));
  }
}
