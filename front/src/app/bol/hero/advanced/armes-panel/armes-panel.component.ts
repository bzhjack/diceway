import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {AddMenuOption} from '../../../shared/models/add-menu.model';
import {ArmeListComponent} from '../../../shared/arme/list/arme-list.component';
import {EtoileArme} from '../../../shared/models/arme-favorite.model';
import {ArmeEntry} from '../../../shared/models/arme-list.model';
import {ListPanelComponent} from '../../../shared/list-panel/list-panel.component';

/** Panneau Armes de la création avancée : sélection + avertissement arme lourde (E13). */
@Component({
  selector: 'bol-hero-advanced-armes-panel',
  imports: [ListPanelComponent, ArmeListComponent],
  templateUrl: './armes-panel.component.html',
  styleUrl: './armes-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroAdvancedArmesPanelComponent {
  readonly armes = input.required<readonly ArmeEntry[]>();
  readonly armeOptions = input.required<readonly AddMenuOption[]>();
  readonly warnHeavy = input(false);
  /** Les étoiles « arme favorite » (`null` sans l'avantage). */
  readonly etoiles = input<readonly EtoileArme[] | null>(null);

  readonly armeAdded = output<number>();
  readonly armeRemoved = output<number>();
  /** Un clic sur la case « équipée » d'une arme : son index dans la liste. */
  readonly armeEquippedToggled = output<number>();
  /** Un clic sur l'étoile « arme favorite » d'une arme : son index dans la liste. */
  readonly favoriteToggled = output<number>();
}
