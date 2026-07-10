import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolHerosModel} from '../../../models/bol-heros.model';

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
  imports: [RouterLink, MatButtonModule, MatIconModule, MatTooltipModule],
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

  protected meta(): string {
    const hero = this.hero();
    return [hero.origines.joueur, hero.origines.region?.region, heroLanguagesText(hero)].filter(Boolean).join(' · ');
  }

  protected careerEntries(): readonly HeroCareerEntry[] {
    return this.hero()
      .carrieres.map((carriere) => ({
        label: carriere.carriere?.carriere ?? '',
        value: carriere.value,
      }))
      .filter((entry) => entry.label);
  }

  protected traitCount(): number {
    return this.hero()
      .traits.map((trait) => (trait.type === 'D' ? this.desavantageLabel(trait.traitable) : this.avantageLabel(trait.traitable)))
      .filter(Boolean).length;
  }

  protected armorCount(): number {
    return this.hero().armures.filter((armure) => typeof armure === 'object').length;
  }

  protected weaponCount(): number {
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
