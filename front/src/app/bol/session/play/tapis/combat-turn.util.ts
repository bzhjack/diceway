import {PlayToken} from '../../models/combat-play.model';
import {TapisCard} from '../../models/tapis.model';
import {InitiativeTierKey} from '../../models/initiative.model';
import {TurnOrderEntry, TurnOrderGroup} from '../../models/turn-order.model';
import {NewEffect} from '../../models/combat-effect.model';
import {EtatCombat, TurnStatus, OrderedCard, TurnState, TurnToken} from '../../models/combat-turn.model';
import {appliquerEvenement, effetsDeLAncienFormat, effetsDeTour, normalizeEffets} from './combat-effects.util';

export const INITIAL_ETAT: EtatCombat = {round: 1, joues: [], effets: [], exclus: []};

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
    effets: 'effets' in source ? normalizeEffets(source['effets']) : effetsDeLAncienFormat(source),
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

/** « Fin du tour » : la carte active a joué, et ses effets durables naissent (`crees`). S'il ne reste personne à jouer ce round, le suivant
 * commence — sauf si personne ne pourrait y jouer non plus (tout le monde est hors combat). La carte qui devient active voit tomber
 * ses effets « jusqu'à son prochain tour ». */
export function endTurn(ordered: readonly OrderedCard[], etat: EtatCombat, crees: readonly NewEffect[] = []): EtatCombat {
  const activeKey = turnState(ordered, etat).activeKey;
  if (activeKey === null) {
    return etat;
  }

  const onTable = new Set(ordered.map((entry) => entry.card.key));
  let next: EtatCombat = {
    ...etat,
    joues: [...etat.joues.filter((key) => onTable.has(key)), activeKey],
    effets: appliquerEvenement(etat.effets, {type: 'fin-tour', carte: activeKey, crees}),
  };

  if (turnState(ordered, next).activeKey === null) {
    const nextRound: EtatCombat = {...next, round: etat.round + 1, joues: [], effets: appliquerEvenement(next.effets, {type: 'nouveau-round'})};
    if (turnState(ordered, nextRound).activeKey !== null) {
      next = nextRound;
    }
  }

  const nowActive = turnState(ordered, next).activeKey;
  return nowActive === null ? next : {...next, effets: appliquerEvenement(next.effets, {type: 'debut-tour', carte: nowActive})};
}

/** « Défense totale » : la carte active termine son tour avec +2 en défense, jusqu'à ce qu'elle redevienne active. */
export function totalDefense(ordered: readonly OrderedCard[], etat: EtatCombat): EtatCombat {
  const activeKey = turnState(ordered, etat).activeKey;
  if (activeKey === null) {
    return etat;
  }
  return endTurn(ordered, etat, effetsDeTour(activeKey, {posture: null, defenseTotale: true}));
}

/** « Rendre la main » : une carte qui a joué redevient jouable ce round. Ce que son tour avait fait naître (défense totale, posture) est
 * annulé avec lui — sinon elle pourrait attaquer en gardant le +2. */
export function giveBackTurn(etat: EtatCombat, key: string): EtatCombat {
  if (!etat.joues.includes(key)) {
    return etat;
  }
  return {
    ...etat,
    joues: etat.joues.filter((played) => played !== key),
    effets: etat.effets.filter((effet) => !(effet.porteur === key && effet.duree.type === 'debut-tour-porteur')),
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

/** Règle de réaction : un héros en échec critique ne bénéficie pas de son bouclier en défense pendant le premier round
 * (02-actions-combat.md). Dérivée du palier de réaction et du round, sans effet stocké : aucun événement n'existe au démarrage du combat. */
export function bouclierPerduRound1(round: number, tier: InitiativeTierKey | null): boolean {
  return round === 1 && tier === 'echec_critique';
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
  {id: 'heros', title: 'Héros', tiers: ['legendaire', 'heroique', 'reussite', null]},
  {id: 'rival', title: 'Rivaux', tiers: ['rival']},
  {id: 'coriace', title: 'Coriaces', tiers: ['coriace']},
  {id: 'echec', title: 'Héros en échec', tiers: ['echec']},
  {id: 'pietaille', title: 'Piétaille', tiers: ['pietaille']},
  {id: 'echec_critique', title: 'Échec critique', tiers: ['echec_critique']},
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
