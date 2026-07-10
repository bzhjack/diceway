import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolCreatureModel} from '../../../models/bol-creature.model';

export function creatureImage(creature: BolCreatureModel): string {
  if (!creature.user_id) {
    return `/assets/bol/bestiary/${creature.id}.jpg`;
  }

  return creature.avatar || '/assets/bol/empty-avatar.jpg';
}

@Component({
  selector: 'bol-creature-card',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatTooltipModule],
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
}
