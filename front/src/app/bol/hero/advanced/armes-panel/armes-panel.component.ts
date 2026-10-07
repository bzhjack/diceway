import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {AddMenuComponent} from '../../../shared/add-menu/add-menu.component';
import {AddMenuOption} from '../../../shared/models/add-menu.model';
import {ArmeListComponent} from '../../../shared/arme/list/arme-list.component';
import {ArmeEntry} from '../../../shared/models/arme-list.model';
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
  /** Un clic sur la case « équipée » d'une arme : son index dans la liste. */
  readonly armeEquippedToggled = output<number>();
}
