import {ChangeDetectionStrategy, Component, input, output, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {DwCollapsibleRowComponent, DwRowTone} from '../../../../shared/dw-collapsible-row/dw-collapsible-row';
import {TraitIcon, traitIconIsSvg, traitIconName} from '../../../shared/trait-icon';

export interface CapaciteEntry {
  readonly id: number;
  readonly label: string;
  readonly description: string | null;
  readonly detail: string | null;
  readonly icon: TraitIcon;
  readonly tone: DwRowTone;
}

@Component({
  selector: 'bol-capacite-list',
  imports: [MatButtonModule, MatIconModule, DwCollapsibleRowComponent],
  templateUrl: './capacite-list.component.html',
  styleUrl: './capacite-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CapaciteListComponent {
  readonly capacites = input.required<readonly CapaciteEntry[]>();
  readonly removed = output<number>();

  protected readonly expandedIds = signal<ReadonlySet<number>>(new Set());
  protected readonly traitIconName = traitIconName;
  protected readonly traitIconIsSvg = traitIconIsSvg;

  protected isExpanded(entry: CapaciteEntry): boolean {
    return this.expandedIds().has(entry.id);
  }

  protected toggle(entry: CapaciteEntry): void {
    const next = new Set(this.expandedIds());
    if (next.has(entry.id)) {
      next.delete(entry.id);
    } else {
      next.add(entry.id);
    }

    this.expandedIds.set(next);
  }
}
