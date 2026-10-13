/** Accent visuel du statbloc : ambre (créature), émeraude (héros/PNJ), rose (démon). */
type BolStatblockAccent = 'amber' | 'emerald' | 'rose';

/** Couleur d'une pastille du statbloc. */
type BolStatblockChipVariant = 'amber' | 'rose' | 'emerald' | 'slate' | 'muted';

/** Pastille d'en-tête du statbloc (rang, joueur, région…). */
export interface BolStatblockChip {
  readonly label: string;
  readonly variant: BolStatblockChipVariant;
}

/** Un chiffre du statbloc, affiché en tuile (ou, pour la vitalité et l'héroïsme, dans le bandeau d'identité). `dice` réduit le corps
 * pour les notations de dés. */
export interface BolStatblockTile {
  readonly label: string;
  readonly value: string | number;
  readonly tone?: 'health' | 'damage' | 'heroism';
  readonly dice?: boolean;
}

/** Une ligne de liste : son nom, à droite sa valeur s'il y en a une (rang d'une carrière, dé d'une arme), et dessous son détail. */
export interface BolStatblockEntry {
  readonly label: string;
  readonly value?: string | number;
  readonly detail?: string;
  /** Arme ou armure : `true` portée ou en main (pastille verte), `false` dans le sac (estompée). Absent pour le reste. */
  readonly equipped?: boolean;
  /** Trait : `plus` pour un avantage, `minus` pour un désavantage. */
  readonly sign?: 'plus' | 'minus';
}

/** Une liste titrée du statbloc : carrières, traits, armes, armures… */
export interface BolStatblockSection {
  readonly title: string;
  readonly emptyText: string;
  readonly entries: readonly BolStatblockEntry[];
}

/** View-model complet d'un statbloc — construit par les builders de `bol-statblock.builders.ts`. */
export interface BolStatblockData {
  readonly accent: BolStatblockAccent;
  readonly title: string;
  readonly isCreation: boolean;
  readonly comment: string | null;
  readonly chips: readonly BolStatblockChip[];
  readonly vitals: readonly BolStatblockTile[];
  /** Attributs puis statistiques de combat, par moitiés : le statbloc en fait deux familles de tuiles. */
  readonly tiles: readonly BolStatblockTile[];
  readonly sections: readonly BolStatblockSection[];
  /** Route vers la fiche d'édition complète (même lien que le bouton "Modifier" des cartes de
   * bibliothèque) — `null` si l'entité n'a pas de fiche éditable dans ce contexte. */
  readonly editRoute: readonly [string, string] | null;
  /** Édition avancée (héros/PNJ non "active", cf. `hero-card.component.ts`) — `null` sinon. */
  readonly advancedEditRoute: readonly [string, string] | null;
}
