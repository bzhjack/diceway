import {ChangeDetectionStrategy, Component, input, output, signal} from '@angular/core';
import {Field, FormField} from '@angular/forms/signals';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {DwCollapsibleRowComponent} from '../../../../shared/dw-collapsible-row/dw-collapsible-row';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';

export interface CarriereEntry {
  readonly id: number;
  readonly label: string;
  readonly description: string | null;
  readonly rank: Field<number>;
}

@Component({
  selector: 'bol-carriere-list',
  imports: [FormField, MatButtonModule, MatIconModule, DwCollapsibleRowComponent, DwValueStepperComponent],
  templateUrl: './carriere-list.component.html',
  styleUrl: './carriere-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarriereListComponent {
  readonly carrieres = input.required<readonly CarriereEntry[]>();
  readonly removed = output<number>();

  protected readonly expandedIds = signal<ReadonlySet<number>>(new Set());

  protected isExpanded(entry: CarriereEntry): boolean {
    return this.expandedIds().has(entry.id);
  }

  protected toggle(entry: CarriereEntry): void {
    const next = new Set(this.expandedIds());
    if (next.has(entry.id)) {
      next.delete(entry.id);
    } else {
      next.add(entry.id);
    }

    this.expandedIds.set(next);
  }
}
