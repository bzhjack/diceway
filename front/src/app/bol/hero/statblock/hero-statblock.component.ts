import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {BolHerosModel} from '../../models/bol-heros.model';
import {BolHerosArmureModel} from '../../models/bol-armure.model';
import {BolHerosArmeModel} from '../../models/bol-arme.model';
import {EntityCardBadge} from '../../shared/entity-card/entity-card.component';
import {heroBadge} from '../library/hero-card/hero-card.component';

interface HeroStatValue {
  readonly label: string;
  readonly value: string | number;
}

interface HeroCareerEntry {
  readonly label: string;
  readonly value: number;
}

interface HeroListEntry {
  readonly label: string;
  readonly detail: string;
}

@Component({
  selector: 'bol-hero-statblock',
  templateUrl: './hero-statblock.component.html',
  styleUrl: './hero-statblock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroStatblockComponent {
  readonly hero = input.required<BolHerosModel>();
  readonly imageSrc = input.required<string>();

  protected readonly badge = computed<EntityCardBadge | null>(() => heroBadge(this.hero()));

  protected readonly resourceEntries = computed<readonly HeroStatValue[]>(() => {
    const entries: HeroStatValue[] = [{label: 'Vitalité', value: this.hero().ressources.vitalite}];

    if (this.hero().ressources.heroisme > 0) {
      entries.push({label: 'Héroïsme', value: this.hero().ressources.heroisme});
    }

    return entries;
  });

  protected readonly attributeEntries = computed<readonly HeroStatValue[]>(() => [
    {label: 'Vigueur', value: this.hero().attributs.vigueur},
    {label: 'Agilité', value: this.hero().attributs.agilite},
    {label: 'Esprit', value: this.hero().attributs.esprit},
    {label: 'Aura', value: this.hero().attributs.aura},
  ]);

  protected readonly combatEntries = computed<readonly HeroStatValue[]>(() => [
    {label: 'Initiative', value: this.hero().combat.initiative},
    {label: 'Mêlée', value: this.hero().combat.melee},
    {label: 'Tir', value: this.hero().combat.tir},
    {label: 'Défense', value: this.hero().combat.defense},
  ]);

  protected readonly careerEntries = computed<readonly HeroCareerEntry[]>(() =>
    this.hero()
      .carrieres.map((carriere) => ({label: carriere.carriere?.carriere ?? '', value: carriere.value}))
      .filter((entry) => entry.label),
  );

  protected readonly traitEntries = computed<readonly HeroListEntry[]>(() =>
    this.hero()
      .traits.map((trait) => {
        const traitable = trait.traitable;
        const label = traitable && 'avantage' in traitable ? traitable.avantage : traitable && 'desavantage' in traitable ? traitable.desavantage : '';

        return {label, detail: trait.detail ?? ''};
      })
      .filter((entry) => entry.label),
  );

  protected readonly armorEntries = computed<readonly HeroListEntry[]>(() =>
    (this.hero().armures as (BolHerosArmureModel | number)[])
      .filter((armure): armure is BolHerosArmureModel => typeof armure === 'object')
      .map((armure) => ({
        label: armure.armure?.armure ?? '',
        detail: [armure.armure?.protection, armure.armure?.malus].filter(Boolean).join(' · '),
      }))
      .filter((entry) => entry.label),
  );

  protected readonly weaponEntries = computed<readonly HeroListEntry[]>(() =>
    (this.hero().armes as (BolHerosArmeModel | number)[])
      .filter((arme): arme is BolHerosArmeModel => typeof arme === 'object')
      .map((arme) => ({
        label: arme.arme?.arme ?? '',
        detail: [arme.arme?.degats, arme.arme?.portee].filter(Boolean).join(' · '),
      }))
      .filter((entry) => entry.label),
  );
}
