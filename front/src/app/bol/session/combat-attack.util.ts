import {catchError, map, Observable, of} from 'rxjs';
import {AVANTAGE_ARME_FAVORITE_ID, AVANTAGE_PEAU_DURE_ID} from '../bol-rules.constants';
import {BolHerosModel} from '../models/bol-heros.model';
import {BolHerosTraitsModel} from '../models/bol-trait.model';
import {BolHerosService} from '../services/bol-heros.service';
import {firstEquippedDegats} from '../shared/arme/arme-equipee';
import {PlayToken} from './models/combat-play.model';
import {degatsEnMain} from './combat-resolution.util';
import {ResolvedCombatStats} from './models/combat-attack.model';
import {TapisCard, TapisKind} from './models/tapis.model';

/** Extrait le type de dé de dégâts d'une chaîne d'arme/créature BoL ("d6M", "d6B", "d3", "d6") ; une arme polyvalente (« d6 ou d6B »)
 * compte pour son dé à une main. */
function parseDegatsDice(degats: string | null | undefined): 'd3' | 'd6' | 'd6m' | 'd6b' {
  const s = (degatsEnMain(degats ?? null, false) ?? '').toLowerCase();
  if (s.includes('d3')) {
    return 'd3';
  }
  if (s.includes('m')) {
    return 'd6m';
  }
  if (s.includes('b')) {
    return 'd6b';
  }
  return 'd6';
}

/** Combat à deux armes (02-actions-combat.md) : uniquement avec des armes légères ou moyennes ; une arme lourde (d6B) n'est jamais
 * éligible. Les mains nues et l'arme improvisée sont écartées plus haut (`isDualWieldWeapon`), ce ne sont pas des armes du héros. */
export function isDualWieldEligible(degats: string | null | undefined): boolean {
  return !!degats && parseDegatsDice(degats) !== 'd6b';
}

/** Poids d'une arme pour la table de montée en catégorie du mode "double frappe" — mains nues /
 * arme improvisée (d3) comptent comme légères (poids 1), moyenne (d6) pèse 2. */
function dualWieldWeight(degats: string | null | undefined): number {
  return parseDegatsDice(degats) === 'd6' ? 2 : 1;
}

/** Dégâts résultants du mode "double frappe" (02-actions-combat.md) : 2 armes légères → dégâts
 * d'arme moyenne ; 1 moyenne + 1 légère, ou 2 moyennes → dégâts d'arme lourde. */
export function dualStrikeDegats(mainDegats: string | null | undefined, offDegats: string | null | undefined): string {
  return dualWieldWeight(mainDegats) + dualWieldWeight(offDegats) >= 3 ? 'd6B' : 'd6';
}

/** Extrait la valeur fixe entre parenthèses d'une chaîne de protection BoL ("d6-3 (1)" -> 1). */
function parseProtectionValue(protection: string | null | undefined): number {
  const match = (protection ?? '').match(/\((-?\d+)\)/);
  return match ? parseInt(match[1], 10) : 0;
}

interface BolHerosArmureLike {
  readonly equipee?: boolean;
  readonly armure?: {readonly protection: string | null; readonly categorie?: string | null};
}

/** Protection du héros d'après ce qu'il porte : l'armure équipée (légère, moyenne, lourde) et, s'il y en a un d'équipé, le casque qui
 * ajoute +1 ; `bonus` s'y ajoute (Peau dure, même sans armure). `text` est la forme écrite du livre (« d6-1 (3) +1 »), `value` la
 * valeur fixe retenue pour les dégâts. */
export function equippedProtection(armures: readonly (BolHerosArmureLike | number)[] | undefined, bonus = 0): {text: string | null; value: number} {
  const worn = (armures ?? []).filter((a): a is BolHerosArmureLike => typeof a === 'object' && a.equipee !== false);
  const body = worn.find((a) => a.armure?.categorie === 'armure')?.armure?.protection ?? null;
  const helmet = worn.some((a) => a.armure?.categorie === 'casque');
  const total = (helmet ? 1 : 0) + bonus;
  const value = parseProtectionValue(body) + total;
  if (body === null && total === 0) {
    return {text: null, value: 0};
  }
  return {text: body === null ? String(total) : `${body}${total > 0 ? ` +${total}` : ''}`, value};
}

/** Peau dure : +1 en protection, même sans armure ; 0 sans l'avantage. */
export function bonusPeauDure(traits: readonly BolHerosTraitsModel[] | undefined): number {
  return (traits ?? []).some((t) => t.type === 'A' && Number(t.traitable_id) === AVANTAGE_PEAU_DURE_ID) ? 1 : 0;
}

/** Porte un bouclier : une armure de catégorie « bouclier », équipée — ou toutes, pour un PNJ qui porte tout ce qu'il possède. */
function porteBouclier(armures: readonly (BolHerosArmureLike | number)[] | undefined, toutCompte = false): boolean {
  return (armures ?? []).some((a) => typeof a === 'object' && (toutCompte || a.equipee !== false) && a.armure?.categorie === 'bouclier');
}

/** L'arme favorite d'une fiche : la précision de son avantage « Arme favorite » ; `null` sans l'avantage ou sans arme nommée. */
export function armeFavoriteDe(traits: readonly BolHerosTraitsModel[] | undefined): string | null {
  const trait = (traits ?? []).find((t) => t.type === 'A' && Number(t.traitable_id) === AVANTAGE_ARME_FAVORITE_ID && !!t.detail?.trim());
  return trait?.detail?.trim() ?? null;
}

