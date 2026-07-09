import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {BolLangueModel} from '../../../models/bol-langue.model';
import {BolRegionModel} from '../../../models/bol-region.model';
import {LangueAddMenuComponent} from '../langue/add-menu/langue-add-menu.component';
import {LangueEntry, LangueListComponent} from '../langue/list/langue-list.component';

interface VitalRow {
  readonly control: string;
  readonly label: string;
}

const VITALS: readonly VitalRow[] = [
  {control: 'vitalite', label: 'Vitalité'},
  {control: 'heroisme', label: 'Héroïsme'},
  {control: 'pouvoir', label: 'Pouvoir'},
];

@Component({
  selector: 'bol-hero-summary-rail',
  imports: [
    ReactiveFormsModule,
    MatIconModule,
    DwValueStepperComponent,
    LangueAddMenuComponent,
    LangueListComponent,
  ],
  templateUrl: './summary-rail.component.html',
  styleUrl: './summary-rail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSummaryRailComponent {
  readonly form = input.required<FormGroup>();
  readonly avatarPreview = input<string | null>(null);
  readonly heroName = input<string | null>(null);
  readonly playerName = input<string | null>(null);
  readonly region = input<BolRegionModel | null>(null);
  readonly langues = input.required<readonly LangueEntry[]>();
  readonly languesDisponibles = input.required<readonly BolLangueModel[]>();

  readonly avatarClick = output<void>();
  readonly langueAdded = output<number>();
  readonly langueRemoved = output<number>();

  protected readonly vitals = VITALS;
}
