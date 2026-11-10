import {BolSceneDistributionSaisie} from '../../models/bol-scene.model';
import {CombatCatalogEntry} from '../../models/combat-selection.model';
import {LibraryRang, LibrarySource} from '../../shared/models/library-rows.model';

/** Ce que reçoit « Ajouter des personnages » : le scénario de la scène (ses fiches sont proposées d'abord) ; son titre, son
 * illustration et son ambiance, pour le bandeau ; et ses personnages, qui forment « La distribution ». */
export interface PersonnagesDialogData {
  readonly scenarioId: string | null;
  readonly sceneTitre: string;
  readonly sceneImage: string;
  /** « Jalad Nût, de nuit, danger 4 » ; vide sans lieu, moment ni danger. */
  readonly sceneAmbiance: string;
  readonly personnages: readonly BolSceneDistributionSaisie[];
}

/** Le type d'une fiche à mettre en scène ; null : tous. */
export type PersonnageType = 'pnj' | 'creature' | 'demon' | null;

/** Les filtres du dialogue, ceux des bibliothèques en lignes en plus du type ; `rang` et `scenarioId` null : tous. */
export interface PersonnagesFiltres {
  type: PersonnageType;
  source: LibrarySource;
  rang: LibraryRang | null;
  scenarioId: string | null;
  recherche: string;
}

/** Une fiche dans la liste du dialogue : son rang, son type, combien d'exemplaires la scène en a déjà, et si « + » en ajoute un. */
export interface PersonnageLigne {
  readonly fiche: CombatCatalogEntry;
  readonly rang: LibraryRang;
  readonly type: string;
  /** Combien d'exemplaires sont déjà dans la scène (0 : aucun). */
  readonly dansLaScene: number;
  readonly ajoutable: boolean;
  /** Ce que dit le portrait : « Ajouter Loup », « Un Loup de plus ». */
  readonly ajout: string;
}
