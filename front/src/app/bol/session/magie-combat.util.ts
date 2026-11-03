import {AVANTAGE_MAGIE_DES_ROIS_SORCIERS_ID, CARRIERE_PRETRE_ID, CARRIERE_SORCIER_ID} from '../bol-rules.constants';
import {BolHerosArmureModel} from '../models/bol-armure.model';
import {BolHerosModel} from '../models/bol-heros.model';
import {CercleSort, CercleSortInfo, CoutSort, DifficulteSort, RessourcesMagiques, SortSaisie} from './models/magie-combat.model';
import {TapisCard} from './models/tapis.model';
import {ATTACK_THRESHOLD, suggestedAttackResult} from './combat-resolution.util';

/** « Résistant à la magie » (bol_avantage.id). */
const AVANTAGE_RESISTANT_MAGIE_ID = 47;

/** L'échelle des difficultés (livre p. 151) ; « automatique » ne vaut que pour un charme, qui se passe alors de jet. */
export const DIFFICULTES_SORT: readonly DifficulteSort[] = [
  {slug: 'automatique', label: 'Automatique', valeur: null},
  {slug: 'tres-facile', label: 'Très facile', valeur: 2},
  {slug: 'facile', label: 'Facile', valeur: 1},
  {slug: 'moyenne', label: 'Moyenne', valeur: 0},
  {slug: 'ardue', label: 'Ardue', valeur: -1},
  {slug: 'difficile', label: 'Difficile', valeur: -2},
  {slug: 'tres-difficile', label: 'Très difficile', valeur: -4},
  {slug: 'impossible', label: 'Impossible', valeur: -6},
  {slug: 'heroique', label: 'Héroïque', valeur: -8},
];

/** Les quatre puissances de sort (livre p. 149-153 et table p. 151). Les dégâts au-delà du 1er cercle sont une interprétation
 * (`doc/rules/05-alchimie-foi-sorcellerie.md`). */
export const CERCLES_SORT: readonly CercleSortInfo[] = [
  {cercle: 0, label: 'Charme', coutBase: 1, coutMin: 1, difficultes: ['automatique', 'tres-facile', 'facile'], degats: '1', conditions: 'Aucune condition. Jet seulement s’il affecte directement une créature.'},
  {
    cercle: 1,
    label: '1er cercle',
    coutBase: 5,
    coutMin: 2,
    difficultes: ['moyenne', 'ardue'],
    degats: 'd6',
    conditions: 'Objet spécial, ligne de vue, temps d’incantation (1d6 × 30 min), focaliseur, connaissances spéciales, ostentation, heure propice, purification, blessures (d3), rituel de groupe (d6 assistants).',
  },
  {
    cercle: 2,
    label: '2e cercle',
    coutBase: 10,
    coutMin: 6,
    difficultes: ['difficile', 'tres-difficile'],
    degats: 'd6x2',
    conditions: 'Objet spécial rare, ingrédients rares, focaliseur permanent, temps d’incantation (d6 × 2 h), sacrifice animal, lune, jeûne, blessures (d6+1), rituel de groupe (2d6).',
  },
  {
    cercle: 3,
    label: '3e cercle',
    coutBase: 15,
    coutMin: 11,
    difficultes: ['impossible', 'heroique'],
    degats: 'd6x3',
    conditions: 'Mortification, temps d’incantation (3d6 h), sacrifice intelligent, conjonction astrale, lieu de pouvoir, transformation démoniaque, blessures (2d6+1), rituel de groupe (3d6). Chaque sort coûte en plus 1 point de pouvoir définitif.',
  },
];

export function cercleSort(cercle: CercleSort): CercleSortInfo {
  return CERCLES_SORT[cercle];
}

/** Un cran de l'échelle par son slug ; « Moyenne » pour un slug inconnu. */
export function difficulteSort(slug: string): DifficulteSort {
  return DIFFICULTES_SORT.find((d) => d.slug === slug) ?? DIFFICULTES_SORT[3];
}

/** Le sort que propose l'assistant : 1er cercle, difficulté Moyenne, la seule condition obligatoire, sans dégâts. */
export function saisieSortParDefaut(): SortSaisie {
  return {cercle: 1, difficulte: 'moyenne', conditions: 1, coutCharme: 1, blessant: false, espritCible: false};
}

/** Une autre puissance : sa difficulté repart de la première que le livre lui donne (un charme qui vise une créature : Facile). */
export function changerCercle(saisie: SortSaisie, cercle: CercleSort): SortSaisie {
  const difficulte = cercle === 0 ? 'facile' : cercleSort(cercle).difficultes[0];
  return {...saisie, cercle, difficulte, conditions: Math.max(1, saisie.conditions)};
}

/** Le coût d'un sort (livre p. 150-153) : la base de sa puissance, moins 1 par condition remplie au-delà de la première, sans descendre
 * sous le minimum ; un charme coûte 1 ou 2 points, sans condition. Le surcoût de l'armure (p. 148) s'ajoute ensuite. */
export function coutSort(saisie: SortSaisie, surcoutArmure: number): CoutSort {
  const info = cercleSort(saisie.cercle);
  const armure = Math.max(0, surcoutArmure);
  if (saisie.cercle === 0) {
    const base = Math.max(info.coutMin, Math.min(2, saisie.coutCharme));
    return {base, reduction: 0, armure, total: base + armure};
  }
  const reduction = Math.min(Math.max(0, saisie.conditions - 1), info.coutBase - info.coutMin);
  return {base: info.coutBase, reduction, armure, total: info.coutBase - reduction + armure};
}

