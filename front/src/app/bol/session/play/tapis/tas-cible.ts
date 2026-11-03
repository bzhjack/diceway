import {ChangeDetectionStrategy, Component, effect, ElementRef, inject, viewChild} from '@angular/core';
import {ActeurComponent} from '../theatre/acteur';
import {CombattantCarteComponent} from './combattant-carte';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {PointsStepperComponent} from './points-stepper';
import {TurnContextStore} from './turn-context.store';
import {TurnLoadoutStore} from './turn-loadout.store';
import {TurnDamageStore} from './turn-damage.store';
import {TurnCibleStore} from './turn-cible.store';
import {TurnFlowStore} from './turn-flow.store';
import {DeFoiComponent} from './de-foi';

/** La cible : avant de viser, une carte par cible sur une ligne ; choisie, il ne reste que sa carte, avec ses chiffres, sa vie réglable et ses effets. */
@Component({
  selector: 'section[bol-tas-cible]',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, DwValueStepperComponent, ActeurComponent, CombattantCarteComponent, PointsStepperComponent, DeFoiComponent],
  templateUrl: './tas-cible.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasCibleComponent {
  protected readonly turn = inject(TurnContextStore);
  protected readonly loadout = inject(TurnLoadoutStore);
  protected readonly damage = inject(TurnDamageStore);
  protected readonly cible = inject(TurnCibleStore);
  protected readonly flow = inject(TurnFlowStore);
  private readonly picksRef = viewChild<ElementRef<HTMLElement>>('picks');

  constructor() {
    effect(() => this.turn.picksList.set(this.picksRef()));
  }
}
