import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {BolAvantageModel} from '../../../models/bol-avantage.model';
import {BolDesavantageModel} from '../../../models/bol-desavantage.model';
import {BolLangueModel} from '../../../models/bol-langue.model';
import {AddMenuComponent, addMenuOptions} from '../../../shared/add-menu/add-menu.component';
import {LangueEntry, LangueListComponent} from '../../../shared/langue/list/langue-list.component';
import {TraitAddEvent, TraitAddMenuComponent} from '../../../shared/trait/add-menu/trait-add-menu.component';
import {TraitEntry, TraitListComponent} from '../../../shared/trait/list/trait-list.component';

@Component({
  selector: 'bol-pnj-summary-rail',
  imports: [
    MatIconModule,
    AddMenuComponent,
    LangueListComponent,
    TraitAddMenuComponent,
    TraitListComponent,
  ],
  templateUrl: './pnj-summary-rail.component.html',
  styleUrl: './pnj-summary-rail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PnjSummaryRailComponent {
  readonly avatarPreview = input<string | null>(null);
  readonly pnjName = input<string | null>(null);
  readonly typeLabel = input<string | null>(null);
  readonly vitalite = input<number | null>(null);
  readonly traits = input.required<readonly TraitEntry[]>();
  readonly avantagesDisponibles = input.required<readonly BolAvantageModel[]>();
  readonly desavantagesDisponibles = input.required<readonly BolDesavantageModel[]>();
  readonly langues = input.required<readonly LangueEntry[]>();
  readonly languesDisponibles = input.required<readonly BolLangueModel[]>();

  protected readonly langueOptions = addMenuOptions(this.languesDisponibles, (langue) => langue.langue);

  readonly avatarClick = output<void>();
  readonly traitAdded = output<TraitAddEvent>();
  readonly traitRemoved = output<number>();
  readonly langueAdded = output<number>();
  readonly langueRemoved = output<number>();
}
