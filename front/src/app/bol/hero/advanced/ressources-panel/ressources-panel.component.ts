import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {AttributModifier} from '../../../services/bol-heros-state.service';

export interface ResourceEntry {
  readonly key: string;
  readonly label: string;
  readonly value: number;
}

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
