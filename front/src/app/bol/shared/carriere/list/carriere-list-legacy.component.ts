import {ChangeDetectionStrategy, Component, input, output, signal} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {DwCollapsibleRowComponent} from '../../../../shared/dw-collapsible-row/dw-collapsible-row';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';

export interface CarriereEntry {
  readonly id: number;
  readonly label: string;
  readonly description: string | null;
  readonly rank: FormControl<number>;
}

/**
 * Variante Reactive Forms de {@link CarriereListComponent}, pour hero-advanced-page qui
 * n'a pas encore été migré vers Signal Forms. À supprimer une fois ce dernier porté.
 */
@Component({
  selector: 'bol-carriere-list-legacy',
  imports: [ReactiveFormsModule, MatButtonModule, MatIconModule, DwCollapsibleRowComponent, DwValueStepperComponent],
  templateUrl: './carriere-list-legacy.component.html',
  styleUrl: './carriere-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CarriereListLegacyComponent {
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
