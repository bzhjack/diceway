import {BolDemonCategorieModel} from '../../models/bol-demon.model';
import {hasPouvoir} from '../../session/combat-play.util';
import {DemonConformite, DemonRegleEtat, DemonRegleLigne, DemonValeurs} from '../models/demon-regles.model';

/** Les points à répartir selon la catégorie (livre p. 129-130), et le maximum dans un attribut ou une aptitude (aucun pour un mineur). */
const BUDGETS: Readonly<Record<'P' | 'C' | 'R', {readonly points: number; readonly max: number | null; readonly nom: string}>> = {
  P: {points: 2, max: null, nom: 'mineur'},
  C: {points: 6, max: 4, nom: 'inférieur'},
  R: {points: 12, max: 6, nom: 'majeur'},
};

/** Un attribut peut descendre jusqu'à −2, pour deux attributs au plus (les points rendus se reportent sur les autres). */
const ATTRIBUT_MIN = -2;
const ATTRIBUTS_NEGATIFS_MAX = 2;

const ATTRIBUTS = [
  {cle: 'vigueur', nom: 'Vigueur'},
  {cle: 'agilite', nom: 'Agilité'},
  {cle: 'esprit', nom: 'Esprit'},
  {cle: 'aura', nom: 'Aura'},
] as const;

const APTITUDES = [
  {cle: 'melee', nom: 'Mêlée'},
  {cle: 'tir', nom: 'Tir'},
  {cle: 'defense', nom: 'Défense'},
] as const;

function points(n: number): string {
  return `${n} point${n > 1 ? 's' : ''}`;
}

/** Un budget : tout dépensé, des points à répartir (permis, le livre en laisse lui-même), ou des points de trop. */
function ligneDeBudget(cle: 'attributs' | 'aptitudes', libelle: string, valeur: number, attendu: number): DemonRegleLigne {
  const etat: DemonRegleEtat = valeur === attendu ? 'ok' : valeur < attendu ? 'reste' : 'depasse';
  const detail = etat === 'ok' ? 'Tout est réparti' : etat === 'reste' ? `${points(attendu - valeur)} à répartir` : `${points(valeur - attendu)} de trop`;
  return {cle, libelle, valeur, attendu, etat, detail};
}

/**
 * Le démon en cours face aux règles de création du livre (p. 129-130), pour le panneau « Selon le livre » : rien n'y est refusé.
 * - Attributs et aptitudes de combat (mêlée, tir, défense) : les points de la catégorie, et son maximum dans chacun ; un ou deux
 *   attributs peuvent descendre jusqu'à −2, leurs points se reportant sur les autres (la somme compte donc les négatifs).
 * - Pouvoirs : le nombre de la catégorie ; Cuirassé compte pour deux, Vulnérabilité en donne un de plus et n'en occupe pas.
 * - Vitalité : la base de la catégorie plus la vigueur. Les dégâts restent le dé de la catégorie : le combat ajoute ce qui s'ajoute.
 * `null` sans catégorie.
 */
export function conformiteDemon(
  valeurs: DemonValeurs,
  categorie: BolDemonCategorieModel | undefined,
  pouvoirs: readonly string[],
): DemonConformite | null {
  if (!categorie) {
    return null;
  }
  const budget = BUDGETS[categorie.type];
  const avertissements: string[] = [];

  const attributs = ATTRIBUTS.map((a) => ({...a, valeur: valeurs[a.cle]}));
  const aptitudes = APTITUDES.map((a) => ({...a, valeur: valeurs[a.cle]}));
  if (budget.max !== null) {
    for (const {nom, valeur} of [...attributs, ...aptitudes]) {
      if (valeur > budget.max) {
        avertissements.push(`${nom} ${valeur} : un démon ${budget.nom} n'a pas plus de ${budget.max}.`);
      }
    }
  }
  const negatifs = attributs.filter((a) => a.valeur < 0);
  for (const {nom, valeur} of negatifs.filter((a) => a.valeur < ATTRIBUT_MIN)) {
    avertissements.push(`${nom} ${valeur} : un attribut ne descend pas sous ${ATTRIBUT_MIN}.`);
  }
  if (negatifs.length > ATTRIBUTS_NEGATIFS_MAX) {
    avertissements.push(`${negatifs.length} attributs sous 0 : deux au plus.`);
  }
  for (const {nom, valeur} of aptitudes.filter((a) => a.valeur < 0)) {
    avertissements.push(`${nom} ${valeur} : une aptitude de combat ne descend pas sous 0.`);
  }

  const cuirasse = hasPouvoir(pouvoirs, 'cuirassé');
  const vulnerabilite = hasPouvoir(pouvoirs, 'vulnérabilité');
  const pouvoirsPris = pouvoirs.length - (vulnerabilite ? 1 : 0) + (cuirasse ? 1 : 0);
  const pouvoirsPermis = categorie.pouvoirs + (vulnerabilite ? 1 : 0);
  const pouvoirsEtat: DemonRegleEtat = pouvoirsPris === pouvoirsPermis ? 'ok' : pouvoirsPris < pouvoirsPermis ? 'reste' : 'depasse';
  const precisions = [cuirasse ? 'Cuirassé compte pour deux' : null, vulnerabilite ? 'Vulnérabilité en donne un de plus' : null].filter(Boolean);
  const pouvoirsDetail =
    (pouvoirsEtat === 'ok'
      ? 'Le compte y est'
      : pouvoirsEtat === 'reste'
        ? `${pouvoirsPermis - pouvoirsPris} à choisir`
        : `${pouvoirsPris - pouvoirsPermis} de trop`) + (precisions.length ? ` · ${precisions.join(', ')}` : '');

  const vitaliteAttendue = categorie.vitalite + valeurs.vigueur;

  return {
    lignes: [
      ligneDeBudget('attributs', 'Attributs', attributs.reduce((n, a) => n + a.valeur, 0), budget.points),
      ligneDeBudget('aptitudes', 'Aptitudes de combat', aptitudes.reduce((n, a) => n + a.valeur, 0), budget.points),
      {cle: 'pouvoirs', libelle: 'Pouvoirs', valeur: pouvoirsPris, attendu: pouvoirsPermis, etat: pouvoirsEtat, detail: pouvoirsDetail},
      {
        cle: 'vitalite',
        libelle: 'Vitalité',
        valeur: valeurs.vitalite,
        attendu: vitaliteAttendue,
        etat: valeurs.vitalite === vitaliteAttendue ? 'ok' : 'ecart',
        detail: `${categorie.vitalite} + vigueur ${valeurs.vigueur}`,
      },
    ],
    avertissements,
    vitaliteAttendue,
  };
}
