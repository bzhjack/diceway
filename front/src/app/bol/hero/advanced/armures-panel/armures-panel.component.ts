import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {AddMenuComponent, AddMenuOption} from '../../../shared/add-menu/add-menu.component';
import {ArmureEntry, ArmureListComponent} from '../../../shared/armure/list/armure-list.component';
import {DwTagComponent} from '../../../../shared/dw-tag/dw-tag';

/** Panneau Armures de la création avancée. */
@Component({
  selector: 'bol-hero-advanced-armures-panel',
  imports: [DwTagComponent, AddMenuComponent, ArmureListComponent],
  templateUrl: './armures-panel.component.html',
  styleUrl: './armures-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroAdvancedArmuresPanelComponent {
  readonly armures = input.required<readonly ArmureEntry[]>();
  readonly armureOptions = input.required<readonly AddMenuOption[]>();

  readonly armureAdded = output<number>();
  readonly armureRemoved = output<number>();
}
