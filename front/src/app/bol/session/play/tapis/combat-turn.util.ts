import {PlayToken} from '../../models/combat-play.model';
import {TapisCard} from '../../models/tapis.model';
import {InitiativeTierKey} from '../../models/initiative.model';
import {TurnOrderEntry, TurnOrderGroup} from '../../models/turn-order.model';
import {OrdreFriseStep, OrdreFriseTone} from '../../models/ordre-frise.model';
import {usableAvatar} from '../../../../shared/avatar-fallback/avatar.util';
import {CombatEffect, EffectIdGenerator, NewEffect} from '../../models/combat-effect.model';
import {CombatOutcome, EtatCombat, TurnStatus, OrderedCard, TurnState, TurnToken} from '../../models/combat-turn.model';
import {aAssomme, appliquerEvenement, aStabilise, aUneTraceDeChute, differerActionPerdue, effetActionSautee, effetsDeLAncienFormat, effetsDeTour, effetTourSauteParalyse, estParalyse, nextEffectId, normalizeEffets, perdSonAction, redifererActionsPerdues, SANS_BOUCLIER, sansActionPerdue} from './combat-effects.util';

export const INITIAL_ETAT: EtatCombat = {round: 1, joues: [], effets: [], exclus: [], depart: {}, fuis: [], melee: null};

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
  const fuis = uniqueKeys(source['fuis']);
  const melee = source['melee'];
  return {
    round: Math.max(1, round),
    joues: uniqueKeys(source['joues']),
    effets: 'effets' in source ? normalizeEffets(source['effets']) : effetsDeLAncienFormat(source),
    // Un rival enfui reste exclu du combat.
    exclus: uniqueKeys([...uniqueKeys(source['exclus']), ...fuis]),
    depart: departOf(source['depart']),
    fuis,
    melee: Number.isInteger(melee) && (melee as number) >= 1 ? (melee as number) : null,
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

/** Une carte qui tient debout : ni hors de combat, ni paralysée (le poison d'un démon : elle ne jouera plus de ce combat, sauf si le MJ
 * retire l'effet). */
export function tientDebout(card: TapisCard, effets: readonly CombatEffect[]): boolean {
  return !isOut(card) && !estParalyse(effets, card.key);
}

/** L'issue du combat, dès qu'un camp n'a plus personne debout (hors de combat, paralysé ou retiré du combat) : plus personne en face à
 * viser. `victoire` si ce sont les adversaires, `defaite` si ce sont les héros et leurs alliés ; `null` tant que les deux camps tiennent. */
export function combatOutcome(cards: readonly TapisCard[], exclus: readonly string[], effets: readonly CombatEffect[] = []): CombatOutcome | null {
  const standing = (camp: TapisCard['camp']): boolean => cards.some((card) => card.camp === camp && !exclus.includes(card.key) && tientDebout(card, effets));
  if (!standing('adversaires')) {
    return 'victoire';
  }
  return standing('heros') ? null : 'defaite';
}

/** Pourquoi une carte est hors combat, en clair : un héros est inconscient à 0 (assommé, si c'est une bagarre), mourant de −1 à −5,
 * mort à −6 ou moins — stabilisé sous 0 s'il porte l'effet ; un PNJ, une créature ou un démon est hors de combat dès 0, un mort-vivant
 * « détruit » (sa force vitale épuisée, il retourne à la mort). `null` pour une carte qui joue. */
export function horsCombat(card: TapisCard, effets: readonly CombatEffect[] = []): 'inconscient' | 'assommé' | 'mourant' | 'stabilisé' | 'mort' | 'hors de combat' | 'détruit' | null {
  const vitalite = card.vitaliteCourante;
  if (card.vitaliteMax === null || card.vitaliteMax <= 0 || vitalite === null || vitalite > 0) {
    return null;
  }
  if (card.kind !== 'hero') {
    return card.mortVivant ? 'détruit' : 'hors de combat';
  }
  if (vitalite === 0) {
    return aAssomme(effets, card.key) ? 'assommé' : 'inconscient';
  }
  return aStabilise(effets, card.key) ? 'stabilisé' : vitalite >= -5 ? 'mourant' : 'mort';
}

/** Pourquoi une carte ne joue plus, pour la frise : « enfui » pour un rival qui a pris la fuite (« Fuite opportune »), « retiré » pour une
 * carte que le MJ a retirée du combat (ou laissée hors du combat au démarrage), sinon la raison de `horsCombat`, sinon « paralysé » pour
 * une carte debout que le poison d'un démon paralyse ; `null` pour une carte qui joue. */
export function raisonHorsJeu(card: TapisCard, etat: EtatCombat): ReturnType<typeof horsCombat> | 'enfui' | 'retiré' | 'paralysé' {
  if (etat.fuis.includes(card.key)) {
    return 'enfui';
  }
  if (etat.exclus.includes(card.key)) {
    return 'retiré';
  }
  return horsCombat(card, etat.effets) ?? (estParalyse(etat.effets, card.key) ? 'paralysé' : null);
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

/** Une carte sautée : hors combat, exclue, bloquée au round 1, ou paralysée (jusqu'à ce que le MJ retire l'effet ; son tour, quand il
 * passe, est compté comme joué : `passerLesParalyses`). */
function isSkipped(entry: OrderedCard, etat: EtatCombat): boolean {
  return isOut(entry.card) || etat.exclus.includes(entry.card.key) || bloqueeCeRound(entry.lockedRound1, etat.round) || estParalyse(etat.effets, entry.card.key);
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

/** « Fin du tour » : la carte active a joué, et ses effets durables naissent (`crees`). Les piétailles engagées avec elle dans une
 * attaque de horde (`horde`) ont joué aussi : leur tour commence et finit avec le sien. S'il ne reste personne à jouer ce round, le
 * suivant commence — sauf si personne ne pourrait y jouer non plus (tout le monde est hors combat). La carte qui devient active voit
 * tomber ses effets « jusqu'à son prochain tour ». */
export function endTurn(
  ordered: readonly OrderedCard[],
  etat: EtatCombat,
  crees: readonly NewEffect[] = [],
  genererId: EffectIdGenerator = nextEffectId,
  horde: readonly string[] = [],
): EtatCombat {
  const state = turnState(ordered, etat);
  const activeKey = state.activeKey;
  if (activeKey === null) {
    return etat;
  }

  // Seules comptent les piétailles qui avaient encore à jouer ce round.
  const engagees = horde.filter((key) => key !== activeKey && state.statuses.get(key) === 'upcoming');
  const onTable = new Set(ordered.map((entry) => entry.card.key));
  let effets = appliquerEvenement(etat.effets, {type: 'fin-tour', carte: activeKey, crees}, genererId);
  for (const key of engagees) {
    effets = appliquerEvenement(appliquerEvenement(effets, {type: 'debut-tour', carte: key}), {type: 'fin-tour', carte: key, crees: []}, genererId);
  }
  const next: EtatCombat = {
    ...etat,
    joues: [...etat.joues.filter((key) => onTable.has(key)), activeKey, ...engagees],
    effets,
  };
  return commencerTour(ordered, next, genererId, true);
}

/** S'il ne reste personne à jouer ce round, le suivant commence — sauf si personne ne pourrait y jouer non plus (tout le monde est hors
 * combat). */
function roundSuivantSiFini(ordered: readonly OrderedCard[], etat: EtatCombat): EtatCombat {
  if (turnState(ordered, etat).activeKey !== null) {
    return etat;
  }
  const nextRound: EtatCombat = {...etat, round: etat.round + 1, joues: [], effets: appliquerEvenement(etat.effets, {type: 'nouveau-round'})};
  return turnState(ordered, nextRound).activeKey !== null ? nextRound : etat;
}

/** Le tour de la carte active commence : ses effets « jusqu'à son prochain tour » tombent. Si elle a perdu son action (« Juste une
 * égratignure »), son tour est sauté d'office : l'action perdue est consommée, une trace le dit sur la frise jusqu'à son prochain tour, et
 * la main passe à la suivante (au round suivant s'il le faut). Le tour des cartes paralysées passées avant elle est sauté et compté
 * (`passerLesParalyses`). `finDeTour` : appelé par la fin d'un tour, il commence le round suivant s'il ne reste personne à jouer. Rend
 * le même état s'il n'y a rien à changer. */
export function commencerTour(ordered: readonly OrderedCard[], etat: EtatCombat, genererId: EffectIdGenerator = nextEffectId, finDeTour = false): EtatCombat {
  let courant = etat;
  let roundSuivant = finDeTour;
  // Chaque saut consomme une action perdue, chaque carte paralysée ne passe qu'une fois par round, et un round ne commence que si
  // quelqu'un peut y jouer : la boucle s'arrête vite.
  for (let garde = 0; garde <= ordered.length * 2 + 2; garde++) {
    courant = passerLesParalyses(ordered, courant, genererId);
    const active = turnState(ordered, courant).activeKey;
    if (active === null) {
      const suivant = roundSuivant ? roundSuivantSiFini(ordered, courant) : courant;
      if (suivant === courant) {
        return courant;
      }
      courant = suivant;
      continue;
    }
    const debut = debutDeTour(courant, active);
    if (!perdSonAction(debut.effets, active)) {
      return debut;
    }
    const effets = sansActionPerdue(debut.effets, active);
    courant = {
      ...debut,
      joues: [...debut.joues, active],
      effets: [...effets, {...effetActionSautee(active), id: genererId(effets)}],
    };
    roundSuivant = true;
  }
  return courant;
}

/** Le tour d'une carte paralysée est passé quand la main va à une carte placée après elle dans l'ordre, ou quand le round s'achève : elle
 * compte comme ayant joué ce round (sa paralysie levée en plein round ne lui rend la main qu'au round suivant), ses effets « jusqu'à son
 * prochain tour » tombent, et une trace le dit sur la frise. Ce tour sauté est une action perdue : celle qu'elle devait (« Juste une
 * égratignure ») est consommée avec lui, et ne lui coûtera pas le tour qui suit sa libération. Sa paralysie reste, ainsi que ses autres
 * effets « à sa prochaine action » (dé de malus). Rend le même état s'il n'y a rien à changer. */
function passerLesParalyses(ordered: readonly OrderedCard[], etat: EtatCombat, genererId: EffectIdGenerator): EtatCombat {
  const activeKey = turnState(ordered, etat).activeKey;
  const avant = activeKey === null ? ordered : ordered.slice(0, ordered.findIndex((entry) => entry.card.key === activeKey));
  const passees = avant
    .filter(
      (entry) =>
        estParalyse(etat.effets, entry.card.key) &&
        !etat.joues.includes(entry.card.key) &&
        !isOut(entry.card) &&
        !etat.exclus.includes(entry.card.key) &&
        !bloqueeCeRound(entry.lockedRound1, etat.round),
    )
    .map((entry) => entry.card.key);
  if (passees.length === 0) {
    return etat;
  }
  const effets = passees.reduce<readonly CombatEffect[]>((liste, key) => {
    const sansTour = sansActionPerdue(appliquerEvenement(liste, {type: 'debut-tour', carte: key}), key);
    return [...sansTour, {...effetTourSauteParalyse(key), id: genererId(sansTour)}];
  }, etat.effets);
  return {...etat, joues: [...etat.joues, ...passees], effets};
}

/** Le MJ pose un effet à la main. « Perd sa prochaine action » posé sur la carte dont c'est le tour vise son prochain tour, pas celui
 * qu'elle joue : il est différé (`differerActionPerdue`), et ni ce tour ni la page rechargée, qui le recommence (`commencerTour`), ne le
 * consomment. Posé sur une autre carte (un coup, « Juste une égratignure »), il lui fait sauter son prochain tour. */
export function poserEffet(ordered: readonly OrderedCard[], etat: EtatCombat, effet: NewEffect, genererId: EffectIdGenerator = nextEffectId): EtatCombat {
  const pose = effet.porteur === turnState(ordered, etat).activeKey ? differerActionPerdue(effet) : effet;
  return {...etat, effets: [...appliquerEvenement(etat.effets, {type: 'ajout-manuel', effet: pose}, genererId)]};
}

/** « Retirer du combat » : le MJ sort une carte du combat. Elle reste sur la table, mais ne joue plus, ne se vise plus et ne compte plus
 * pour l'issue (`exclus`) ; la frise la dit « retirée ». Les effets qu'elle porte ou qui la visent tombent avec elle. */
export function retirerDuCombat(etat: EtatCombat, key: string): EtatCombat {
  if (etat.exclus.includes(key)) {
    return etat;
  }
  return {...etat, exclus: [...etat.exclus, key], effets: appliquerEvenement(etat.effets, {type: 'carte-retiree', carte: key})};
}

/** Les cartes relevées : leur vitalité repasse au-dessus de 0 alors qu'elles étaient à 0 ou moins (`avant` : la vitalité vue
 * précédemment, par clé), et elles portent une trace de chute (sombré, stabilisé, assommé) à oublier. Une carte vue pour la première fois
 * debout avec une trace (table d'avant cette règle) l'est aussi. Une carte encore debout, dont la trace vient d'être posée avant que sa
 * vitalité ne suive, ne l'est pas. */
export function cartesRelevees(avant: ReadonlyMap<string, number>, cards: readonly TapisCard[], effets: readonly CombatEffect[]): readonly string[] {
  return cards
    .filter((card) => {
      if (card.vitaliteCourante === null || card.vitaliteCourante <= 0 || !aUneTraceDeChute(effets, card.key)) {
        return false;
      }
      const precedente = avant.get(card.key);
      return precedente === undefined || precedente <= 0;
    })
    .map((card) => card.key);
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

/** Rang en clair d'une carte de piétaille (`TapisCard.rang`). */
export const PIETAILLE = 'Piétaille';

/** Les piétailles qui peuvent se joindre à l'attaque de la carte active, quand elle-même est une piétaille : celles de son camp qui
 * n'ont pas encore joué ce round et peuvent jouer (04-pnj-creatures-demons.md, « Règle de horde » ; livre p. 132), sauf celles qui ont
 * perdu leur action : leur tour sera sauté. Vide sinon. */
export function hordeMates(ordered: readonly OrderedCard[], etat: EtatCombat): readonly TapisCard[] {
  const state = turnState(ordered, etat);
  const active = ordered.find((entry) => entry.card.key === state.activeKey)?.card;
  if (!active || active.rang !== PIETAILLE) {
    return [];
  }
  return ordered
    .map((entry) => entry.card)
    .filter((card) => card.rang === PIETAILLE && card.camp === active.camp && state.statuses.get(card.key) === 'upcoming' && !perdSonAction(etat.effets, card.key));
}

/** « Défense totale » : la carte active termine son tour avec +2 en défense, jusqu'à ce qu'elle redevienne active. Elle se cumule avec la
 * parade du combat à deux armes (`parade`, 02-actions-combat.md). */
export function totalDefense(ordered: readonly OrderedCard[], etat: EtatCombat, genererId: EffectIdGenerator = nextEffectId, parade = false): EtatCombat {
  const activeKey = turnState(ordered, etat).activeKey;
  if (activeKey === null) {
    return etat;
  }
  return endTurn(ordered, etat, effetsDeTour(activeKey, {posture: null, special: parade ? 'dual-parry' : null, defenseTotale: true}), genererId);
}

/** « Rendre la main » : une carte qui a joué redevient jouable ce round. Ce que son tour avait fait naître (défense totale, posture) est
 * annulé avec lui — sinon elle pourrait attaquer en gardant le +2. « Perd sa prochaine action », posé pendant ce tour et armé à sa fin,
 * vise de nouveau le tour d'après (`redifererActionsPerdues`) : le tour rouvert n'est pas sauté. */
export function giveBackTurn(etat: EtatCombat, key: string): EtatCombat {
  if (!etat.joues.includes(key)) {
    return etat;
  }
  return {
    ...etat,
    joues: etat.joues.filter((played) => played !== key),
    effets: redifererActionsPerdues(
      etat.effets.filter((effet) => !(effet.porteur === key && (effet.duree.type === 'debut-tour-porteur' || (effet.duree.type === 'usages' && effet.duree.expireAuTour === true)))),
      key,
    ),
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

/** La cible présélectionnée quand un adversaire prend la main : un héros au hasard parmi ceux qu'il peut viser, ou, s'il n'en reste
 * aucun, un allié des héros. Une carte du camp des héros n'en reçoit pas (le joueur choisit sa cible). `random` rend un nombre de
 * [0, 1[ (`Math.random`). */
export function cibleAuHasard(active: TapisCard | null, cibles: readonly TapisCard[], random: () => number = Math.random): TapisCard | null {
  if (!active || active.camp === 'heros' || cibles.length === 0) {
    return null;
  }
  const heros = cibles.filter((card) => card.kind === 'hero');
  const candidats = heros.length > 0 ? heros : cibles;
  return candidats[Math.floor(random() * candidats.length)] ?? null;
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

const TURN_STATUS_LABELS: Record<TurnStatus, string> = {
  active: 'joue maintenant',
  played: 'a joué',
  skipped: 'ne joue pas ce round',
  upcoming: 'à venir',
};

/** Le rang d'un héros donne la couleur de son anneau dans la frise ; sans rang, il n'a pas encore lancé. */
const HERO_TONES: Partial<Record<InitiativeTierKey, OrdreFriseTone>> = {
  legendaire: 'legendaire',
  heroique: 'heroique',
  reussite: 'reussite',
  echec: 'echec',
  echec_critique: 'echec_critique',
};

/** L'ordre d'action de la table en combat, en médaillons de la frise commune : rang après rang de réaction (`groupByTier`), un trait
 * long entre deux rangs. L'anneau dit le résultat d'un héros, ou le camp des autres. Un médaillon « a joué » se clique pour lui rendre
 * la main. */
export function turnOrderFrise(entries: readonly TurnOrderEntry[], targetKey: string | null): readonly OrdreFriseStep[] {
  const groups = groupByTier(entries).filter((group) => group.entries.length > 0);
  return groups.flatMap((group, groupIndex) =>
    group.entries.map((entry, index): OrdreFriseStep => {
      const hero = entry.kind === 'hero';
      const target = entry.key === targetKey;
      const etat = `${TURN_STATUS_LABELS[entry.status]}${entry.locked ? ', bloqué ce round' : ''}`;
      const label = `${entry.nom}${entry.ally ? ' (allié)' : ''}, ${group.title.toLowerCase()}, ${etat}${entry.horsCombat ? ', ' + entry.horsCombat : ''}${target ? ', visé' : ''}`;
      const tooltip = [
        entry.nom + (entry.ally ? ' (allié des héros)' : ''),
        entry.horsCombat,
        entry.effets.length ? entry.effets.join(', ') : null,
        entry.status === 'played' ? 'cliquer pour lui rendre la main' : null,
      ];
      return {
        key: entry.key,
        nom: entry.nom,
        avatar: usableAvatar(entry.avatar),
        hero,
        tone: hero ? ((entry.tier && HERO_TONES[entry.tier]) ?? 'attente') : entry.ally ? 'allie' : 'adversaire',
        label,
        tooltip: tooltip.filter((part) => part).join(' — '),
        link: index < group.entries.length - 1 ? 'court' : groupIndex < groups.length - 1 ? 'long' : null,
        blocked: entry.locked,
        clickable: entry.status === 'played',
        pressed: null,
        status: entry.status,
        target,
        down: entry.horsCombat !== null,
        effects: entry.effets.length > 0,
        excluded: false,
      };
    }),
  );
}
