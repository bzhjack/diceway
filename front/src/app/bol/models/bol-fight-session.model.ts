/** Camp d'un combattant à la table : les héros et leurs alliés (`heros`), ou les adversaires. */
export type CombatCamp = 'heros' | 'adversaires';

/** Attitude d'un PNJ, d'une créature ou d'un démon en scène envers les héros. */
export type CombatantAttitude = 'hostile' | 'mefiant' | 'neutre' | 'amical';

/** Résultat du jet de réaction BoL (2d6 + esprit + initiative, 9+) — seuls les héros le lancent. */
export type InitiativeResultat = 'echec_critique' | 'echec' | 'reussite' | 'heroique' | 'legendaire';

/** Où en est la session : `libre` (table sans combat), `combat` (rounds en cours) ou `terminee`. */
type BolFightSessionStatut = 'libre' | 'combat' | 'terminee';

/** État d'un combat en cours tel que gardé en base (cf. `combat-turn.util.ts`). */
export interface EtatCombatDto {
  round: number;
  joues: string[];
  /** Effets en cours, validés par le front (cf. `normalizeEffets`). */
  effets?: unknown[];
  /** Cartes laissées sur la table mais exclues du combat. */
  exclus?: string[];
  /** Le dé du MJ pour tous (`null` : retiré). */
  deMj?: 'bonus' | 'malus' | null;
}

/** Scène courante d'une session, telle que sérialisée avec la session (titres pour la barre du haut). */
export interface BolSessionSceneRef {
  id: string;
  titre: string;
  scenario?: {id: string; titre: string} | null;
}

/** Une session de jeu telle que l'API la renvoie : sa table (héros, PNJ, créatures, démons), l'état de son
 * combat et sa scène courante. */
export interface BolFightSessionModel {
  id: string | null;
  user_id?: string | null;
  titre: string | null;
  statut: BolFightSessionStatut;
  /** Ordre d'initiative réordonné manuellement (glisser-déposer du ruban) — clés `PlayToken.key`, dans l'ordre voulu. */
  ordre_manuel?: string[] | null;
  /** Position des jetons de l'ancien battlefield (plus utilisée depuis le tapis) — clé `PlayToken.key` → {x, y} en pourcentage. */
  positions_jetons?: Record<string, {x: number; y: number}> | null;
  /** Dernière scène chargée ou enregistrée sur cette table — null si aucune. */
  scene_id?: string | null;
  scene?: BolSessionSceneRef | null;
  /** Scènes qui ont été courantes sur cette table, dans l'ordre — la frise les marque « jouées ». */
  scenes_jouees?: string[] | null;
  /** Round, cartes qui ont joué et cartes en défense totale — null hors combat. */
  etat_combat?: EtatCombatDto | null;
  heros?: BolFightSessionHerosModel[];
  creatures?: BolFightSessionCreatureModel[];
  demons?: BolFightSessionDemonModel[];
  pnjs?: BolFightSessionPnjModel[];
}

/** Une session dans une liste : sans sa table ni ses portraits, seulement ce qu'il faut pour la reconnaître et la rouvrir. */
export interface BolFightSessionSummaryModel {
  id: string;
  titre: string | null;
  statut: BolFightSessionStatut;
  /** Héros et alliés à la table. */
  heros_count: number;
  adversaires_count: number;
}

/** Un héros posé à la table (ligne de liaison avec la session) : son camp, son jet de réaction, sa vitalité
 * de session et sa fiche. */
export interface BolFightSessionHerosModel {
  id: number;
  fight_session_id: string;
  heros_id: string;
  camp: CombatCamp;
  initiative_resultat: InitiativeResultat | null;
  vitalite_courante: number | null;
  heros?: {
    id: string | null;
    origines: {nom: string | null; avatar: string | null; joueur: string | null};
    /** Agilité du héros ; `agilite_effective` tient compte de l'armure portée. L'agilité brute départage les héros de même résultat de réaction. */
    attributs?: {agilite: number; agilite_effective: number};
    ressources?: {vitalite: number; heroisme: number};
    /** Défense du héros ; `defense_effective` tient compte de l'équipement porté. */
    combat?: {defense: number; defense_effective: number};
    /** Armes du héros (chargées avec la session pour afficher ses dégâts sur sa carte). */
    armes?: {equipee?: boolean; arme?: {arme: string; degats: string | null} | null}[];
  };
}

