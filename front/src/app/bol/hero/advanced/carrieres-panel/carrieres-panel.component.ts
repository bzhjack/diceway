import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {HeroCreationWarning} from '../../../services/bol-heros-state.service';
import {AddMenuComponent, AddMenuOption} from '../../../shared/add-menu/add-menu.component';
import {CarriereEntry, CarriereListLegacyComponent} from '../../../shared/carriere/list/carriere-list-legacy.component';
import {DwTagComponent} from '../../../../shared/dw-tag/dw-tag';
import {SectionMessage} from '../section-message';

/** Panneau Carrières de la création avancée : sélection, désavantage de carrière requis, budget. */
@Component({
  selector: 'bol-hero-advanced-carrieres-panel',
  imports: [DwTagComponent, AddMenuComponent, CarriereListLegacyComponent],
  templateUrl: './carrieres-panel.component.html',
  styleUrl: './carrieres-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroAdvancedCarrieresPanelComponent {
  readonly carrieres = input.required<readonly CarriereEntry[]>();
  readonly carriereOptions = input.required<readonly AddMenuOption[]>();
  readonly desavantageOptions = input.required<readonly AddMenuOption[]>();
  readonly desavantageRequiredCount = input(0);
  readonly errors = input<readonly SectionMessage[]>([]);
  readonly warns = input<readonly HeroCreationWarning[]>([]);

  readonly carriereAdded = output<number>();
  readonly carriereRemoved = output<number>();
  readonly desavantageAdded = output<number>();
}
