import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {BolDemonPouvoirModel} from '../../../models/bol-demon.model';
import {DwTagComponent} from '../../../../shared/dw-tag/dw-tag';
import {AddMenuComponent, addMenuOptions} from '../../../shared/add-menu/add-menu.component';
import {AddMenuEvent} from '../../../shared/models/add-menu.model';
import {PouvoirListComponent} from '../../../shared/pouvoir/list/pouvoir-list.component';
import {PouvoirEntry} from '../../../shared/models/pouvoir-list.model';

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
