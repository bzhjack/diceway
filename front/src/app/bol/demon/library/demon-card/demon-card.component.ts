import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BolDemonModel} from '../../../models/bol-demon.model';

export function demonImage(demon: BolDemonModel): string {
  if (!demon.user_id) {
    return `/assets/bol/demon/${demon.id}.jpg`;
  }

  return demon.avatar || '/assets/bol/empty-avatar.jpg';
}

@Component({
  selector: 'bol-demon-card',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatTooltipModule],
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
}
