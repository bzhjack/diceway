import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {BolCreatureCapaciteModel} from '../../../models/bol-creature.model';
import {DwTagComponent} from '../../../../shared/dw-tag/dw-tag';
import {AddMenuComponent, AddMenuEvent, addMenuOptions} from '../../../shared/add-menu/add-menu.component';
import {CapaciteEntry, CapaciteListComponent} from '../../../shared/capacite/list/capacite-list.component';

@Component({
  selector: 'bol-creature-capacites',
  imports: [DwTagComponent, AddMenuComponent, CapaciteListComponent],
  templateUrl: './creature-capacites.component.html',
  styleUrl: './creature-capacites.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatureCapacitesComponent {
  readonly capacites = input.required<readonly CapaciteEntry[]>();
  readonly capacitesDisponibles = input.required<readonly BolCreatureCapaciteModel[]>();

  protected readonly capaciteOptions = addMenuOptions(this.capacitesDisponibles, (capacite) => capacite.capacite);

  readonly added = output<AddMenuEvent>();
  readonly removed = output<number>();
}
