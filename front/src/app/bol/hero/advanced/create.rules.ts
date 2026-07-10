import {BolHerosCarriereModel} from '../../models/bol-carriere.model';
import {BolRegionModel} from '../../models/bol-region.model';
import {BolLangueModel} from '../../models/bol-langue.model';

export function lemurianLanguage(langues: BolLangueModel[] | null | undefined): BolLangueModel | null {
  return langues?.find((l) => l.est_lemurienne) ?? null;
}

export function automaticLanguageIdsForRegion(
  region: BolRegionModel | null | undefined,
  langues: BolLangueModel[] | null | undefined,
): number[] {
  const lemurian = lemurianLanguage(langues);
  if (!region || !lemurian?.id) return [];

  const lemuriId = Number(lemurian.id);
  const nativeId = region.langue_native_id ? Number(region.langue_native_id) : null;

  if (!nativeId || nativeId === lemuriId) return [lemuriId];
  return [lemuriId, nativeId];
}

export function selectedLanguageTarget(
  region: BolRegionModel | null | undefined,
  esprit: number,
  carrieres: readonly BolHerosCarriereModel[],
  langues: BolLangueModel[] | null | undefined,
): number {
  if (!region) return 0;

  const careerBonus = carrieres
    .filter((c) => c.carriere?.donne_langue)
    .reduce((sum, c) => sum + Number(c.value ?? 0), 0);

  const automaticIds = automaticLanguageIdsForRegion(region, langues);
  const originChoiceBonus = automaticIds.length === 1 ? 1 : 0;

  return Math.max(Number(esprit ?? 0), 0) + careerBonus + originChoiceBonus;
}
