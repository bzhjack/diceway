import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {BolHerosModel} from '../../../models/bol-heros.model';
import {
  EntityCardAction,
  EntityCardBadge,
  EntityCardChip,
  EntityCardComponent,
  EntityCardGauge,
} from '../../../shared/entity-card/entity-card.component';

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

export function pnjBadge(pnj: BolHerosModel): EntityCardBadge | null {
  const label = pnjTypeLabel(pnj.type);
  if (!label) {
    return null;
  }

  switch (pnj.type) {
    case 'C':
      return {label, variant: 'amber'};
    case 'R':
      return {label, variant: 'rose'};
    default:
      return {label, variant: 'slate'};
  }
}

@Component({
  selector: 'bol-pnj-card',
  imports: [EntityCardComponent],
  templateUrl: './pnj-card.component.html',
  styleUrl: './pnj-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PnjCardComponent {
  readonly pnj = input.required<BolHerosModel>();
  readonly deleteRequested = output<void>();
  readonly statblockRequested = output<void>();

  protected image(): string {
    return pnjImage(this.pnj());
  }

  protected badge(): EntityCardBadge | null {
    return pnjBadge(this.pnj());
  }

  protected meta(): string {
    const pnj = this.pnj();
    return [pnj.origines.region?.region, pnjLanguagesText(pnj)].filter(Boolean).join(' · ');
  }

  protected actions(): readonly EntityCardAction[] {
    if (!this.pnj().user_id) {
      return [];
    }

    return [{icon: 'edit', tooltip: 'Modifier', routerLink: ['/create/pnj', this.pnj().id], state: {returnUrl: '/library/pnjs'}}];
  }

  protected showDelete(): boolean {
    return Boolean(this.pnj().user_id);
  }

  protected gauges(): readonly EntityCardGauge[] {
    const pnj = this.pnj();
    const gauges: EntityCardGauge[] = [{icon: 'favorite', value: pnj.ressources.vitalite, label: 'Vitalité', accent: 'pv'}];

    if (pnj.ressources.heroisme > 0) {
      gauges.push({icon: 'star', value: pnj.ressources.heroisme, label: 'Héroïsme', accent: 'ph'});
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

  private careerEntries(): readonly PnjCareerEntry[] {
    return this.pnj()
      .carrieres.map((carriere) => ({
        label: carriere.carriere?.carriere ?? '',
        value: carriere.value,
      }))
      .filter((entry) => entry.label);
  }

  private traitCount(): number {
    return this.pnj()
      .traits.map((trait) => (trait.type === 'D' ? this.desavantageLabel(trait.traitable) : this.avantageLabel(trait.traitable)))
      .filter(Boolean).length;
  }

  private armorCount(): number {
    return this.pnj().armures.filter((armure) => typeof armure === 'object').length;
  }

  private weaponCount(): number {
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
