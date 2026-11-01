import {DwRollSumTerm} from '../../../../shared/models/roll-sum.model';
import {nomDesPoints} from '../../combat-attack.util';
import {ModifierTerm} from '../../models/combat-effect.model';
import {TapisCard, TapisKind} from '../../models/tapis.model';
import {StatTile} from '../../models/turn-assistant.model';

/** Ce qu'est une carte, en clair. */
const KIND_LABELS: Readonly<Record<TapisKind, string>> = {hero: 'Héros', pnj: 'PNJ', creature: 'Créature', demon: 'Démon'};

/** Une protection au dé (« d6-2 (2) ») en tuile : sa valeur fixe en grand, son dé en petit ; une protection fixe reste telle quelle. */
export function protectionTile(text: string | null, fixed: number): StatTile {
  const die = text?.replace(/\s*\(\d+\)\s*$/, '').trim() ?? '';
  return /d\d/i.test(die) ? {label: 'Protection', value: String(fixed), sub: die.replace('-', '−')} : {label: 'Protection', value: text ?? String(fixed)};
}

/** Typographie d'un terme signé : « +2 », « −1 ». */
export function signedTerm(value: number): string {
  return `${value > 0 ? '+' : '−'}${Math.abs(value)}`;
}

/** Comme `signedTerm`, avec le 0 tel quel : « +1 · 0 » sur l'échelle des postures. */
export function signedOrZero(value: number): string {
  return value === 0 ? '0' : signedTerm(value);
}

/** De quel côté est une carte, en clair : « Héros », « Allié » ou « Adversaire », puis ce qu'elle est (« PNJ · Coriace ») pour tout ce
 * qui n'est pas un héros. */
export function sideOf(card: TapisCard): {readonly foe: boolean; readonly label: string; readonly detail: string} {
  const foe = card.camp !== 'heros';
  const label = foe ? 'Adversaire' : card.kind === 'hero' ? 'Héros' : 'Allié';
  const detail = card.kind === 'hero' ? (foe ? 'Héros' : '') : [KIND_LABELS[card.kind], card.rang].filter(Boolean).join(' · ');
  return {foe, label, detail};
}

/** Un modificateur hors registre (modificateur libre, carrière) en terme d'addition : « + 2 Voleur ». */
export function extraTerm(valeur: number, nom: string): ModifierTerm {
  return {effetId: null, label: `${valeur > 0 ? '+' : '−'} ${Math.abs(valeur)} ${nom}`, valeur, tone: valeur > 0 ? 'plus' : 'minus'};
}

/** Des points à montrer sous le titre « Héroïsme » ou « Vilénie » ; `null` pour une carte qui n'en a pas. */
export function pointsAffiches(kind: TapisKind, points: number | null): {points: number; titre: string} | null {
  if (points === null) {
    return null;
  }
  const nom = nomDesPoints(kind);
  return {points, titre: nom.charAt(0).toUpperCase() + nom.slice(1)};
}

/** Un modificateur du registre (« − 1 bouclier (Krongar) ») en terme d'addition : sa valeur, puis son nom dessous. */
export function sumTermOf(term: ModifierTerm): DwRollSumTerm {
  return {value: signedTerm(term.valeur), caption: term.label.replace(/^[+−] \d+ /, ''), tone: term.tone, ...(term.effetId ? {effetId: term.effetId} : {})};
}