/** Ce qui s'ajoute aux deux dés du jet de sort (p. 148) : esprit + sorcier ± difficulté, moins l'esprit de la cible pour un sort qui
 * agit sur son esprit (`espritCible`, `null` sinon). */
export function modificateurSort(jet: {readonly esprit: number; readonly sorcier: number; readonly difficulte: number; readonly espritCible: number | null}): number {
  return jet.esprit + jet.sorcier + jet.difficulte - (jet.espritCible ?? 0);
}

/** Les dégâts d'un sort destiné à blesser : d6 au 1er cercle (p. 150) ; 1 pour un charme (« Douleur », p. 150) ; d6 ×2 et ×3 aux 2e et 3e
 * cercles (interprétation, comme les créations alchimiques légendaires et mythiques). */
export function degatsSort(cercle: CercleSort): string {
  return cercleSort(cercle).degats;
}

/** L'issue d'un jet de sort (livre p. 148, et 02-actions-combat.md) : réussi à 9 ou plus ; un double 1 échoue et un double 6 réussit,
 * quel que soit le total ; un double 6 au-dessus du seuil est un succès héroïque, pour les héros et leurs alliés (`heroiqueAdmis`).
 * `des` : les deux dés gardés, s'ils sont connus. */
export function issueSort(des: readonly [number, number] | null, somme: number, total: number, heroiqueAdmis: boolean): 'reussite' | 'heroique' | 'echec' {
  const issue = suggestedAttackResult(des ?? [0, somme], total, ATTACK_THRESHOLD);
  return issue === 'heroique' ? (heroiqueAdmis ? 'heroique' : 'reussite') : issue === 'reussite' ? 'reussite' : 'echec';
}

/** Un charme automatique se lance sans jet. */
export function sortSansJet(saisie: SortSaisie): boolean {
  return difficulteSort(saisie.difficulte).valeur === null;
}

/** Il reste assez de points de pouvoir pour payer le sort. */
export function pouvoirSuffisant(pouvoir: number | null, cout: number): boolean {
  return pouvoir !== null && pouvoir >= cout;
}

/** Le surcoût en points de pouvoir de l'armure portée (« +2 » d'une armure moyenne, livre p. 52 et 148) ; `toutCompte` : un PNJ porte
 * tout ce qu'il possède. */
export function surcoutArmure(armures: readonly (BolHerosArmureModel | number)[] | undefined, toutCompte = false): number {
  return (armures ?? []).reduce<number>((total, a) => {
    if (typeof a !== 'object' || (!toutCompte && a.equipee === false)) {
      return total;
    }
    const points = Number((a.armure?.pts_de_pouvoir ?? '').match(/\d+/)?.[0] ?? 0);
    return total + points;
  }, 0);
}

/** Le rang d'une carrière sur une fiche ; `null` sans la carrière. */
function rang(fiche: BolHerosModel, carriere: number): number | null {
  const entree = (fiche.carrieres ?? []).find((c) => Number(c.carriere_id) === carriere);
  return entree ? entree.value : null;
}

/** La magie d'une fiche : sa foi (un prêtre ou un druide de rang 1 ou plus, livre p. 146), son pouvoir et son rang de sorcier (p. 148),
 * le surcoût de son armure et ses avantages magiques. Les points sont ceux de la fiche (un héros les dépense sur elle), ou ceux de la
 * table (`courant`, la ligne d'un PNJ). */
export function ressourcesMagiques(fiche: BolHerosModel, courant?: {readonly foi: number | null; readonly pouvoir: number | null}, toutCompte = false): RessourcesMagiques {
  const pretre = rang(fiche, CARRIERE_PRETRE_ID);
  const sorcier = rang(fiche, CARRIERE_SORCIER_ID);
  const foiFiche = fiche.ressources?.foi ?? 0;
  const pouvoirFiche = fiche.ressources?.pouvoir ?? 0;
  const aDeLaFoi = (pretre ?? 0) > 0 || foiFiche > 0;
  const aDuPouvoir = sorcier !== null || pouvoirFiche > 0;
  const foi = courant ? (courant.foi ?? (aDeLaFoi ? 0 : null)) : aDeLaFoi ? foiFiche : null;
  const pouvoir = courant ? (courant.pouvoir ?? (aDuPouvoir ? 0 : null)) : aDuPouvoir ? pouvoirFiche : null;
  const avantages = (fiche.traits ?? []).filter((t) => t.type === 'A').map((t) => Number(t.traitable_id));
  return {
    esprit: fiche.attributs?.esprit ?? 0,
    foi,
    pouvoir,
    sorcier: aDuPouvoir ? (sorcier ?? 0) : null,
    surcoutArmure: surcoutArmure(fiche.armures, toutCompte),
    magieRoisSorciers: avantages.includes(AVANTAGE_MAGIE_DES_ROIS_SORCIERS_ID),
    resistantMagie: avantages.includes(AVANTAGE_RESISTANT_MAGIE_ID),
  };
}

/** Les êtres qu'un prêtre peut voir, pour un dé de foi : les cartes encore en combat (ni retirées ni enfuies) et debout. */
export function cartesVisibles(cartes: readonly TapisCard[], exclus: readonly string[]): readonly TapisCard[] {
  return cartes.filter((c) => !exclus.includes(c.key) && (c.vitaliteCourante === null || c.vitaliteCourante > 0));
}
