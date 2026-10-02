import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {RouterLink} from '@angular/router';

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
  /** true : l'entrée est mise en évidence en vert (armure actuellement équipée). */
  readonly equipped?: boolean;
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
  /** Route vers la fiche d'édition complète (même lien que le bouton "Modifier" des cartes de
   * bibliothèque) — `null` si l'entité n'a pas de fiche éditable dans ce contexte. */
  readonly editRoute: readonly [string, string] | null;
  /** Édition avancée (héros/PNJ non "active", cf. `hero-card.component.ts`) — `null` sinon. */
  readonly advancedEditRoute: readonly [string, string] | null;
}

/** Statbloc générique BoL : bande vitale colorée → tuiles neutres → listes. */
@Component({
  selector: 'bol-statblock',
  imports: [MatIconModule, MatTooltipModule, RouterLink],
  templateUrl: './bol-statblock.component.html',
  styleUrl: './bol-statblock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BolStatblockComponent {
  readonly data = input.required<BolStatblockData>();
  readonly imageSrc = input.required<string>();
  /** Page à laquelle revenir après édition (ex. la session de combat en cours) — `null` si sans objet. */
  readonly returnUrl = input<string | null>(null);

  protected navigationState(): Record<string, string> | undefined {
    const returnUrl = this.returnUrl();
    return returnUrl ? {returnUrl} : undefined;
  }
}
