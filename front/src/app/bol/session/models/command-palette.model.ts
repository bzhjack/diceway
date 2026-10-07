import {Signal} from '@angular/core';
import {BolSceneModel} from '../../models/bol-scene.model';
import {CombatCatalogEntry, CombatantKind} from '../../models/combat-selection.model';

/** Données passées à la palette de commandes à son ouverture. */
export interface CommandPaletteData {
  /** État de la table, en signal : les résultats suivent l'arrivée de la bibliothèque et des scènes. */
  readonly context: Signal<PaletteContext>;
}

/** Mode de la table, qui décide des commandes proposées : sans combat ou en combat. */
export type PaletteMode = 'libre' | 'combat';

/** Les actions de la table que la palette sait déclencher. */
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

/** Les groupes de résultats de la palette : cartes de la table, personnages à poser, scènes, actions. */
export type PaletteGroupId = 'table' | 'place' | 'scene' | 'action';

/** Une ligne de résultat de la palette : son libellé, sa pastille et la commande qu'elle exécute. */
export interface PaletteResult {
  /** Identifiant unique, utilisable comme `id` DOM (`aria-activedescendant`). */
  readonly id: string;
  /** Pastille affichée : type de personnage, scène ou action. */
  readonly kind: CombatantKind | 'scene' | 'action';
  readonly label: string;
  readonly hint: string;
  readonly command: PaletteCommand;
}

/** Un groupe de résultats de la palette, avec son titre. */
export interface PaletteGroup {
  readonly id: PaletteGroupId;
  readonly label: string;
  readonly results: readonly PaletteResult[];
}

/** Un personnage déjà à table, tel que la palette le connaît pour pouvoir le sélectionner. */
interface PaletteToken {
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

/** Ce que le moteur de recherche de la palette reçoit : l'état de la table et le texte saisi. */
export interface PaletteInput extends PaletteContext {
  readonly query: string;
}
