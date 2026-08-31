import {ChangeDetectionStrategy, Component, input, output, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {DwCollapsibleRowComponent} from '../../../../shared/dw-collapsible-row/dw-collapsible-row';
import {BolArmureCategorie} from '../../../models/bol-armure.model';

export interface ArmureEntry {
  readonly id: number;
  readonly label: string;
  readonly protection: string | null;
  readonly malus: string | null;
  readonly ptsDePouvoir: string | null;
  readonly categorie: BolArmureCategorie;
  readonly equipee: boolean;
  readonly malusAgilite: number;
  readonly malusInitiative: number;
}

const CATEGORIE_LABELS: Record<BolArmureCategorie, string> = {
  armure: 'Armure',
  bouclier: 'Bouclier',
  casque: 'Casque',
};

@Component({
  selector: 'bol-armure-list',
  imports: [MatButtonModule, MatIconModule, MatSlideToggleModule, DwCollapsibleRowComponent],
  templateUrl: './armure-list.component.html',
  styleUrl: './armure-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArmureListComponent {
  readonly armures = input.required<readonly ArmureEntry[]>();
  readonly removed = output<number>();
  readonly equippedToggled = output<number>();

  protected readonly expandedIds = signal<ReadonlySet<number>>(new Set());
  protected readonly categorieLabel = (categorie: BolArmureCategorie): string => CATEGORIE_LABELS[categorie];

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
