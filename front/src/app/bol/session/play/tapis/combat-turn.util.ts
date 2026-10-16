import {PlayToken} from '../../models/combat-play.model';
import {TapisCard} from '../../models/tapis.model';
import {InitiativeTierKey} from '../../models/initiative.model';
import {TurnOrderEntry, TurnOrderGroup} from '../../models/turn-order.model';
import {CombatEffect, NewEffect} from '../../models/combat-effect.model';
import {CombatOutcome, EtatCombat, TurnStatus, OrderedCard, TurnState, TurnToken} from '../../models/combat-turn.model';
import {aAssomme, appliquerEvenement, aStabilise, EffectIdGenerator, effetsDeLAncienFormat, effetsDeTour, nextEffectId, normalizeEffets, SANS_BOUCLIER} from './combat-effects.util';

export const INITIAL_ETAT: EtatCombat = {round: 1, joues: [], effets: [], exclus: [], depart: {}};

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
    depart: departOf(source['depart']),
  };
}

/** Vitalités de départ bien formées (clé de carte → entier) ; un tableau vide (PHP) ou une valeur mal formée donne `{}`. */
function departOf(raw: unknown): Readonly<Record<string, number>> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return {};
  }
  return Object.fromEntries(Object.entries(raw).filter((entry): entry is [string, number] => entry[0] !== '' && Number.isInteger(entry[1])));
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

/** Hors combat : tout personnage à 0 de vitalité ou moins (02-actions-combat.md, « Blessures, inconscience et mort »). Un héros à 0
 * s'effondre, et au round suivant il sombre dans l'inconscience ou dépense 1 PH pour reprendre ses esprits ; en dessous, il est mourant.
 * Un personnage sans vitalité suivie (maximum nul ou inconnu) n'est jamais hors combat. */
export function isOut(card: TapisCard): boolean {
  return horsCombat(card) !== null;
}

/** L'issue du combat, dès qu'un camp n'a plus personne debout (hors de combat ou retiré du combat) : plus personne en face à viser.
 * `victoire` si ce sont les adversaires, `defaite` si ce sont les héros et leurs alliés ; `null` tant que les deux camps tiennent. */
export function combatOutcome(cards: readonly TapisCard[], exclus: readonly string[]): CombatOutcome | null {
  const standing = (camp: TapisCard['camp']): boolean => cards.some((card) => card.camp === camp && !exclus.includes(card.key) && !isOut(card));
  if (!standing('adversaires')) {
    return 'victoire';
  }
  return standing('heros') ? null : 'defaite';
}

/** Pourquoi une carte est hors combat, en clair : un héros est inconscient à 0 (assommé, si c'est une bagarre), mourant de −1 à −5,
 * mort à −6 ou moins — stabilisé sous 0 s'il porte l'effet ; un PNJ, une créature ou un démon est hors de combat dès 0. `null` pour une carte qui joue. */
export function horsCombat(card: TapisCard, effets: readonly CombatEffect[] = []): 'inconscient' | 'assommé' | 'mourant' | 'stabilisé' | 'mort' | 'hors de combat' | null {
  const vitalite = card.vitaliteCourante;
  if (card.vitaliteMax === null || card.vitaliteMax <= 0 || vitalite === null || vitalite > 0) {
    return null;
  }
  if (card.kind !== 'hero') {
    return 'hors de combat';
  }
  if (vitalite === 0) {
    return aAssomme(effets, card.key) ? 'assommé' : 'inconscient';
  }
  return aStabilise(effets, card.key) ? 'stabilisé' : vitalite >= -5 ? 'mourant' : 'mort';
}

/** Les héros qui perdent 1 de vitalité au début d'un round (02-actions-combat.md, « Blessures, inconscience et mort ») : mourants
 * (−1 à −5), ni stabilisés ni retirés du combat. */
export function herosMourants(cards: readonly TapisCard[], etat: EtatCombat): readonly TapisCard[] {
  return cards.filter((card) => !etat.exclus.includes(card.key) && horsCombat(card, etat.effets) === 'mourant');
}

/** La règle du premier round (coriaces et piétaille face à un succès héroïque, héros en échec critique) ne bloque qu'au round 1 :
 * à partir du round 2, ces cartes jouent comme les autres, et la frise ne doit plus les montrer bloquées. */
export function bloqueeCeRound(lockedRound1: boolean, round: number): boolean {
  return round === 1 && lockedRound1;
}

function isSkipped(entry: OrderedCard, etat: EtatCombat): boolean {
  return isOut(entry.card) || etat.exclus.includes(entry.card.key) || bloqueeCeRound(entry.lockedRound1, etat.round);
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
export function endTurn(ordered: readonly OrderedCard[], etat: EtatCombat, crees: readonly NewEffect[] = [], genererId: EffectIdGenerator = nextEffectId): EtatCombat {
  const activeKey = turnState(ordered, etat).activeKey;
  if (activeKey === null) {
    return etat;
  }

  const onTable = new Set(ordered.map((entry) => entry.card.key));
  let next: EtatCombat = {
    ...etat,
    joues: [...etat.joues.filter((key) => onTable.has(key)), activeKey],
    effets: appliquerEvenement(etat.effets, {type: 'fin-tour', carte: activeKey, crees}, genererId),
  };

  if (turnState(ordered, next).activeKey === null) {
    const nextRound: EtatCombat = {...next, round: etat.round + 1, joues: [], effets: appliquerEvenement(next.effets, {type: 'nouveau-round'})};
    if (turnState(ordered, nextRound).activeKey !== null) {
      next = nextRound;
    }
  }

  const nowActive = turnState(ordered, next).activeKey;
  return nowActive === null ? next : debutDeTour(next, nowActive);
}

/** Le tour d'une carte commence : ses effets « jusqu'à son prochain tour » tombent. Rend le même état s'il n'y en a aucun, pour que rien ne soit
 * enregistré pour rien. */
export function debutDeTour(etat: EtatCombat, carte: string): EtatCombat {
  const effets = appliquerEvenement(etat.effets, {type: 'debut-tour', carte});
  return effets.length === etat.effets.length ? etat : {...etat, effets};
}

/** Effets qui ne se stockent pas mais se déduisent de l'état : la perte du bouclier d'un héros en échec critique au premier round. Leur
 * identifiant commence par `derive-` : ils s'affichent, sans croix pour les retirer. */
export function effetsDerives(ordered: readonly OrderedCard[], round: number): CombatEffect[] {
  return ordered
    .filter((entry) => bouclierPerduRound1(round, entry.tier))
    .map((entry) => ({id: `derive-${entry.card.key}`, origine: SANS_BOUCLIER, porteur: entry.card.key, stat: 'defense', valeur: 0, quand: 'subie', duree: {type: 'fin-round'}, manuel: false}));
}

/** « Défense totale » : la carte active termine son tour avec +2 en défense, jusqu'à ce qu'elle redevienne active. */
export function totalDefense(ordered: readonly OrderedCard[], etat: EtatCombat, genererId: EffectIdGenerator = nextEffectId): EtatCombat {
  const activeKey = turnState(ordered, etat).activeKey;
  if (activeKey === null) {
    return etat;
  }
  return endTurn(ordered, etat, effetsDeTour(activeKey, {posture: null, defenseTotale: true}), genererId);
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
    effets: etat.effets.filter((effet) => !(effet.porteur === key && (effet.duree.type === 'debut-tour-porteur' || (effet.duree.type === 'usages' && effet.duree.expireAuTour === true)))),
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
