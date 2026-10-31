import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {DwAvatarPickerComponent} from '../../../shared/dw-avatar-picker/dw-avatar-picker';
import {BolAvantageModel} from '../../models/bol-avantage.model';
import {BolDesavantageModel} from '../../models/bol-desavantage.model';
import {BolLangueModel} from '../../models/bol-langue.model';
import {AddMenuComponent, addMenuOptions} from '../add-menu/add-menu.component';
import {LangueListComponent} from '../langue/list/langue-list.component';
import {LangueEntry} from '../models/langue-list.model';
import {TraitAddMenuComponent} from '../trait/add-menu/trait-add-menu.component';
import {TraitAddEvent} from '../models/trait-add-menu.model';
import {TraitListComponent} from '../trait/list/trait-list.component';
import {TraitEntry} from '../models/trait-list.model';

/** Le rail d'une fiche de héros ou de PNJ : portrait, nom, vitalité (et héroïsme d'un héros), traits et langues. */
@Component({
  selector: 'bol-summary-rail',
  imports: [
    MatIconModule,
    DwAvatarPickerComponent,
    AddMenuComponent,
    LangueListComponent,
    TraitAddMenuComponent,
    TraitListComponent,
  ],
  templateUrl: './summary-rail.component.html',
  styleUrl: './summary-rail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryRailComponent {
  readonly avatarPreview = input<string | null>(null);
  /** Le nom du bouton du portrait pour un lecteur d'écran. */
  readonly avatarLabel = input.required<string>();
  readonly name = input<string | null>(null);
  /** Ce qui s'affiche tant que la fiche n'a pas de nom. */
  readonly emptyName = input.required<string>();
  readonly playerName = input<string | null>(null);
  /** L'étiquette sous le nom : la région d'un héros, le rang d'un PNJ. */
  readonly tag = input<string | null>(null);
  readonly vitalite = input<number | null>(null);
  /** Un PNJ n'a pas d'héroïsme. */
  readonly withHeroisme = input(false);
  readonly heroisme = input<number | null>(null);
  readonly traits = input.required<readonly TraitEntry[]>();
  readonly avantagesDisponibles = input.required<readonly BolAvantageModel[]>();
  readonly desavantagesDisponibles = input.required<readonly BolDesavantageModel[]>();
  readonly langues = input.required<readonly LangueEntry[]>();
  readonly languesDisponibles = input.required<readonly BolLangueModel[]>();
  /** Langues acquises d'office (création avancée) — affichées en info sous le titre Langues. */
  readonly languesAuto = input<readonly string[]>([]);
  /** Indication du quota restant (création avancée), ex. « Encore 2 langue(s) à choisir ». */
  readonly languesHint = input<string | null>(null);

  protected readonly langueOptions = addMenuOptions(this.languesDisponibles, (langue) => langue.langue);

  readonly avatarClick = output<void>();
  readonly traitAdded = output<TraitAddEvent>();
  readonly traitRemoved = output<number>();
  readonly langueAdded = output<number>();
  readonly langueRemoved = output<number>();
}
