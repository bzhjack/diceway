import {Signal} from '@angular/core';
import {BolSceneModel} from '../../models/bol-scene.model';
import {CombatCatalogEntry, CombatantKind} from '../../models/combat-selection.model';

export interface CommandPaletteData {
  /** État de la table, en signal : les résultats suivent l'arrivée de la bibliothèque et des scènes. */
  readonly context: Signal<PaletteContext>;
}

export type PaletteMode = 'libre' | 'combat';

export type PaletteActionId =
  | 'startCombat'
  | 'endCombat'
  | 'saveScene'
  | 'toggleReserve'
  | 'createHero'
  | 'createPnj'
  | 'createCreature'
  | 'createDemon'
  | 'sessions'
  | 'newSession'
  | 'intendance';

/** Ce que la barre renvoie à la page, qui l'exécute. */
export type PaletteCommand =
  | {readonly type: 'select'; readonly key: string}
  | {
      readonly type: 'place';
      readonly kind: CombatantKind;
      readonly sourceId: string;
      readonly nom: string;
      readonly qty: number;
    }
  | {readonly type: 'loadScene'; readonly scene: BolSceneModel}
  | {readonly type: 'action'; readonly id: PaletteActionId};

export type PaletteGroupId = 'table' | 'place' | 'scene' | 'action';

export interface PaletteResult {
  /** Identifiant unique, utilisable comme `id` DOM (`aria-activedescendant`). */
  readonly id: string;
  /** Pastille affichée : type de personnage, scène ou action. */
  readonly kind: CombatantKind | 'scene' | 'action';
  readonly label: string;
  readonly hint: string;
  readonly command: PaletteCommand;
}

export interface PaletteGroup {
  readonly id: PaletteGroupId;
  readonly label: string;
  readonly results: readonly PaletteResult[];
}

export interface PaletteToken {
  readonly key: string;
  readonly nom: string;
  readonly kind: CombatantKind;
}

/** État de la table dont dépendent les résultats — tout sauf le texte saisi. */
export interface PaletteContext {
  readonly mode: PaletteMode;
  readonly tokens: readonly PaletteToken[];
  readonly catalog: readonly CombatCatalogEntry[];
  /** Ids source (heros_id / pnj_id) déjà présents dans la session. */
  readonly heroIds: ReadonlySet<string>;
  readonly pnjIds: ReadonlySet<string>;
  readonly scenes: readonly BolSceneModel[];
  readonly reserveOpen: boolean;
}

export interface PaletteInput extends PaletteContext {
  readonly query: string;
}
