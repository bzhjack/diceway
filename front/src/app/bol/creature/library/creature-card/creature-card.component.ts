import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {BolCreatureModel} from '../../../models/bol-creature.model';
import {
  EntityCardAction,
  EntityCardBadge,
  EntityCardChip,
  EntityCardComponent,
  EntityCardGauge,
} from '../../../shared/entity-card/entity-card.component';

export function creatureImage(creature: BolCreatureModel): string {
  if (!creature.user_id) {
    return `/assets/bol/bestiary/${creature.id}.jpg`;
  }

  return creature.avatar || '/assets/bol/empty-avatar.jpg';
}

@Component({
  selector: 'bol-creature-card',
  imports: [EntityCardComponent],
  templateUrl: './creature-card.component.html',
  styleUrl: './creature-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatureCardComponent {
  readonly creature = input.required<BolCreatureModel>();
  readonly deleteRequested = output<void>();
  readonly statblockRequested = output<void>();

  protected image(): string {
    return creatureImage(this.creature());
  }

  protected badge(): EntityCardBadge {
    const label = this.creature().taille.taille;

    switch (this.creature().taille.type) {
      case 'C':
        return {label, variant: 'amber'};
      case 'R':
        return {label, variant: 'rose'};
      default:
        return {label, variant: 'slate'};
    }
  }

  protected actions(): readonly EntityCardAction[] {
    if (!this.creature().user_id) {
      return [];
    }

    return [
      {
        icon: 'edit',
        tooltip: 'Modifier',
        routerLink: ['/create/creature', this.creature().id],
        state: {returnUrl: '/library/creatures'},
      },
    ];
  }

  protected showDelete(): boolean {
    return Boolean(this.creature().user_id);
  }

  protected gauges(): readonly EntityCardGauge[] {
    return [{icon: 'favorite', value: this.creature().vitalite, label: 'Vitalité', accent: 'pv'}];
  }

  protected chips(): readonly EntityCardChip[] {
    return [{icon: 'auto_awesome', value: this.creature().capacites.length, tooltip: 'Capacités'}];
  }
}