/** Capacité d'une créature posée à la table, avec ses éventuels dés de bonus ou de malus. */
interface BolFightSessionCapaciteModel {
  capacite_id: number;
  capacite: string | null;
  de_bonus: boolean;
  de_malus: boolean;
  detail: string | null;
}

/** Une créature posée à la table : copie de ses statistiques au moment de l'ajout et sa vitalité. */
interface BolFightSessionCreatureModel {
  id: number;
  fight_session_id: string;
  creature_id: string | null;
  camp: CombatCamp;
  /** Attitude envers les héros — null ou absente : aucune. */
  attitude?: CombatantAttitude | null;
  surnom: string | null;
  rang: 'rival' | 'coriace' | 'pietaille';
  nom: string;
  vigueur: number;
  agilite: number;
  esprit: number;
  vitalite_max: number;
  vitalite_courante: number;
  attaque: number;
  defense: number;
  degats: string | null;
  protection: string | null;
  id_taille: number;
  capacites: BolFightSessionCapaciteModel[] | null;
  creature?: {avatar: string | null};
}

/** Pouvoir d'un démon posé à la table. */
interface BolFightSessionPouvoirModel {
  pouvoir_id: number;
  pouvoir: string | null;
  detail: string | null;
}

/** Un démon posé à la table : copie de ses statistiques au moment de l'ajout, comme pour une
 * créature. */
interface BolFightSessionDemonModel {
  id: number;
  fight_session_id: string;
  demon_id: string | null;
  camp: CombatCamp;
  /** Attitude envers les héros — null ou absente : aucune. */
  attitude?: CombatantAttitude | null;
  surnom: string | null;
  rang: 'rival' | 'coriace' | 'pietaille';
  nom: string;
  vigueur: number;
  agilite: number;
  esprit: number;
  aura: number;
  melee: number;
  tir: number;
  defense: number;
  vitalite_max: number;
  vitalite_courante: number;
  degats: string | null;
  pouvoirs: BolFightSessionPouvoirModel[] | null;
  demon?: {avatar: string | null};
}

/** Arme d'un PNJ posé à la table : nom, dégâts et type (`M` mêlée, `T` tir). */
interface BolFightSessionArmeModel {
  nom: string | null;
  degats: string | null;
  type: 'M' | 'T' | null;
  /** Portée de base de l'arme (« 3 m », « 9 m / 18 m ») — absente des lignes posées avant cette information. */
  portee?: string | null;
  /** Équipée sur la fiche du PNJ à la pose — absent des lignes posées avant cette information. */
  equipee?: boolean;
}

/** Un PNJ posé à la table : copie de ses statistiques et de ses armes au moment de l'ajout. */
interface BolFightSessionPnjModel {
  id: number;
  fight_session_id: string;
  pnj_id: string | null;
  camp: CombatCamp;
  /** Attitude envers les héros — null ou absente : aucune. */
  attitude?: CombatantAttitude | null;
  surnom: string | null;
  rang: 'rival' | 'coriace' | 'pietaille';
  nom: string;
  vigueur: number;
  agilite: number;
  esprit: number;
  aura: number;
  melee: number;
  tir: number;
  defense: number;
  /** Initiative du PNJ à la pose : malus au jet de réaction des héros s'il est rival ou coriace. */
  initiative: number;
  vitalite_max: number;
  vitalite_courante: number;
  /** Points de vilénie d'un rival (04-pnj-creatures-demons.md) — null pour un coriace ou une piétaille, absent des lignes posées avant. */
  vilenie_courante?: number | null;
  armes: BolFightSessionArmeModel[] | null;
  pnj?: {user_id: string | null; origines: {avatar: string | null}};
}

/** Payload d'envoi pour créer une fight-session (les stats sont snapshotées côté back). */
export interface BolFightSessionCreatePayload {
  titre?: string | null;
  heros: {heroId: string; camp: CombatCamp; resultat?: InitiativeResultat | null}[];
  pnjs: {pnjId: string; camp: CombatCamp}[];
  creatures: {creatureId: string; camp: CombatCamp; qty: number}[];
  demons: {demonId: string; camp: CombatCamp; qty: number}[];
}

/** Payload d'ajout d'un seul combattant à une session déjà lancée. */
export interface BolFightSessionAddCombatantPayload {
  kind: 'hero' | 'pnj' | 'creature' | 'demon';
  sourceId: string;
  camp: CombatCamp;
  qty?: number;
}
