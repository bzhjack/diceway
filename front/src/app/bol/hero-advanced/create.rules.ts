import {BolHerosCarriereModel} from '../models/bol-carriere.model';

export const LEMURIAN_LANGUAGE_ID = 9;

export const HERO_LANGUAGE_CAREER_IDS = [1, 12, 14, 16, 18, 21, 22, 24] as const;

export const NATIVE_LANGUAGE_BY_REGION_ID: Record<number, number> = {
  2: 3,
  3: 3,
  4: 1,
  7: 10,
  8: 6,
  9: 8,
  10: 2,
  13: 4,
  15: 11,
  19: 13,
};

interface RegionCareerRule {
  readonly firstCareerId?: number;
  readonly requiredCareerIds?: readonly number[];
  readonly forbiddenCareerIds?: readonly number[];
}

export const REGION_CAREER_RULES: Record<number, RegionCareerRule> = {
  2: {firstCareerId: 3},
  4: {requiredCareerIds: [13]},
  10: {firstCareerId: 3},
  13: {firstCareerId: 3, forbiddenCareerIds: [1, 14, 22, 24]},
  19: {requiredCareerIds: [3]},
};

export function automaticLanguageIdsForRegion(regionId: number | null | undefined): number[] {
  if (!regionId) {
    return [];
  }

  const nativeLanguageId = NATIVE_LANGUAGE_BY_REGION_ID[regionId];
  if (!nativeLanguageId) {
    return [LEMURIAN_LANGUAGE_ID];
  }

  if (nativeLanguageId === LEMURIAN_LANGUAGE_ID) {
    return [LEMURIAN_LANGUAGE_ID];
  }

  return [LEMURIAN_LANGUAGE_ID, nativeLanguageId];
}

export function selectedLanguageTarget(
  regionId: number | null | undefined,
  esprit: number,
  carrieres: readonly BolHerosCarriereModel[],
): number {
  if (!regionId) {
    return 0;
  }

  const careerBonus = carrieres
    .filter((carriere) => HERO_LANGUAGE_CAREER_IDS.includes((carriere.carriere_id ?? -1) as never))
    .reduce((sum, carriere) => sum + Number(carriere.value ?? 0), 0);
  const automaticLanguageIds = automaticLanguageIdsForRegion(regionId);
  const originChoiceBonus = automaticLanguageIds.length === 1 ? 1 : 0;

  return Math.max(Number(esprit ?? 0), 0) + careerBonus + originChoiceBonus;
}
