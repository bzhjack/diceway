import {LibraryRang, LibrarySource} from '../../shared/models/library-rows.model';

/** Ce que reçoit « Ajouter des personnages » : le scénario de la scène (ses fiches sont proposées d'abord) et les PNJ déjà en scène
 * (un PNJ n'y entre qu'une fois, clés `pnj:<id>`). */
export interface PersonnagesDialogData {
  readonly scenarioId: string | null;
  readonly pnjsEnScene: ReadonlySet<string>;
  /** Combien de fiches la scène peut encore recevoir (une scène compte 60 personnages au plus). */
  readonly placesLibres: number;
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
