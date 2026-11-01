import {CARRIERE_MEDECIN_ID} from '../bol-rules.constants';
import {ACTION_DIFFICULTIES, DEFAULT_ACTION_DIFFICULTY} from './action-roll.util';
import {ActionDifficulty, ActionRollCarriere} from './models/action-roll.model';

/** Difficulté du jet pour stabiliser un mourant (02-actions-combat.md, « Secourir un mourant ») : Moyenne, aggravée d'un niveau par point
 * de vitalité négatif (−3 → Très difficile, −4), sans aller au-delà de la plus haute. */
export function rescueDifficulty(vitalite: number): ActionDifficulty {
  const base = ACTION_DIFFICULTIES.indexOf(DEFAULT_ACTION_DIFFICULTY);
  return ACTION_DIFFICULTIES[Math.min(ACTION_DIFFICULTIES.length - 1, base + Math.max(0, -vitalite))];
}

/** La carrière de soins du personnage — médecin, qui couvre le guérisseur et le rebouteux (doc/resources/carrieres.md) —, ou `null` s'il n'en a pas. */
export function bestHealingCareer(carrieres: readonly ActionRollCarriere[]): ActionRollCarriere | null {
  return carrieres.find((carriere) => carriere.id === CARRIERE_MEDECIN_ID) ?? null;
}

/** Soins médicaux après le combat (02-actions-combat.md, « Récupération ») : le blessé récupère tout de suite le rang du soigneur en
 * vitalité, sans dépasser son maximum. */
export function medicalCareAmount(vitalite: number, vitaliteMax: number, rang: number): number {
  return Math.max(0, Math.min(rang, vitaliteMax - vitalite));
}
