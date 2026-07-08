import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {BolHerosStateService} from '../../services/bol-heros-state.service';

interface ResourceEntry {
  readonly label: string;
  readonly value: number;
}

@Component({
  selector: 'bol-hero-advanced-ressources',
  templateUrl: './ressources.component.html',
  styleUrl: './ressources.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroAdvancedRessourcesComponent {
  private readonly herosStateService = inject(BolHerosStateService);

  protected readonly heroismCost = computed(() => this.herosStateService.heroismCost());
  protected readonly displayResources = computed<readonly ResourceEntry[]>(() => {
    const hero = this.herosStateService.currentHeros();
    const base = {
      vitalite: Number(hero?.ressources.vitalite ?? 10),
      heroisme: Number(hero?.ressources.heroisme ?? 5),
      foi: Number(hero?.ressources.foi ?? 0),
      pouvoir: Number(hero?.ressources.pouvoir ?? 0),
      creation: Number(hero?.ressources.creation ?? 0),
      experience: Number(hero?.ressources.experience ?? 0),
    };

    for (const modifier of this.herosStateService.traitsModifiers()) {
      if (modifier.attr in base) {
        const key = modifier.attr as keyof typeof base;
        base[key] = Number(base[key]) + Number(modifier.value);
      }
    }

    return [
      {label: 'Vitalité', value: base.vitalite},
      {label: 'Héroïsme', value: base.heroisme},
      {label: 'Pouvoir', value: base.pouvoir},
      {label: 'Foi', value: base.foi},
      {label: 'Création', value: base.creation},
      {label: 'Expérience', value: base.experience},
    ];
  });
}
