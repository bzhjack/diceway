import {ChangeDetectionStrategy, Component, input, output, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {InlineSvgDirective} from '../../../shared/inline-svg/inline-svg.directive';
import {TraitIcon, traitIconPath} from '../../shared/trait-icon';

export interface TraitDetail {
  readonly title: string;
  readonly description: string | null;
}

export interface TraitEntry {
  readonly id: number;
  readonly type: 'A' | 'D';
  readonly label: string;
  readonly details: readonly TraitDetail[];
  readonly icon: TraitIcon;
}

@Component({
  selector: 'bol-trait-list',
  imports: [MatButtonModule, MatIconModule, InlineSvgDirective],
  templateUrl: './trait-list.component.html',
  styleUrl: './trait-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraitListComponent {
  readonly traits = input.required<readonly TraitEntry[]>();
  readonly removed = output<number>();

  protected readonly expandedKeys = signal<ReadonlySet<string>>(new Set());
  protected readonly traitIconPath = traitIconPath;

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
