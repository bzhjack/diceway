import {
  ARMURE_LOURDE_ID,
  CARRIERE_EXIGEE_PAR_AVANTAGE,
  CARRIERES_LETTREES,
  CARRIERES_RESERVEES,
  DESAVANTAGE_ILLETTRE_ID,
} from '../../bol-rules.constants';
import {AttributModifier} from '../../models/bol-heros-state.model';
import {BolHerosTraitsModel} from '../../models/bol-trait.model';
import {ValidationIssue, AttributsValues, CombatValues} from '../models/create-validators.model';


/** R-ATTR-1 : un attribut est compris entre -1 et 3. */
export function attributRangeErrors(value: number): ValidationIssue | null {
  if (value < -1) {
    return {kind: 'tooSmallAttr', message: 'ne doit pas etre inferieur a -1.'};
  }
  if (value > 3) {
    return {kind: 'tooBigAttr', message: 'ne doit pas etre superieur a 3.'};
  }
  return null;
}

/** R-CARR-1 : un rang de carrière est compris entre 0 et 3. */
export function carriereRangeErrors(value: number): ValidationIssue | null {
  if (value < 0) {
    return {kind: 'tooSmallAttr', message: 'ne doit pas etre inferieur a 0.'};
  }
  if (value > 3) {
    return {kind: 'tooBigAttr', message: 'ne doit pas etre superieur a 3.'};
  }
  return null;
}

/** R-ATTR-2/3 : somme des 4 attributs ≤ 4, un seul peut descendre à -1. */
export function attributsBudgetErrors(values: AttributsValues): readonly ValidationIssue[] {
  const numbers = [values.vigueur, values.agilite, values.esprit, values.aura];
  const errors: ValidationIssue[] = [];

  if (numbers.filter((value) => value === -1).length > 1) {
    errors.push({kind: 'attrTooManyNegative', message: 'Un seul attribut peut descendre à -1.'});
  }
  if (numbers.reduce((sum, value) => sum + value, 0) > 4) {
    errors.push({kind: 'attrSumExceeded', message: 'La somme des attributs ne doit pas dépasser 4.'});
  }

  return errors;
}

/** R-COMBAT-1/2/3 : somme des aptitudes de combat ≤ budget, une seule peut descendre à -1. */
export function combatBudgetErrors(values: CombatValues, budget: number): readonly ValidationIssue[] {
  const numbers = [values.initiative, values.melee, values.tir, values.defense];
  const errors: ValidationIssue[] = [];

  if (numbers.filter((value) => value === -1).length > 1) {
    errors.push({kind: 'aptTooManyNegative', message: 'Une seule aptitude de combat peut descendre à -1.'});
  }
  if (numbers.reduce((sum, value) => sum + value, 0) > budget) {
    errors.push({
      kind: 'aptSumExceeded',
      message: `La somme des aptitudes de combat ne doit pas dépasser ${budget}.`,
    });
  }

  return errors;
}

/** R-CARR-2/3 : somme des rangs de carrières ≤ budget (4 normalement, 6 si Non-combattant). */
export function carrieresBudgetErrors(values: readonly number[], budget: number): readonly ValidationIssue[] {
  const sum = values.reduce((total, value) => total + value, 0);
  return sum > budget
    ? [{kind: 'carrSumExceeded', message: `La somme des carrières ne doit pas dépasser ${budget}.`}]
    : [];
}

/** R-TRAIT-CARR : les avantages choisis sans la carrière qu'ils exigent (Mains guérisseuses, Maître artisan, Envoûtant) ; posséder la
 * carrière, même au rang 0, suffit. */
export function avantagesSansCarriere(avantageIds: readonly number[], carriereIds: readonly number[]): {avantageId: number; carriereId: number}[] {
  return avantageIds.flatMap((avantageId) => {
    const carriereId = CARRIERE_EXIGEE_PAR_AVANTAGE[avantageId];
    return carriereId !== undefined && !carriereIds.includes(carriereId) ? [{avantageId, carriereId}] : [];
  });
}

/** R-CARR-RESERVEE : les carrières choisies qui sont réservées à une autre origine (pilote des airs : Satarla). Rien tant que l'origine
 * n'est pas choisie. */
export function carrieresReserveesHorsOrigine(
  carriereIds: readonly number[],
  regionId: number | null,
): {carriereId: number; regionId: number; region: string}[] {
  if (regionId === null) {
    return [];
  }
  return CARRIERES_RESERVEES.filter((reservee) => carriereIds.includes(reservee.carriereId) && reservee.regionId !== regionId).map(
    (reservee) => ({...reservee}),
  );
}

/** La vigueur de la fiche : la vigueur répartie plus les modificateurs de vigueur des traits (`traitsModifiers` : Vigueur céruléenne
 * +1…), celle que l'activation enregistre et dont la vitalité découle. */
export function vigueurEffective(vigueur: number, modifiers: readonly AttributModifier[]): number {
  return modifiers.filter((modifier) => modifier.attr === 'vigueur').reduce((total, modifier) => total + Number(modifier.value), vigueur);
}

/** R-ARMURE-LOURDE : « les personnages ayant moins de 0 en vigueur ne peuvent pas porter d'armure lourde » (livre p. 52) ; la vigueur
 * du personnage, bonus de traits compris (`vigueurEffective`). `armureIds` : les armures du catalogue choisies. */
export function armureLourdeInterdite(vigueur: number, modifiers: readonly AttributModifier[], armureIds: readonly number[]): boolean {
  return vigueurEffective(vigueur, modifiers) < 0 && armureIds.includes(ARMURE_LOURDE_ID);
}

/** Les ids du catalogue de tous les désavantages d'un héros : général, régional (`pivot.desavantage_id`) ou de carrière portent le même id. */
export function desavantageIdsDuHeros(traits: readonly Pick<BolHerosTraitsModel, 'type' | 'traitable_id'>[]): number[] {
  return traits.filter((trait) => trait.type === 'D').map((trait) => Number(trait.traitable_id));
}

/** R-ILLETTRE : un illettré ne peut pas choisir de carrière exigeant d'être lettré (livre p. 44) ; les carrières lettrées choisies, dans
 * l'ordre de `carriereIds`. `desavantageIds` : tous les désavantages du héros (`desavantageIdsDuHeros`), Illettré pris dans la liste
 * générale, comme désavantage régional ou de carrière. */
export function carrieresLettreesPourIllettre(desavantageIds: readonly number[], carriereIds: readonly number[]): number[] {
  return desavantageIds.includes(DESAVANTAGE_ILLETTRE_ID) ? carriereIds.filter((id) => CARRIERES_LETTREES.includes(id)) : [];
}

/** R-DESAV-GENERAUX (livre p. 46) : le 3e avantage exige un désavantage général (sinon 1 point d'héroïsme), et chaque avantage spécial
 * (Magie des Rois-Sorciers, Pouvoir du Néant) en exige un de plus. Un même désavantage ne couvre pas deux exigences : les désavantages
 * généraux servent d'abord les avantages spéciaux, seuls ceux qui restent couvrent le 3e avantage. `nbSpeciaux` : les avantages spéciaux
 * choisis. `troisiemeCouvert` est vrai aussi sous 3 avantages, où il n'y a rien à couvrir. */
export function desavantagesGeneraux(
  nbAvantages: number,
  nbGeneraux: number,
  nbSpeciaux: number,
): {speciauxManquants: number; troisiemeCouvert: boolean} {
  return {
    speciauxManquants: Math.max(nbSpeciaux - nbGeneraux, 0),
    troisiemeCouvert: nbAvantages < 3 || nbGeneraux - nbSpeciaux >= 1,
  };
}
