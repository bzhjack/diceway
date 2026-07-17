import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {MatTooltipModule} from '@angular/material/tooltip';

/** Accent visuel du statbloc : ambre (créature), émeraude (héros/PNJ), rose (démon). */
export type BolStatblockAccent = 'amber' | 'emerald' | 'rose';

export type BolStatblockChipVariant = 'amber' | 'rose' | 'emerald' | 'slate' | 'muted';

export interface BolStatblockChip {
  readonly label: string;
  readonly variant: BolStatblockChipVariant;
}

/** Tuile de la bande vitale ou du rang de stats. `dice` réduit le corps pour les notations de dés. */
export interface BolStatblockTile {
  readonly label: string;
  readonly value: string | number;
  readonly tone?: 'health' | 'damage' | 'heroism';
  readonly dice?: boolean;
}

/** Entrée de liste : avec `value` elle s'affiche en ligne label/valeur (carrières), sinon titre + détail. */
export interface BolStatblockEntry {
  readonly label: string;
  readonly value?: string | number;
  readonly detail?: string;
}

export interface BolStatblockSection {
  readonly title: string;
  readonly emptyText: string;
  readonly entries: readonly BolStatblockEntry[];
  /** true : le détail passe en tooltip au survol du titre au lieu d'une ligne visible (équipement). */
  readonly compact?: boolean;
}

/** View-model complet d'un statbloc — construit par les builders de `bol-statblock.builders.ts`. */
export interface BolStatblockData {
  readonly accent: BolStatblockAccent;
  readonly title: string;
  readonly isCreation: boolean;
  readonly comment: string | null;
  readonly chips: readonly BolStatblockChip[];
  readonly vitals: readonly BolStatblockTile[];
  readonly tiles: readonly BolStatblockTile[];
  /** true = 8 tuiles sur une ligne (héros/PNJ), false = 6 (créature/démon). */
  readonly wideTiles: boolean;
  readonly sections: readonly BolStatblockSection[];
}

/** Statbloc générique BoL : bande vitale colorée → tuiles neutres → listes. */
@Component({
  selector: 'bol-statblock',
  imports: [MatTooltipModule],
  templateUrl: './bol-statblock.component.html',
  styleUrl: './bol-statblock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BolStatblockComponent {
  readonly data = input.required<BolStatblockData>();
  readonly imageSrc = input.required<string>();
}
