import {CombatantRankKey} from '../../session/models/combat-statblock.model';

/** Ce que reçoit « Ajouter des personnages » : le scénario de la scène (ses fiches sont proposées d'abord) et les PNJ déjà en scène
 * (un PNJ n'y entre qu'une fois, clés `pnj:<id>`). */
export interface PersonnagesDialogData {
  readonly scenarioId: string | null;
  readonly pnjsEnScene: ReadonlySet<string>;
}

export type PersonnageType = 'tous' | 'pnj' | 'creature' | 'demon';
export type PersonnageSource = 'tout' | 'catalogue' | 'compte';
export type PersonnageRang = 'tous' | CombatantRankKey;

/** Les filtres du dialogue ; `scenarioId` null : tous les scénarios. */
export interface PersonnagesFiltres {
  type: PersonnageType;
  source: PersonnageSource;
  rang: PersonnageRang;
  scenarioId: string | null;
  recherche: string;
}

/** Une option d'un filtre, avec le nombre de fiches qu'elle montrerait (les autres filtres appliqués). */
export interface PersonnagesOption<T> {
  cle: T;
  label: string;
  compte: number;
}
