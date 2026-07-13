import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolHerosModel} from '../../../models/bol-heros.model';

interface PnjCareerEntry {
  readonly label: string;
  readonly value: string | number;
}

export function pnjLanguagesText(pnj: BolHerosModel): string {
  return pnj.origines.langues
    .filter((langue): langue is Exclude<(typeof pnj.origines.langues)[number], number> => typeof langue === 'object')
    .map((langue) => langue.langue?.langue ?? '')
    .filter(Boolean)
    .join(', ');
}

export function pnjImage(pnj: BolHerosModel): string {
  if (!pnj.user_id && pnj.id) {
    return `/assets/bol/pnj/${pnj.id}.jpg`;
  }

  return pnj.origines.avatar || '/assets/bol/empty-avatar.jpg';
}

export function pnjTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case 'C':
      return 'Coriace';
    case 'R':
      return 'Rival';
    case 'P':
      return 'Piétaille';
    default:
      return '';
  }
}

@Component({
  selector: 'bol-pnj-card',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './pnj-card.component.html',
  styleUrl: './pnj-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PnjCardComponent {
  readonly pnj = input.required<BolHerosModel>();
  readonly deleteRequested = output<void>();

  protected image(): string {
    return pnjImage(this.pnj());
  }

  protected typeLabel(): string {
    return pnjTypeLabel(this.pnj().type);
  }

  protected meta(): string {
    const pnj = this.pnj();
    return [pnj.origines.region?.region, pnjLanguagesText(pnj)].filter(Boolean).join(' · ');
  }

  protected careerEntries(): readonly PnjCareerEntry[] {
    return this.pnj()
      .carrieres.map((carriere) => ({
        label: carriere.carriere?.carriere ?? '',
        value: carriere.value,
      }))
      .filter((entry) => entry.label);
  }

  protected traitCount(): number {
    return this.pnj()
      .traits.map((trait) => (trait.type === 'D' ? this.desavantageLabel(trait.traitable) : this.avantageLabel(trait.traitable)))
      .filter(Boolean).length;
  }

  protected armorCount(): number {
    return this.pnj().armures.filter((armure) => typeof armure === 'object').length;
  }

  protected weaponCount(): number {
    return this.pnj().armes.filter((arme) => typeof arme === 'object').length;
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
