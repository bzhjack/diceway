import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {AddMenuComponent, AddMenuOption} from '../../../shared/add-menu/add-menu.component';
import {ArmeEntry, ArmeListComponent} from '../../../shared/arme/list/arme-list.component';
import {DwTagComponent} from '../../../../shared/dw-tag/dw-tag';

/** Panneau Armes de la création avancée : sélection + avertissement arme lourde (E13). */
@Component({
  selector: 'bol-hero-advanced-armes-panel',
  imports: [DwTagComponent, AddMenuComponent, ArmeListComponent],
  templateUrl: './armes-panel.component.html',
  styleUrl: './armes-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroAdvancedArmesPanelComponent {
  readonly armes = input.required<readonly ArmeEntry[]>();
  readonly armeOptions = input.required<readonly AddMenuOption[]>();
  readonly warnHeavy = input(false);

  readonly armeAdded = output<number>();
  readonly armeRemoved = output<number>();
}
