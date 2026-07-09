import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {DwBadgeComponent} from '../../../shared/dw-badge/dw-badge';

export interface TraitDetail {
  readonly title: string;
  readonly description: string | null;
}

export interface TraitEntry {
  readonly id: number;
  readonly type: 'A' | 'D';
  readonly label: string;
  readonly details: readonly TraitDetail[];
}

@Component({
  selector: 'bol-trait-list',
  imports: [MatButtonModule, MatIconModule, DwBadgeComponent],
  templateUrl: './trait-list.component.html',
  styleUrl: './trait-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraitListComponent {
  readonly traits = input.required<readonly TraitEntry[]>();
  readonly removed = output<number>();
}
