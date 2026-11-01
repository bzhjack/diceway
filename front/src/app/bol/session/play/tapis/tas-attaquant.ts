import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {A11yModule} from '@angular/cdk/a11y';
import {CdkConnectedOverlay, CdkOverlayOrigin} from '@angular/cdk/overlay';
import {CombattantCarteComponent} from './combattant-carte';
import {DwArmeIconComponent} from '../../../shared/arme/arme-icon';
import {DwPopoverDirective} from '../../../../shared/popover/popover.directive';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {EffectsListComponent} from './effects-list';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {PointsStepperComponent} from './points-stepper';
import {TurnContextStore} from './turn-context.store';
import {TurnLoadoutStore} from './turn-loadout.store';
import {TurnAttackStore} from './turn-attack.store';
import {TurnCibleStore} from './turn-cible.store';
import {TurnFlowStore} from './turn-flow.store';

/** Qui joue : une ligne lue de gauche à droite, sans popover pour préparer le coup — sa vie et ses points, ses chiffres, ce que dit le MJ, sa posture, ses armes, puis ce qu'il peut faire au lieu d'attaquer et la fin de son tour. */
@Component({
  selector: 'bol-tas-attaquant',
  imports: [A11yModule, CdkConnectedOverlay, CdkOverlayOrigin, MatButtonModule, MatIconModule, MatTooltipModule, DwArmeIconComponent, DwValueStepperComponent, DwPopoverDirective, CombattantCarteComponent, EffectsListComponent, PointsStepperComponent],
  templateUrl: './tas-attaquant.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasAttaquantComponent {
  protected readonly turn = inject(TurnContextStore);
  protected readonly loadout = inject(TurnLoadoutStore);
  protected readonly attack = inject(TurnAttackStore);
  protected readonly cible = inject(TurnCibleStore);
  protected readonly flow = inject(TurnFlowStore);
}
