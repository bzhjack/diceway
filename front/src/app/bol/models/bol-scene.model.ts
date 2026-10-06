import {BolFightSessionModel, CombatCamp} from './bol-fight-session.model';

/** Types de personnages qu'une scène peut contenir — les héros restent à la table, hors scène. */
export type SceneEntryKind = 'pnj' | 'creature' | 'demon';

/** Un personnage (ou un lot) de la distribution d'une scène : référence à la bibliothèque, quantité,
 * et position de chaque exemplaire sur la carte (null = jamais déplacé, placement par défaut). */
export interface BolSceneEntry {
  kind: SceneEntryKind;
  source_id: string;
  qty: number;
  /** Camp au chargement : `heros` pour un allié. Absent sur les scènes anciennes (= `adversaires`). */
  camp?: CombatCamp;
  positions: ({x: number; y: number} | null)[];
}

/** Résumé du scénario auquel une scène appartient. */
export interface BolSceneScenarioRef {
  id: string;
  titre: string;
}

/** Une scène : une distribution de PNJ, créatures et démons qu'on peut charger sur la table, rangée dans un
 * scénario. */
export interface BolSceneModel {
  id: string;
  scenario_id: string | null;
  titre: string;
  ordre: number;
  notes: string | null;
  distribution: BolSceneEntry[];
  scenario?: BolSceneScenarioRef | null;
}

/** `replace` : les PNJ / créatures / démons présents sont retirés d'abord ; `add` : ils restent. */
export type SceneLoadMode = 'replace' | 'add';

/** Réponse au chargement d'une scène : la session mise à jour et le nombre d'entrées ignorées. */
export interface BolSceneLoadResult {
  session: BolFightSessionModel;
  /** Entrées de la scène non chargées (fiche source supprimée, ou PNJ déjà présent). */
  ignored: number;
}

/** Modifications possibles d'une scène existante (titre, notes, scénario) ; un champ absent ne change pas. */
export interface BolSceneChanges {
  titre?: string;
  notes?: string | null;
  scenario_id?: string | null;
}
