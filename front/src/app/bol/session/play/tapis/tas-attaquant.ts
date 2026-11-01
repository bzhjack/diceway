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
import {TurnAssistantStore} from './turn-assistant.store';

/** Qui joue : une ligne lue de gauche à droite, sans popover pour préparer le coup — sa vie et ses points, ses chiffres, ce que dit le MJ, sa posture, ses armes, puis ce qu'il peut faire au lieu d'attaquer et la fin de son tour. */
@Component({
  selector: 'bol-tas-attaquant',
  imports: [A11yModule, CdkConnectedOverlay, CdkOverlayOrigin, MatButtonModule, MatIconModule, MatTooltipModule, DwArmeIconComponent, DwValueStepperComponent, DwPopoverDirective, CombattantCarteComponent, EffectsListComponent, PointsStepperComponent],
  templateUrl: './tas-attaquant.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasAttaquantComponent {
  protected readonly store = inject(TurnAssistantStore);
}
