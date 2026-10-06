import {ChangeDetectionStrategy, Component, input, output, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {DwCollapsibleRowComponent} from '../../../../shared/dw-collapsible-row/dw-collapsible-row';

export interface ArmeEntry {
  readonly id: number;
  readonly label: string;
  readonly degats: string | null;
  readonly portee: string | null;
  readonly notes: string | null;
  readonly equipee: boolean;
}

@Component({
  selector: 'bol-arme-list',
  imports: [MatButtonModule, MatCheckboxModule, MatIconModule, MatTooltipModule, DwCollapsibleRowComponent],
  templateUrl: './arme-list.component.html',
  styleUrl: './arme-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArmeListComponent {
  readonly armes = input.required<readonly ArmeEntry[]>();
  /** À false sur une page qui ne persiste pas l'état équipé : la case reste visible mais n'est pas modifiable. */
  readonly equipToggleEnabled = input(true);
  readonly removed = output<number>();
  /** Un clic sur la case d'une arme : son index dans la liste. */
  readonly equippedToggled = output<number>();

  protected readonly expandedIds = signal<ReadonlySet<number>>(new Set());

  protected isExpanded(entry: ArmeEntry): boolean {
    return this.expandedIds().has(entry.id);
  }

  protected toggle(entry: ArmeEntry): void {
    const next = new Set(this.expandedIds());
    if (next.has(entry.id)) {
      next.delete(entry.id);
    } else {
      next.add(entry.id);
    }

    this.expandedIds.set(next);
  }
}
