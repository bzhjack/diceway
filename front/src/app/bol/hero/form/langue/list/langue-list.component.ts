import {ChangeDetectionStrategy, Component, input, output, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {DwCollapsibleRowComponent} from '../../../../../shared/dw-collapsible-row/dw-collapsible-row';

export interface LangueEntry {
  readonly id: number;
  readonly label: string;
  readonly description: string | null;
  readonly estLemurienne: boolean;
}

@Component({
  selector: 'bol-langue-list',
  imports: [MatButtonModule, MatIconModule, DwCollapsibleRowComponent],
  templateUrl: './langue-list.component.html',
  styleUrl: './langue-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LangueListComponent {
  readonly langues = input.required<readonly LangueEntry[]>();
  readonly removed = output<number>();

  protected readonly expandedIds = signal<ReadonlySet<number>>(new Set());

  protected isExpanded(entry: LangueEntry): boolean {
    return this.expandedIds().has(entry.id);
  }

  protected toggle(entry: LangueEntry): void {
    const next = new Set(this.expandedIds());
    if (next.has(entry.id)) {
      next.delete(entry.id);
    } else {
      next.add(entry.id);
    }

    this.expandedIds.set(next);
  }
}
