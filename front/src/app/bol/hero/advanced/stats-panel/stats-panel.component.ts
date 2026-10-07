import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {FieldTree} from '@angular/forms/signals';
import {HeroCreationWarning} from '../../../models/bol-heros-state.model';
import {StatsGridComponent} from '../../../shared/stats-grid/stats-grid.component';
import {StatGroup} from '../../../shared/models/stats-grid.model';
import {SectionMessage} from '../../models/section-message.model';

/** Panneau Attributs / Combat de la création avancée : grille de stats + erreurs/avertissements de budget. */
@Component({
  selector: 'bol-hero-advanced-stats-panel',
  imports: [StatsGridComponent],
  templateUrl: './stats-panel.component.html',
  styleUrl: './stats-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroAdvancedStatsPanelComponent {
  readonly form = input.required<FieldTree<Record<string, number>>>();
  readonly groups = input.required<readonly StatGroup[]>();
  readonly errors = input<readonly SectionMessage[]>([]);
  readonly warns = input<readonly HeroCreationWarning[]>([]);
}
