import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {AttributModifier} from '../../../models/bol-heros-state.model';
import {ResourceEntry} from '../../models/ressources-panel.model';

/** Panneau Ressources de la création avancée : valeurs après activation + modificateurs appliqués. */
@Component({
  selector: 'bol-hero-advanced-ressources-panel',
  templateUrl: './ressources-panel.component.html',
  styleUrl: './ressources-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroAdvancedRessourcesPanelComponent {
  readonly resources = input.required<readonly ResourceEntry[]>();
  readonly heroismCost = input(0);
  readonly modifiers = input<readonly AttributModifier[]>([]);
}