/** Malus d'un petit bouclier porté : −1 à UNE attaque subie par round. Un grand bouclier (toutes les attaques) n'est pas concerné. */
function shieldMalusOnOneAttack(hero: Pick<BolHerosModel, 'equipement_effectif'>): number {
  return hero.equipement_effectif.bouclier_malus_attaque_subie_portee === 'une' ? hero.equipement_effectif.bouclier_malus_attaque_subie : 0;
}

/**
 * Résout les stats de combat d'un jeton. Un héros n'a rien de snapshoté dans la session : ses
 * stats sont récupérées en direct via `BolHerosService`. Les autres types (pnj/créature/démon)
 * utilisent le snapshot déjà présent sur le jeton.
 */
export function resolveAttackStats(token: PlayToken, herosService: BolHerosService): Observable<ResolvedCombatStats> {
  const c = token.combat;

  if (token.kind === 'hero') {
    const herosId = c.sourceId;
    if (!herosId) {
      return of({
        agilite: 0,
        vigueur: 0,
        melee: 0,
        tir: 0,
        attaque: null,
        defense: 0,
        degats: 'd3',
        protection: 0,
        protectionText: null,
        bouclierMalusUneAttaque: 0,
        bouclierDefenseToutes: 0,
        herosId: null,
        heroisme: null,
      });
    }

    return herosService.heros(herosId).pipe(
      map((hero) => {
        const protection = equippedProtection(hero.armures, bonusPeauDure(hero.traits));
        return {
        agilite: hero.attributs.agilite_effective,
        equipementAgilite: hero.attributs.agilite_effective - hero.attributs.agilite,
        vigueur: hero.attributs.vigueur,
        melee: hero.combat.melee,
        tir: hero.combat.tir,
        attaque: null,
        defense: hero.combat.defense_effective,
        degats: firstEquippedDegats(hero.armes) ?? 'd3',
        protection: protection.value,
        protectionText: protection.text,
        bouclierMalusUneAttaque: shieldMalusOnOneAttack(hero),
        bouclierDefenseToutes: hero.equipement_effectif.bouclier_defense_toutes ?? 0,
        bouclier: porteBouclier(hero.armures),
        armeFavorite: armeFavoriteDe(hero.traits),
        herosId,
        heroisme: hero.ressources.heroisme,
        };
      }),
    );
  }

  const snapshot: ResolvedCombatStats = {
    agilite: c.agilite ?? 0,
    vigueur: c.vigueur ?? 0,
    melee: c.melee ?? 0,
    tir: c.tir ?? 0,
    attaque: c.attaque,
    defense: c.defense ?? 0,
    degats: c.degats ?? 'd3',
    protection: parseProtectionValue(c.protection),
    protectionText: c.protection || null,
    bouclierMalusUneAttaque: 0,
    bouclierDefenseToutes: 0,
    herosId: null,
    // La vilénie d'un rival sert comme des points d'héroïsme (04-pnj-creatures-demons.md, « Points de vilenie »).
    heroisme: c.vilenie ?? null,
    attaqueAvantages: c.attaqueAvantages ?? [],
    attaqueDesavantages: c.attaqueDesavantages ?? [],
  };

  // Un PNJ est une fiche de héros : l'armure qu'il porte n'est pas copiée à la table, on la lit sur sa fiche. Il porte tout ce qu'il
  // possède — les profils du livre donnent ses valeurs « avec armure » — donc son agilité et sa défense sont celles de sa fiche avec
  // tout son équipement (une table posée avant ce principe garde encore ses valeurs sans armure), et toutes ses armures comptent.
  if (token.kind === 'pnj' && c.sourceId) {
    return herosService.heros(c.sourceId).pipe(
      map((pnj) => {
        const protection = equippedProtection(
          pnj.armures.map((armure) => (typeof armure === 'object' ? {...armure, equipee: true} : armure)),
          bonusPeauDure(pnj.traits),
        );
        return {
          ...snapshot,
          agilite: pnj.attributs.agilite_effective,
          equipementAgilite: pnj.attributs.agilite_effective - pnj.attributs.agilite,
          defense: pnj.combat.defense_effective,
          protection: protection.value,
          protectionText: protection.text,
          bouclierMalusUneAttaque: shieldMalusOnOneAttack(pnj),
          bouclierDefenseToutes: pnj.equipement_effectif.bouclier_defense_toutes ?? 0,
          bouclier: porteBouclier(pnj.armures, true),
          armeFavorite: armeFavoriteDe(pnj.traits),
        };
      }),
      catchError(() => of(snapshot)),
    );
  }

  return of(snapshot);
}

/** Le nom des points qu'une carte dépense pour les options héroïques : l'héroïsme d'un héros, la vilénie d'un rival. */
export function nomDesPoints(kind: TapisKind): 'héroïsme' | 'vilénie' {
  return kind === 'hero' ? 'héroïsme' : 'vilénie';
}

/** « Bouclier humain » (04-pnj-creatures-demons.md, « Points de vilenie ») : la piétaille encore debout du camp du rival qui peut
 * s'interposer à sa place — la première dans l'ordre des cartes ; `null` s'il n'y en a aucune. */
export function sbireBouclier(rival: TapisCard, cartes: readonly TapisCard[]): TapisCard | null {
  return (
    cartes.find(
      (carte) => carte.key !== rival.key && carte.camp === rival.camp && carte.rang === 'Piétaille' && (carte.vitaliteCourante === null || carte.vitaliteCourante > 0),
    ) ?? null
  );
}

/** « 1 point d'héroïsme », « 2 points de vilénie » : un nombre de points d'une carte, accordé. */
export function libellePoints(kind: TapisKind, nombre: number): string {
  const nom = nomDesPoints(kind);
  return `${nombre} ${nombre > 1 ? 'points' : 'point'} ${nom === 'héroïsme' ? 'd’héroïsme' : 'de vilénie'}`;
}
