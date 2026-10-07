import {map, Observable, of} from 'rxjs';
import {BolHerosService} from '../services/bol-heros.service';
import {firstEquippedDegats} from '../shared/arme/arme-equipee';
import {PlayToken} from './models/combat-play.model';
import {ResolvedCombatStats} from './models/combat-attack.model';

/** Extrait le type de dé de dégâts d'une chaîne d'arme/créature BoL ("d6M", "d6B", "d3", "d6"). */
function parseDegatsDice(degats: string | null | undefined): 'd3' | 'd6' | 'd6m' | 'd6b' {
  const s = (degats ?? '').toLowerCase();
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

/** Combat à deux armes (02-actions-combat.md) : uniquement avec des armes légères ou moyennes —
 * mains nues/arme improvisée (d3) comptent comme légères, une arme lourde (d6B) n'est jamais éligible. */
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

function firstArmureProtection(armures: BolHerosArmureLike[] | number[] | undefined): string | null {
  if (!armures || armures.length === 0 || typeof armures[0] === 'number') {
    return null;
  }
  return (armures as BolHerosArmureLike[])[0]?.armure?.protection ?? null;
}

interface BolHerosArmureLike {
  armure?: {protection: string | null};
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
        bouclierMalusUneAttaque: 0,
        herosId: null,
        heroisme: null,
      });
    }

    return herosService.heros(herosId).pipe(
      map((hero) => ({
        agilite: hero.attributs.agilite_effective,
        vigueur: hero.attributs.vigueur,
        melee: hero.combat.melee,
        tir: hero.combat.tir,
        attaque: null,
        defense: hero.combat.defense_effective,
        degats: firstEquippedDegats(hero.armes) ?? 'd3',
        protection: parseProtectionValue(firstArmureProtection(hero.armures)),
        bouclierMalusUneAttaque:
          hero.equipement_effectif.bouclier_malus_attaque_subie_portee === 'une'
            ? hero.equipement_effectif.bouclier_malus_attaque_subie
            : 0,
        herosId,
        heroisme: hero.ressources.heroisme,
      })),
    );
  }

  return of({
    agilite: c.agilite ?? 0,
    vigueur: c.vigueur ?? 0,
    melee: c.melee ?? 0,
    tir: c.tir ?? 0,
    attaque: c.attaque,
    defense: c.defense ?? 0,
    degats: c.degats ?? 'd3',
    protection: parseProtectionValue(c.protection),
    bouclierMalusUneAttaque: 0,
    herosId: null,
    heroisme: null,
  });
}
