import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {BolHerosModel} from '../../../models/bol-heros.model';
import {
  EntityCardAction,
  EntityCardBadge,
  EntityCardChip,
  EntityCardComponent,
  EntityCardGauge,
} from '../../../shared/entity-card/entity-card.component';

interface HeroCareerEntry {
  readonly label: string;
  readonly value: string | number;
}

export function heroLanguagesText(hero: BolHerosModel): string {
  return hero.origines.langues
    .filter((langue): langue is Exclude<(typeof hero.origines.langues)[number], number> => typeof langue === 'object')
    .map((langue) => langue.langue?.langue ?? '')
    .filter(Boolean)
    .join(', ');
}

@Component({
  selector: 'bol-hero-card',
  imports: [EntityCardComponent],
  templateUrl: './hero-card.component.html',
  styleUrl: './hero-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroCardComponent {
  readonly hero = input.required<BolHerosModel>();
  readonly deleteRequested = output<void>();

  protected image(): string {
    return this.hero().origines.avatar || '/assets/bol/empty-avatar.jpg';
  }

  protected badge(): EntityCardBadge | null {
    return this.hero().active ? null : {label: 'En cours', variant: 'amber'};
  }

  protected meta(): string {
    const hero = this.hero();
    return [hero.origines.joueur, hero.origines.region?.region, heroLanguagesText(hero)].filter(Boolean).join(' · ');
  }

  protected actions(): readonly EntityCardAction[] {
    const hero = this.hero();
    const actions: EntityCardAction[] = [
      {icon: 'edit', tooltip: 'Modifier', routerLink: ['/create/hero', hero.id], state: {returnUrl: '/library/heroes'}},
    ];

    if (!hero.active) {
      actions.push({
        icon: 'settings',
        tooltip: 'Édition avancée',
        routerLink: ['/create/hero-advanced', hero.id],
        state: {returnUrl: '/library/heroes'},
      });
    }

    return actions;
  }

  protected gauges(): readonly EntityCardGauge[] {
    const hero = this.hero();
    const gauges: EntityCardGauge[] = [{icon: 'favorite', value: hero.ressources.vitalite, label: 'Vitalité', accent: 'pv'}];

    if (hero.ressources.heroisme > 0) {
      gauges.push({icon: 'star', value: hero.ressources.heroisme, label: 'Héroïsme', accent: 'ph'});
    }

    return gauges;
  }

  protected chips(): readonly EntityCardChip[] {
    return [
      {icon: 'work', value: this.careerEntries().length, tooltip: 'Carrières'},
      {icon: 'auto_awesome', value: this.traitCount(), tooltip: 'Traits'},
      {icon: 'shield', value: this.armorCount(), tooltip: 'Armures'},
      {icon: 'gavel', value: this.weaponCount(), tooltip: 'Armes'},
    ];
  }

  private careerEntries(): readonly HeroCareerEntry[] {
    return this.hero()
      .carrieres.map((carriere) => ({
        label: carriere.carriere?.carriere ?? '',
        value: carriere.value,
      }))
      .filter((entry) => entry.label);
  }

  private traitCount(): number {
    return this.hero()
      .traits.map((trait) => (trait.type === 'D' ? this.desavantageLabel(trait.traitable) : this.avantageLabel(trait.traitable)))
      .filter(Boolean).length;
  }

  private armorCount(): number {
    return this.hero().armures.filter((armure) => typeof armure === 'object').length;
  }

  private weaponCount(): number {
    return this.hero().armes.filter((arme) => typeof arme === 'object').length;
  }

  private avantageLabel(traitable: BolHerosModel['traits'][number]['traitable'] | undefined): string {
    if (traitable && 'avantage' in traitable) {
      return traitable.avantage;
    }

    return '';
  }

  private desavantageLabel(traitable: BolHerosModel['traits'][number]['traitable'] | undefined): string {
    if (traitable && 'desavantage' in traitable) {
      return traitable.desavantage;
    }

    return '';
  }
}
