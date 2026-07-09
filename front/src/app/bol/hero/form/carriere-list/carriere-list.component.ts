import {ChangeDetectionStrategy, Component, input, output, signal} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {DwCollapsibleRowComponent} from '../../../../shared/dw-collapsible-row/dw-collapsible-row';

export interface CarriereEntry {
  readonly id: number;
  readonly label: string;
  readonly description: string | null;
  readonly rank: FormControl<number>;
}

@Component({
  selector: 'bol-carriere-list',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, DwCollapsibleRowComponent],
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
