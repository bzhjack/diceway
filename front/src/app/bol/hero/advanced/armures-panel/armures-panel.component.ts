import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {AddMenuOption} from '../../../shared/models/add-menu.model';
import {ArmureListComponent} from '../../../shared/armure/list/armure-list.component';
import {ArmureEntry} from '../../../shared/models/armure-list.model';
import {ListPanelComponent} from '../../../shared/list-panel/list-panel.component';

/** Panneau Armures de la création avancée : sélection + avertissement armure lourde avec une vigueur négative (livre p. 52). */
@Component({
  selector: 'bol-hero-advanced-armures-panel',
  imports: [ListPanelComponent, ArmureListComponent],
  templateUrl: './armures-panel.component.html',
  styleUrl: './armures-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroAdvancedArmuresPanelComponent {
  readonly armures = input.required<readonly ArmureEntry[]>();
  readonly armureOptions = input.required<readonly AddMenuOption[]>();
  readonly warnHeavy = input(false);

  readonly armureAdded = output<number>();
  readonly armureRemoved = output<number>();
  readonly armureEquippedToggled = output<number>();
}
