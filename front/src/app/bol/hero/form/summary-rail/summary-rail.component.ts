import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {BolAvantageModel} from '../../../models/bol-avantage.model';
import {BolDesavantageModel} from '../../../models/bol-desavantage.model';
import {BolLangueModel} from '../../../models/bol-langue.model';
import {BolRegionModel} from '../../../models/bol-region.model';
import {LangueAddMenuComponent} from '../langue/add-menu/langue-add-menu.component';
import {LangueEntry, LangueListComponent} from '../langue/list/langue-list.component';
import {TraitAddEvent, TraitAddMenuComponent} from '../trait-add-menu/trait-add-menu.component';
import {TraitEntry, TraitListComponent} from '../trait-list/trait-list.component';

@Component({
  selector: 'bol-hero-summary-rail',
  imports: [
    MatIconModule,
    LangueAddMenuComponent,
    LangueListComponent,
    TraitAddMenuComponent,
    TraitListComponent,
  ],
  templateUrl: './summary-rail.component.html',
  styleUrl: './summary-rail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSummaryRailComponent {
  readonly avatarPreview = input<string | null>(null);
  readonly heroName = input<string | null>(null);
  readonly playerName = input<string | null>(null);
  readonly region = input<BolRegionModel | null>(null);
  readonly traits = input.required<readonly TraitEntry[]>();
  readonly avantagesDisponibles = input.required<readonly BolAvantageModel[]>();
  readonly desavantagesDisponibles = input.required<readonly BolDesavantageModel[]>();
  readonly langues = input.required<readonly LangueEntry[]>();
  readonly languesDisponibles = input.required<readonly BolLangueModel[]>();

  readonly avatarClick = output<void>();
  readonly traitAdded = output<TraitAddEvent>();
  readonly traitRemoved = output<number>();
  readonly langueAdded = output<number>();
  readonly langueRemoved = output<number>();
}
