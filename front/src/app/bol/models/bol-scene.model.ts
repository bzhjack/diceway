import {BolFightSessionModel, CombatantAttitude, CombatCamp} from './bol-fight-session.model';

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
  /** Attitude envers les héros au chargement. Absente sur les scènes anciennes. */
  attitude?: CombatantAttitude | null;
  positions: ({x: number; y: number} | null)[];
}

/** Résumé du scénario auquel une scène appartient. */
export interface BolSceneScenarioRef {
  id: string;
  titre: string;
}

/** Moment de la journée où se joue une scène. */
export type SceneMoment = 'aube' | 'jour' | 'crepuscule' | 'nuit';

/** Temps qu'il fait pendant une scène. */
export type SceneMeteo = 'clair' | 'couvert' | 'pluie' | 'brume' | 'vent' | 'orage' | 'cendres';

/** Une piste que les héros peuvent suivre, éventuellement vers une autre scène du même scénario. */
export interface BolScenePiste {
  texte: string;
  scene_id: string | null;
}

/** Une scène : une distribution de PNJ, créatures et démons qu'on peut charger sur la table, rangée dans un
 * scénario, avec sa préparation — décor (région, lieu, illustration), ambiance, texte à lire, secret du MJ
 * (`notes`) et pistes. */
export interface BolSceneModel {
  id: string;
  scenario_id: string | null;
  titre: string;
  ordre: number;
  /** Secret du MJ : ce que les joueurs ne doivent pas voir. */
  notes: string | null;
  distribution: BolSceneEntry[];
  scenario?: BolSceneScenarioRef | null;
  /** Région du catalogue où se joue la scène : elle la place sur la carte de Lémurie. */
  region_id: number | null;
  /** Précision sur le lieu, dans la région (« Gué du Tyr »). */
  lieu: string | null;
  moment: SceneMoment | null;
  meteo: SceneMeteo | null;
  /** Danger de 1 à 4. */
  danger: number | null;
  /** Texte à lire aux joueurs. */
  lecture: string | null;
  pistes: BolScenePiste[] | null;
  /** Adresse de l'illustration (`https://…` ou `/assets/…`). */
  image: string | null;
}

/** `replace` : les PNJ / créatures / démons présents sont retirés d'abord ; `add` : ils restent. */
export type SceneLoadMode = 'replace' | 'add';

/** Réponse au chargement d'une scène : la session mise à jour et le nombre d'entrées ignorées. */
export interface BolSceneLoadResult {
  session: BolFightSessionModel;
  /** Entrées de la scène non chargées (fiche source supprimée, ou PNJ déjà présent). */
  ignored: number;
}

/** Modifications possibles d'une scène existante (titre, notes, scénario, préparation) ; un champ absent ne
 * change pas. */
export interface BolSceneChanges {
  titre?: string;
  notes?: string | null;
  scenario_id?: string | null;
  region_id?: number | null;
  lieu?: string | null;
  moment?: SceneMoment | null;
  meteo?: SceneMeteo | null;
  danger?: number | null;
  lecture?: string | null;
  pistes?: BolScenePiste[] | null;
  image?: string | null;
}
