import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {BolDemonModel} from '../../../models/bol-demon.model';
import {
  EntityCardAction,
  EntityCardBadge,
  EntityCardChip,
  EntityCardComponent,
  EntityCardGauge,
} from '../../../shared/entity-card/entity-card.component';

export function demonImage(demon: BolDemonModel): string {
  if (!demon.user_id) {
    return `/assets/bol/demon/${demon.id}.jpg`;
  }

  return demon.avatar || '/assets/bol/empty-avatar.jpg';
}

@Component({
  selector: 'bol-demon-card',
  imports: [EntityCardComponent],
  templateUrl: './demon-card.component.html',
  styleUrl: './demon-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemonCardComponent {
  readonly demon = input.required<BolDemonModel>();
  readonly deleteRequested = output<void>();

  protected image(): string {
    return demonImage(this.demon());
  }

  protected badge(): EntityCardBadge {
    const label = this.demon().categorie.categorie;

    switch (this.demon().categorie.type) {
      case 'C':
        return {label, variant: 'amber'};
      case 'R':
        return {label, variant: 'rose'};
      default:
        return {label, variant: 'slate'};
    }
  }

  protected actions(): readonly EntityCardAction[] {
    if (!this.demon().user_id) {
      return [];
    }

    return [
      {icon: 'edit', tooltip: 'Modifier', routerLink: ['/create/demon', this.demon().id], state: {returnUrl: '/library/demons'}},
    ];
  }

  protected showDelete(): boolean {
    return Boolean(this.demon().user_id);
  }

  protected gauges(): readonly EntityCardGauge[] {
    return [{icon: 'favorite', value: this.demon().vitalite, label: 'Vitalité', accent: 'pv'}];
  }

  protected chips(): readonly EntityCardChip[] {
    return [{icon: 'auto_awesome', value: this.demon().pouvoirs.length, tooltip: 'Pouvoirs infernaux'}];
  }
}
