import {PlayToken} from '../../models/combat-play.model';
import {TapisCard} from '../../models/tapis.model';
import {InitiativeTierKey} from '../../models/initiative.model';
import {TurnOrderEntry, TurnOrderGroup} from '../../models/turn-order.model';
import {EtatCombat, TurnStatus, OrderedCard, TurnState, TurnToken} from '../../models/combat-turn.model';

export const INITIAL_ETAT: EtatCombat = {round: 1, joues: [], defense_totale: [], exclus: []};

function uniqueKeys(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return [...new Set(raw.filter((key): key is string => typeof key === 'string' && key !== ''))];
}

/** État valide à partir de ce que renvoie l'API : absent ou mal formé (combat démarré avant que
 * l'état n'existe), il vaut le round 1, personne n'ayant joué. */
export function normalizeEtat(raw: unknown): EtatCombat {
  if (typeof raw !== 'object' || raw === null) {
    return INITIAL_ETAT;
  }

  const source = raw as Record<string, unknown>;
  const round = typeof source['round'] === 'number' && Number.isFinite(source['round']) ? Math.floor(source['round']) : 1;
  return {
    round: Math.max(1, round),
    joues: uniqueKeys(source['joues']),
    defense_totale: uniqueKeys(source['defense_totale']),
    exclus: uniqueKeys(source['exclus']),
  };
}

function cardKeyOf(token: Pick<PlayToken, 'kind' | 'pivotId'>): string {
  return `${token.kind}-${token.pivotId}`;
}

/** Les cartes dans l'ordre de jeu. Par défaut, l'ordre d'initiative des jetons (déjà trié par
 * paliers). L'ordre manuel du MJ passe devant ; ses clés inconnues
 * ou en double sont ignorées, et les cartes qu'il ne cite pas suivent dans l'ordre d'initiative. */
export function orderCards(
  cards: readonly TapisCard[],
  tokens: readonly TurnToken[],
  manualOrder: readonly string[] | null,
): OrderedCard[] {
  const cardByKey = new Map(cards.map((card) => [card.key, card]));
  const byInitiative = new Map<string, OrderedCard>();

  for (const token of tokens) {
    const key = cardKeyOf(token);
    const card = cardByKey.get(key);
    if (card && !byInitiative.has(key)) {
      byInitiative.set(key, {card, tier: token.tier, lockedRound1: token.lockedRound1});
    }
  }
  for (const card of cards) {
    if (!byInitiative.has(card.key)) {
      byInitiative.set(card.key, {card, tier: null, lockedRound1: false});
    }
  }

  const result: OrderedCard[] = [];
  const placed = new Set<string>();
  for (const key of manualOrder ?? []) {
    const entry = byInitiative.get(key);
    if (entry && !placed.has(key)) {
      placed.add(key);
      result.push(entry);
    }
  }
  for (const [key, entry] of byInitiative) {
    if (!placed.has(key)) {
      result.push(entry);
    }
  }
  return result;
}

/** Hors combat : un héros en vitalité négative (mourant) ; un PNJ, une créature ou un démon à 0. Un personnage sans vitalité suivie (maximum nul ou inconnu)
 * n'est jamais hors combat. */
export function isOut(card: TapisCard): boolean {
  if (card.vitaliteMax === null || card.vitaliteMax <= 0) {
    return false;
  }
  if (card.vitaliteCourante === null) {
    return false;
  }
  return card.kind === 'hero' ? card.vitaliteCourante < 0 : card.vitaliteCourante <= 0;
}

function isSkipped(entry: OrderedCard, etat: EtatCombat): boolean {
  return isOut(entry.card) || etat.exclus.includes(entry.card.key) || (etat.round === 1 && entry.lockedRound1);
}

/** Qui joue, et où en est chaque carte : la carte active est la première de l'ordre qui n'a pas
 * joué ce round et n'est pas sautée. */
export function turnState(ordered: readonly OrderedCard[], etat: EtatCombat): TurnState {
  const played = new Set(etat.joues);
  const statuses = new Map<string, TurnStatus>();
  let activeKey: string | null = null;

  for (const entry of ordered) {
    const key = entry.card.key;
    if (isSkipped(entry, etat)) {
      statuses.set(key, 'skipped');
    } else if (played.has(key)) {
      statuses.set(key, 'played');
    } else if (activeKey === null) {
      activeKey = key;
      statuses.set(key, 'active');
    } else {
      statuses.set(key, 'upcoming');
    }
  }

  return {round: etat.round, activeKey, statuses};
}

/** Retire le marqueur de défense totale de la carte qui devient active : il a tenu jusqu'à son tour. */
function liftDefenseOfActive(ordered: readonly OrderedCard[], etat: EtatCombat): EtatCombat {
  const activeKey = turnState(ordered, etat).activeKey;
  if (activeKey === null || !etat.defense_totale.includes(activeKey)) {
    return etat;
  }
  return {...etat, defense_totale: etat.defense_totale.filter((key) => key !== activeKey)};
}

