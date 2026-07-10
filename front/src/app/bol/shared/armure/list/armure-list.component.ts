import {ChangeDetectionStrategy, Component, input, output, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {DwCollapsibleRowComponent} from '../../../../shared/dw-collapsible-row/dw-collapsible-row';

export interface ArmureEntry {
  readonly id: number;
  readonly label: string;
  readonly protection: string | null;
  readonly malus: string | null;
  readonly ptsDePouvoir: string | null;
}

@Component({
  selector: 'bol-armure-list',
  imports: [MatButtonModule, MatIconModule, DwCollapsibleRowComponent],
  templateUrl: './armure-list.component.html',
  styleUrl: './armure-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArmureListComponent {
  readonly armures = input.required<readonly ArmureEntry[]>();
  readonly removed = output<number>();

  protected readonly expandedIds = signal<ReadonlySet<number>>(new Set());

  protected isExpanded(entry: ArmureEntry): boolean {
    return this.expandedIds().has(entry.id);
  }

  protected toggle(entry: ArmureEntry): void {
    const next = new Set(this.expandedIds());
    if (next.has(entry.id)) {
      next.delete(entry.id);
    } else {
      next.add(entry.id);
    }

    this.expandedIds.set(next);
  }
}
