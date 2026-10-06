import {ChangeDetectionStrategy, Component, input, output, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {DwCollapsibleRowComponent} from '../../../../shared/dw-collapsible-row/dw-collapsible-row';
import {traitIconIsSvg, traitIconName} from '../../../shared/trait-icon';
import {TraitEntry} from '../../models/trait-list.model';

@Component({
  selector: 'bol-trait-list',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, DwCollapsibleRowComponent],
  templateUrl: './trait-list.component.html',
  styleUrl: './trait-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraitListComponent {
  readonly traits = input.required<readonly TraitEntry[]>();
  readonly removed = output<number>();

  protected readonly expandedKeys = signal<ReadonlySet<string>>(new Set());
  protected readonly traitIconName = traitIconName;
  protected readonly traitIconIsSvg = traitIconIsSvg;

  protected traitKey(trait: TraitEntry): string {
    return `${trait.type}-${trait.id}`;
  }

  protected isExpanded(trait: TraitEntry): boolean {
    return this.expandedKeys().has(this.traitKey(trait));
  }

  protected toggle(trait: TraitEntry): void {
    const key = this.traitKey(trait);
    const next = new Set(this.expandedKeys());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }

    this.expandedKeys.set(next);
  }
}