/** « Fin du tour » : la carte active a joué. S'il ne reste personne à jouer ce round, le suivant
 * commence — sauf si personne ne pourrait y jouer non plus (tout le monde est hors combat). */
export function endTurn(ordered: readonly OrderedCard[], etat: EtatCombat): EtatCombat {
  const activeKey = turnState(ordered, etat).activeKey;
  if (activeKey === null) {
    return etat;
  }

  const onTable = new Set(ordered.map((entry) => entry.card.key));
  let next: EtatCombat = {
    ...etat,
    joues: [...etat.joues.filter((key) => onTable.has(key)), activeKey],
    // Une carte qui termine son tour n'emporte pas un marqueur hérité : elle a pu devenir active
    // sans passer par une fin de tour (carte précédente retirée ou tombée), donc sans qu'il soit levé.
    defense_totale: etat.defense_totale.filter((key) => key !== activeKey),
  };

  if (turnState(ordered, next).activeKey === null) {
    const nextRound: EtatCombat = {...next, round: etat.round + 1, joues: []};
    if (turnState(ordered, nextRound).activeKey !== null) {
      next = nextRound;
    }
  }

  return liftDefenseOfActive(ordered, next);
}

/** « Défense totale » : la carte active est marquée, et son tour se termine. Le marqueur tombe
 * quand elle redevient active. */
export function totalDefense(ordered: readonly OrderedCard[], etat: EtatCombat): EtatCombat {
  const activeKey = turnState(ordered, etat).activeKey;
  if (activeKey === null) {
    return etat;
  }

  // Le tour se termine d'abord (ce qui lève tout marqueur hérité), puis le marqueur est posé : il
  // tient jusqu'à ce que la carte redevienne active.
  const ended = endTurn(ordered, etat);
  return {...ended, defense_totale: [...ended.defense_totale.filter((key) => key !== activeKey), activeKey]};
}

/** « Rendre la main » : une carte qui a joué redevient jouable ce round. Son éventuelle défense
 * totale est annulée avec son tour — sinon elle pourrait attaquer en gardant le +2. */
export function giveBackTurn(etat: EtatCombat, key: string): EtatCombat {
  if (!etat.joues.includes(key)) {
    return etat;
  }
  return {
    ...etat,
    joues: etat.joues.filter((played) => played !== key),
    defense_totale: etat.defense_totale.filter((defended) => defended !== key),
  };
}

/** Cartes que la carte active peut désigner d'un clic : le camp d'en face, hors cartes hors combat ou exclues. */
export function targetableKeys(
  ordered: readonly OrderedCard[],
  activeKey: string | null,
  exclus: readonly string[] = [],
): ReadonlySet<string> {
  const active = ordered.find((entry) => entry.card.key === activeKey)?.card;
  if (!active) {
    return new Set();
  }
  return new Set(
    ordered
      .map((entry) => entry.card)
      .filter((card) => card.camp !== active.camp && !isOut(card) && !exclus.includes(card.key))
      .map((card) => card.key),
  );
}

/** Jeton (`PlayToken`) correspondant à une carte, pour en résoudre les stats de combat. */
export function tokenForCard<T extends Pick<PlayToken, 'kind' | 'pivotId'>>(tokens: readonly T[], card: TapisCard): T | null {
  return tokens.find((token) => token.kind === card.kind && token.pivotId === card.pivotId) ?? null;
}

/** Annonce du tour pour les lecteurs d'écran. */
export function turnAnnouncement(ordered: readonly OrderedCard[], etat: EtatCombat): string {
  const activeKey = turnState(ordered, etat).activeKey;
  const active = ordered.find((entry) => entry.card.key === activeKey)?.card;
  return active ? `Round ${etat.round}. À ${active.nom} de jouer.` : `Round ${etat.round}. Plus personne ne peut jouer.`;
}

const FRISE_GROUPS: readonly {id: string; title: string; tiers: readonly (InitiativeTierKey | null)[]}[] = [
  {id: 'heros', title: 'Héros ①②③', tiers: ['legendaire', 'heroique', 'reussite', null]},
  {id: 'rival', title: 'Rivaux ④', tiers: ['rival']},
  {id: 'coriace', title: 'Coriaces ⑤', tiers: ['coriace']},
  {id: 'echec', title: 'Héros en échec ⑥', tiers: ['echec']},
  {id: 'pietaille', title: 'Piétaille ⑦', tiers: ['pietaille']},
  {id: 'echec_critique', title: 'Échec critique ⑧', tiers: ['echec_critique']},
];

/** Regroupe les combattants par rang de réaction, dans l'ordre de BoL (02-actions-combat.md) : héros ayant
 * réussi, rivaux, coriaces, héros en échec, piétaille, échec critique. Un bloc dont tous les membres sont
 * bloqués au round 1 est marqué comme tel. */
export function groupByTier(entries: readonly TurnOrderEntry[]): TurnOrderGroup[] {
  return FRISE_GROUPS.map(({id, title, tiers}) => {
    const members = entries.filter((entry) => tiers.includes(entry.tier));
    return {id, title, entries: members, blocked: members.length > 0 && members.every((entry) => entry.locked)};
  });
}
