import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';

export type EntityCardAccent = 'emerald' | 'amber' | 'rose';
export type EntityCardBadgeVariant = 'amber' | 'rose' | 'slate';

export interface EntityCardBadge {
  readonly label: string;
  readonly variant: EntityCardBadgeVariant;
}

export interface EntityCardAction {
  readonly icon: string;
  readonly tooltip: string;
  readonly routerLink: readonly unknown[];
  readonly state?: Record<string, unknown>;
}

export interface EntityCardGauge {
  readonly icon: string;
  readonly value: number;
  readonly label: string;
  readonly accent: 'pv' | 'ph';
}

export interface EntityCardChip {
  readonly icon: string;
  readonly value: number;
  readonly tooltip: string;
}

@Component({
  selector: 'bol-entity-card',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './entity-card.component.html',
  styleUrl: './entity-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityCardComponent {
  readonly image = input.required<string>();
  readonly imageAlt = input('');
  readonly name = input.required<string>();
  readonly meta = input('');
  readonly badge = input<EntityCardBadge | null>(null);
  readonly own = input(false);
  readonly dark = input(false);
  readonly accent = input<EntityCardAccent>('emerald');
  readonly clickablePortrait = input(false);
  readonly actions = input<readonly EntityCardAction[]>([]);
  readonly showDelete = input(true);
  readonly gauges = input<readonly EntityCardGauge[]>([]);
  readonly chips = input<readonly EntityCardChip[]>([]);

  readonly portraitClick = output<void>();
  readonly deleteRequested = output<void>();

  protected onPortraitClick(): void {
    if (this.clickablePortrait()) {
      this.portraitClick.emit();
    }
  }
}
