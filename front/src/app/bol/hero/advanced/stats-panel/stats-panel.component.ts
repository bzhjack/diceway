import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {FormGroup} from '@angular/forms';
import {HeroCreationWarning} from '../../../services/bol-heros-state.service';
import {StatGroup, StatsGridComponent} from '../../../shared/stats-grid/stats-grid.component';
import {SectionMessage} from '../section-message';

/** Panneau Attributs / Combat de la création avancée : grille de stats + erreurs/avertissements de budget. */
@Component({
  selector: 'bol-hero-advanced-stats-panel',
  imports: [StatsGridComponent],
  templateUrl: './stats-panel.component.html',
  styleUrl: './stats-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroAdvancedStatsPanelComponent {
  readonly form = input.required<FormGroup>();
  readonly groups = input.required<readonly StatGroup[]>();
  readonly errors = input<readonly SectionMessage[]>([]);
  readonly warns = input<readonly HeroCreationWarning[]>([]);
}
