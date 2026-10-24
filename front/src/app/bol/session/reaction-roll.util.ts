import {InitiativeResultat} from '../models/bol-fight-session.model';
import {actionDiceTarget, actionResultTone, netDiceModifier} from './action-roll.util';
import {RollSumTerm} from './models/action-roll.model';
import {HeroDetailTrait} from './models/tapis.model';
import {ReactionAdversary, ReactionHero, ReactionLane, ReactionParts, ReactionToken, ReactionVerdict} from './models/start-combat-dialog.model';

/** Seuil de réussite du jet de réaction BoL (02-actions-combat.md) — fixe, jamais modifié par les règles. */
export const REACTION_ROLL_THRESHOLD = 9;

/** Les traits qui changent le nombre de dés du jet de réaction (livre, « Avantages » et « Désavantages ») : « Vigilant » donne un dé de
 * bonus, « Lent à la détente » un dé de malus. */
const REACTION_BONUS_TRAIT = 'vigilant';
const REACTION_MALUS_TRAIT = 'lent à la détente';

/** Dés de bonus (positif) ou de malus (négatif) d'un héros à son jet de réaction, d'après ses avantages et désavantages : on lance
 * 2 + |n| dés et on garde les deux meilleurs (bonus) ou les deux moins bons (malus). Un dé de bonus et un dé de malus s'annulent. */
export function reactionDiceNet(traits: readonly HeroDetailTrait[]): number {
  const named = (kind: 'avantage' | 'desavantage', label: string): number =>
    traits.filter((trait) => trait.kind === kind && trait.label.trim().toLowerCase() === label).length;
  return netDiceModifier(named('avantage', REACTION_BONUS_TRAIT), named('desavantage', REACTION_MALUS_TRAIT));
}

/** Ce qui s'ajoute aux deux dés : esprit + initiative + embuscade − initiative ennemie + carrière utile. */
export function reactionModifier(parts: ReactionParts): number {
  return parts.esprit + parts.initiative + parts.embuscade - parts.initiativeEnnemie + (parts.carriere?.value ?? 0);
}

/** Résultat d'un jet de réaction d'après le total des deux dés. Le double 1 et le double 6 priment sur le seuil ; `heroisme` dit si le
 * héros a retenu l'option d'héroïsme qu'ils ouvrent : l'échec critique (qui rapporte 1 point) sur un double 1, le succès légendaire
 * (qui en coûte 1) sur un double 6. Un double 6 qui était le seul moyen de réussir n'est qu'une réussite (livre p. 56) : ni héroïque,
 * ni légendaire. */
export function reactionResult(dice: number, modifier: number, heroisme = false): InitiativeResultat {
  if (dice === 2) {
    return heroisme ? 'echec_critique' : 'echec';
  }
  if (dice === 12) {
    if (actionDiceTarget(modifier, REACTION_ROLL_THRESHOLD).kind === 'double-six') {
      return 'reussite';
    }
    return heroisme ? 'legendaire' : 'heroique';
  }
  return dice + modifier >= REACTION_ROLL_THRESHOLD ? 'reussite' : 'echec';
}

/** Titre de chaque résultat, et ce qu'il change au combat (02-actions-combat.md, « Jet de réaction »). */
const VERDICTS: Record<InitiativeResultat, readonly [title: string, detail: string]> = {
  reussite: ['Réussite', 'Agit avant tous les adversaires.'],
  echec: ['Échec', 'Agit après les coriaces, avant la piétaille.'],
  heroique: ['Succès héroïque', 'Au round 1, coriaces et piétaille ne jouent pas.'],
  legendaire: ['Succès légendaire', 'Héroïque, et +1 à ses jets d’attaque pendant tout le combat.'],
  echec_critique: ['Échec critique', 'Agit en dernier. Au round 1, reste interdit et sans bouclier.'],
};

/** Le verdict d'un jet de réaction. `dice` est le total des deux dés : un double 1 dont l'échec critique n'a pas été retenu reste
 * un échec, mais on rappelle d'où il vient ; un succès héroïque vient d'un double 6, ou d'une réussite convertie pour 1 point
 * d'héroïsme. */
export function reactionVerdict(result: InitiativeResultat, dice: number | null): ReactionVerdict {
  const [title, detail] = VERDICTS[result];
  const origine = result === 'echec' && dice === 2 ? 'Double 1. ' : result === 'heroique' ? (dice === 12 ? 'Double 6. ' : 'Pour 1 point d’héroïsme. ') : '';
  return {title, detail: origine + detail, tone: actionResultTone(result)};
}

/** L'addition du jet de réaction, sur une ligne : un nombre par terme, son nom dessous. Les termes nuls sont omis. Avant le jet, elle
 * s'ouvre sur « 2d6 » (« 3d6 » avec un dé de bonus ou de malus) et se ferme sur le seuil ; après, sur le total des deux dés gardés et le
 * total du jet. `diceNet` : dés de bonus (positif) ou de malus (négatif), rappelés sous le terme des dés. */
