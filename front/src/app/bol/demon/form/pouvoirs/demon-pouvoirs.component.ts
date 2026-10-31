import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {BolDemonPouvoirModel} from '../../../models/bol-demon.model';
import {AddMenuEvent} from '../../../shared/models/add-menu.model';
import {PouvoirListComponent} from '../../../shared/pouvoir/list/pouvoir-list.component';
import {PouvoirEntry} from '../../../shared/models/pouvoir-list.model';
import {ListPanelComponent} from '../../../shared/list-panel/list-panel.component';
import {addMenuOptions} from '../../../shared/add-menu/add-menu.component';

@Component({
  selector: 'bol-demon-pouvoirs',
  imports: [ListPanelComponent, PouvoirListComponent],
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
