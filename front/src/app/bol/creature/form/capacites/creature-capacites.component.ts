import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {BolCreatureCapaciteModel} from '../../../models/bol-creature.model';
import {DwTagComponent} from '../../../../shared/dw-tag/dw-tag';
import {CapaciteAddEvent, CapaciteAddMenuComponent} from '../../../shared/capacite/add-menu/capacite-add-menu.component';
import {CapaciteEntry, CapaciteListComponent} from '../../../shared/capacite/list/capacite-list.component';

@Component({
  selector: 'bol-creature-capacites',
  imports: [DwTagComponent, CapaciteAddMenuComponent, CapaciteListComponent],
  templateUrl: './creature-capacites.component.html',
  styleUrl: './creature-capacites.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatureCapacitesComponent {
  readonly capacites = input.required<readonly CapaciteEntry[]>();
  readonly capacitesDisponibles = input.required<readonly BolCreatureCapaciteModel[]>();

  readonly added = output<CapaciteAddEvent>();
  readonly removed = output<number>();
}