export function reactionSumTerms(dice: number | null, parts: ReactionParts, diceNet = 0): readonly RollSumTerm[] {
  const named: readonly (readonly [value: number, caption: string])[] = [
    [parts.esprit, 'esprit'],
    [parts.initiative - (parts.equipement ?? 0), 'init.'],
    [parts.equipement ?? 0, 'équipement'],
    [parts.carriere?.value ?? 0, parts.carriere?.label.toLowerCase() ?? ''],
    [parts.embuscade, parts.embuscade > 0 ? 'embusc.' : 'surpris'],
    [-parts.initiativeEnnemie, 'ennemi'],
  ];
  return [
    {
      value: dice === null ? `${2 + Math.abs(diceNet)}d6` : `${dice}`,
      caption: diceNet > 0 ? 'dés · bonus' : diceNet < 0 ? 'dés · malus' : 'dés',
      tone: 'dice',
    },
    ...named
      .filter(([value]) => value !== 0)
      .map(([value, caption]): RollSumTerm => ({value: `${value > 0 ? '+' : '−'}${Math.abs(value)}`, caption, tone: value > 0 ? 'plus' : 'minus'})),
    dice === null
      ? {value: `≥ ${REACTION_ROLL_THRESHOLD}`, caption: 'seuil', tone: 'total'}
      : {value: `= ${dice + reactionModifier(parts)}`, caption: `pour ${REACTION_ROLL_THRESHOLD}`, tone: 'total'},
  ];
}

/** Bloc de l'ordre d'action où tombe chaque résultat de héros : les trois réussites partagent le premier. */
const HERO_LANE: Record<InitiativeResultat, 'heros' | 'echec' | 'echec_critique'> = {
  legendaire: 'heros',
  heroique: 'heros',
  reussite: 'heros',
  echec: 'echec',
  echec_critique: 'echec_critique',
};

/** Dans le premier bloc, le succès légendaire agit avant l'héroïque, qui agit avant la simple réussite. */
const HERO_RANK: Partial<Record<InitiativeResultat, number>> = {legendaire: 0, heroique: 1, reussite: 2};
const HERO_RANK_WORD: Partial<Record<InitiativeResultat, string>> = {legendaire: 'légendaire', heroique: 'héroïque'};

/** L'ordre d'action tel qu'il se dessine (02-actions-combat.md, « Ordre de réaction ») : d'abord les héros qui n'ont pas encore
 * lancé, puis les blocs du livre qui ont au moins un combattant. `heroes` ne contient que les héros qui participent ; un adversaire
 * exclu reste dans son bloc, marqué, pour pouvoir le réintégrer. Coriaces et piétaille sont bloqués au round 1 dès qu'un héros obtient
 * un succès héroïque ou légendaire. */
export function reactionLanes(heroes: readonly ReactionHero[], adversaries: readonly ReactionAdversary[]): readonly ReactionLane[] {
  const locked = heroes.some((h) => h.resultat === 'heroique' || h.resultat === 'legendaire');
  const heroToken = (h: ReactionHero): ReactionToken => {
    const word = h.resultat ? HERO_RANK_WORD[h.resultat] : undefined;
    const total = h.total === null ? '' : `total ${h.total}`;
    return {kind: 'hero', pivotId: h.pivotId, nom: h.nom, avatar: h.avatar, detail: word && total ? `${total} · ${word}` : (word ?? total), excluded: false};
  };
  const rank = (h: ReactionHero): number => (h.resultat ? HERO_RANK[h.resultat] : undefined) ?? 0;
  const heroTokens = (lane: 'heros' | 'echec' | 'echec_critique'): readonly ReactionToken[] =>
    heroes
      .filter((h) => h.resultat !== null && HERO_LANE[h.resultat] === lane)
      .sort((a, b) => rank(a) - rank(b))
      .map(heroToken);
  const adversaryTokens = (rang: ReactionAdversary['rang']): readonly ReactionToken[] =>
    adversaries
      .filter((a) => a.rang === rang)
      .map((a) => ({kind: a.kind, pivotId: a.pivotId, nom: a.nom, avatar: a.avatar, detail: a.ally ? 'allié' : '', excluded: a.excluded}));

  const lanes: readonly ReactionLane[] = [
    {id: 'attente', title: 'À lancer', blocked: false, tokens: heroes.filter((h) => h.resultat === null).map(heroToken)},
    {id: 'heros', title: 'Héros', blocked: false, tokens: heroTokens('heros')},
    {id: 'rival', title: 'Rivaux', blocked: false, tokens: adversaryTokens('rival')},
    {id: 'coriace', title: 'Coriaces', blocked: locked, tokens: adversaryTokens('coriace')},
    {id: 'echec', title: 'Héros en échec', blocked: false, tokens: heroTokens('echec')},
    {id: 'pietaille', title: 'Piétaille', blocked: locked, tokens: adversaryTokens('pietaille')},
    {id: 'echec_critique', title: 'Échec critique', blocked: false, tokens: heroTokens('echec_critique')},
  ];
  return lanes.filter((lane) => lane.tokens.length > 0);
}
