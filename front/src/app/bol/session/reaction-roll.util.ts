import {InitiativeResultat} from '../models/bol-fight-session.model';
import {actionResultTone} from './action-roll.util';
import {RollSumTerm} from './models/action-roll.model';
import {ReactionAdversary, ReactionHero, ReactionLane, ReactionParts, ReactionToken, ReactionVerdict} from './models/start-combat-dialog.model';

/** Seuil de réussite du jet de réaction BoL (02-actions-combat.md) — fixe, jamais modifié par les règles. */
export const REACTION_ROLL_THRESHOLD = 9;

/** Ce qui s'ajoute aux deux dés : esprit + initiative + embuscade − initiative ennemie. */
export function reactionModifier(parts: ReactionParts): number {
  return parts.esprit + parts.initiative + parts.embuscade - parts.initiativeEnnemie;
}

/** Résultat d'un jet de réaction d'après le total des deux dés. Le double 1 et le double 6 priment sur le seuil ; `heroisme` dit si le
 * héros a retenu l'option d'héroïsme qu'ils ouvrent : l'échec critique (qui rapporte 1 point) sur un double 1, le succès légendaire
 * (qui en coûte 1) sur un double 6. */
export function reactionResult(dice: number, modifier: number, heroisme = false): InitiativeResultat {
  if (dice === 2) {
    return heroisme ? 'echec_critique' : 'echec';
  }
  if (dice === 12) {
    return heroisme ? 'legendaire' : 'heroique';
  }
  return dice + modifier >= REACTION_ROLL_THRESHOLD ? 'reussite' : 'echec';
}

/** Titre de chaque résultat, et ce qu'il change au combat (02-actions-combat.md, « Jet de réaction »). */
const VERDICTS: Record<InitiativeResultat, readonly [title: string, detail: string]> = {
  reussite: ['Réussite', 'Agit avant tous les adversaires.'],
  echec: ['Échec', 'Agit après les coriaces, avant la piétaille.'],
  heroique: ['Succès héroïque', 'Double 6. Au round 1, coriaces et piétaille ne jouent pas.'],
  legendaire: ['Succès légendaire', 'Héroïque, et +1 à ses jets d’attaque pendant tout le combat.'],
  echec_critique: ['Échec critique', 'Agit en dernier. Au round 1, reste interdit et sans bouclier.'],
};

/** Le verdict d'un jet de réaction. `dice` est le total des deux dés : un double 1 dont l'échec critique n'a pas été retenu reste
 * un échec, mais on rappelle d'où il vient. */
export function reactionVerdict(result: InitiativeResultat, dice: number | null): ReactionVerdict {
  const [title, detail] = VERDICTS[result];
  return {title, detail: result === 'echec' && dice === 2 ? `Double 1. ${detail}` : detail, tone: actionResultTone(result)};
}

/** L'addition du jet de réaction, sur une ligne : un nombre par terme, son nom dessous. Les termes nuls sont omis. Avant le jet, elle
 * s'ouvre sur « 2d6 » et se ferme sur le seuil ; après, sur le total des dés et le total du jet. */
export function reactionSumTerms(dice: number | null, parts: ReactionParts): readonly RollSumTerm[] {
  const named: readonly (readonly [value: number, caption: string])[] = [
    [parts.esprit, 'esprit'],
    [parts.initiative, 'init.'],
    [parts.embuscade, parts.embuscade > 0 ? 'embusc.' : 'surpris'],
    [-parts.initiativeEnnemie, 'ennemi'],
  ];
  return [
    {value: dice === null ? '2d6' : `${dice}`, caption: 'dés', tone: 'dice'},
    ...named
      .filter(([value]) => value !== 0)
      .map(([value, caption]): RollSumTerm => ({value: `${value > 0 ? '+' : '−'}${Math.abs(value)}`, caption, tone: value > 0 ? 'plus' : 'minus'})),
    dice === null
      ? {value: `≥ ${REACTION_ROLL_THRESHOLD}`, caption: 'seuil', tone: 'total'}
      : {value: `= ${dice + reactionModifier(parts)}`, caption: `pour ${REACTION_ROLL_THRESHOLD}`, tone: 'total'},
  ];
}

/** Total des deux dés saisi dans la case d'un héros : un entier de 2 à 12, sinon `null`. Un « 1 » seul n'est pas un total — il attend
 * son second chiffre (10, 11, 12) — alors que de 2 à 9 un chiffre suffit : la saisie peut passer au héros suivant sans validation. */
export function parseDiceTotal(raw: string): number | null {
  const value = raw.trim();
  return /^([2-9]|1[0-2])$/.test(value) ? Number(value) : null;
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
    const total = h.total === null ? '' : `${h.total}`;
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
