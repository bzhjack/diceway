import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {BolDemonPouvoirModel} from '../../../models/bol-demon.model';
import {DwTagComponent} from '../../../../shared/dw-tag/dw-tag';
import {PouvoirAddEvent, PouvoirAddMenuComponent} from '../../../shared/pouvoir/add-menu/pouvoir-add-menu.component';
import {PouvoirEntry, PouvoirListComponent} from '../../../shared/pouvoir/list/pouvoir-list.component';

@Component({
  selector: 'bol-demon-pouvoirs',
  imports: [DwTagComponent, PouvoirAddMenuComponent, PouvoirListComponent],
  templateUrl: './demon-pouvoirs.component.html',
  styleUrl: './demon-pouvoirs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemonPouvoirsComponent {
  readonly pouvoirs = input.required<readonly PouvoirEntry[]>();
  readonly pouvoirsDisponibles = input.required<readonly BolDemonPouvoirModel[]>();

  readonly added = output<PouvoirAddEvent>();
  readonly removed = output<number>();
}
