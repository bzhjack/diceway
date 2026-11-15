import {CombatCamp, CombatantAttitude} from '../../models/bol-fight-session.model';
import {SceneEntryKind, SceneJetAttribut, SceneJetDifficulte, SceneMeteo, SceneMoment} from '../../models/bol-scene.model';
import {LibraryRang} from '../../shared/models/library-rows.model';

/** Valeur du formulaire « Préparer la scène » : des textes vides plutôt que `null`, et un danger à 0 pour « aucun ». L'illustration
 * n'y est pas : celle d'une scène reste telle qu'elle est. */
export interface SceneFormValue {
  titre: string;
  region_id: number | null;
  lieu: string;
  moment: SceneMoment | null;
  meteo: SceneMeteo | null;
  danger: number;
  lecture: string;
  jeu: string;
  notes: string;
  jets: JetSaisie[];
  pistes: {texte: string; scene_id: string | null}[];
}

/** Un jet de la scène tel que l'onglet « Jets » le saisit : des textes vides plutôt que `null`. */
export interface JetSaisie {
  titre: string;
  attributs: SceneJetAttribut[];
  difficulte: SceneJetDifficulte;
  enjeu: string;
  echec: string;
  reussite: string;
  carriere: string;
  quand: string;
}

/** Un personnage de la scène dans la colonne « Les personnages » : ce qui s'enregistre, et ce qui se montre (nom, portrait, type). */
export interface ScenePersonnageVue {
  kind: SceneEntryKind;
  source_id: string;
  qty: number;
  camp: CombatCamp;
  attitude: CombatantAttitude | null;
  nom: string;
  avatar: string;
  type: string;
  /** Le rang et la vitalité de la fiche, tant qu'elle est connue. */
  rang: LibraryRang | null;
  vitalite: number | null;
  /** La fiche n'est plus dans la bibliothèque (ou pas encore chargée). */
  introuvable: boolean;
}

/** Un des trois textes d'une scène, chacun dans son onglet : à lire aux joueurs, mise en scène, secret du MJ. */
export type SceneTexte = 'lecture' | 'jeu' | 'notes';

/** Un onglet de la carte du texte : un des trois textes, les jets ou les pistes. */
export type SceneOnglet = SceneTexte | 'jets' | 'pistes';
