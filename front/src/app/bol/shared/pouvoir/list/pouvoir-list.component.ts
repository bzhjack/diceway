import {ChangeDetectionStrategy, Component, input, output, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {DwCollapsibleRowComponent} from '../../../../shared/dw-collapsible-row/dw-collapsible-row';

export interface PouvoirEntry {
  readonly id: number;
  readonly label: string;
  readonly description: string | null;
  readonly detail: string | null;
}

@Component({
  selector: 'bol-pouvoir-list',
  imports: [MatButtonModule, MatIconModule, DwCollapsibleRowComponent],
  templateUrl: './pouvoir-list.component.html',
  styleUrl: './pouvoir-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PouvoirListComponent {
  readonly pouvoirs = input.required<readonly PouvoirEntry[]>();
  readonly removed = output<number>();

  protected readonly expandedIds = signal<ReadonlySet<number>>(new Set());

  protected isExpanded(entry: PouvoirEntry): boolean {
    return this.expandedIds().has(entry.id);
  }

  protected toggle(entry: PouvoirEntry): void {
    const next = new Set(this.expandedIds());
    if (next.has(entry.id)) {
      next.delete(entry.id);
    } else {
      next.add(entry.id);
    }

    this.expandedIds.set(next);
  }
}
