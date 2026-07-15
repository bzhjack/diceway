import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {BolDemonPouvoirModel} from '../../../models/bol-demon.model';
import {DwTagComponent} from '../../../../shared/dw-tag/dw-tag';
import {AddMenuComponent, AddMenuEvent, addMenuOptions} from '../../../shared/add-menu/add-menu.component';
import {PouvoirEntry, PouvoirListComponent} from '../../../shared/pouvoir/list/pouvoir-list.component';

@Component({
  selector: 'bol-demon-pouvoirs',
  imports: [DwTagComponent, AddMenuComponent, PouvoirListComponent],
  templateUrl: './demon-pouvoirs.component.html',
  styleUrl: './demon-pouvoirs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemonPouvoirsComponent {
  readonly pouvoirs = input.required<readonly PouvoirEntry[]>();
  readonly pouvoirsDisponibles = input.required<readonly BolDemonPouvoirModel[]>();

  protected readonly pouvoirOptions = addMenuOptions(this.pouvoirsDisponibles, (pouvoir) => pouvoir.pouvoir);

  readonly added = output<AddMenuEvent>();
  readonly removed = output<number>();
}
